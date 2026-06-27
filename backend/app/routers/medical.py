import logging
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.medical import (
    HospitalCreate, HospitalUpdate, HospitalResponse,
    HospitalDetailResponse, DoctorDetailResponse,
    DoctorCreate, DoctorUpdate, DoctorResponse,
    PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse,
    ActiveMedicineResponse, VisitSummary,
    MedicineCreate,
)
from app.services.medical import HospitalService, DoctorService, PrescriptionService
from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"}

router = APIRouter(prefix="/api/v1/medical", tags=["medical"])


# --- Save pre-extracted (possibly user-edited) prescription data ---
class OCRMedicineSave(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    morning: bool = False
    afternoon: bool = False
    night: bool = False


class OCRPrescriptionSaveRequest(BaseModel):
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_qualification: Optional[str] = None
    doctor_registration_id: Optional[str] = None
    family_member_id: Optional[str] = None
    visit_date: str
    diagnosis: Optional[str] = None
    reason_for_visit: Optional[str] = None
    follow_up_date: Optional[str] = None
    medicines: list[OCRMedicineSave] = []


@router.post("/save-ocr-prescription", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def save_ocr_prescription(
    data: OCRPrescriptionSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save user-reviewed OCR prescription data (hospital/doctor auto-found/created)."""
    from uuid import UUID as _UUID
    from datetime import date as dt_date

    hospital_service = HospitalService(db)
    doctor_service = DoctorService(db)
    prescription_service = PrescriptionService(db)

    hospital_id = None
    if data.hospital_name and data.hospital_name.strip():
        hospital = await hospital_service.find_or_create_by_name(
            user_id=current_user.id,
            name=data.hospital_name.strip(),
            address=data.hospital_address,
            phone=data.hospital_phone,
        )
        hospital_id = hospital.id

    doctor_id = None
    if data.doctor_name and data.doctor_name.strip():
        doctor = await doctor_service.find_or_create(
            user_id=current_user.id,
            name=data.doctor_name.strip(),
            hospital_id=hospital_id,
            registration_id=data.doctor_registration_id,
            qualification=data.doctor_qualification,
        )
        doctor_id = doctor.id

    fm_id = None
    if data.family_member_id:
        try:
            fm_id = _UUID(data.family_member_id)
        except ValueError:
            pass

    medicines = [
        MedicineCreate(
            name=m.name,
            dosage=m.dosage,
            frequency=m.frequency,
            timing=m.timing,
            morning=m.morning,
            afternoon=m.afternoon,
            night=m.night,
        )
        for m in data.medicines
    ]

    prescription_create = PrescriptionCreate(
        family_member_id=fm_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        prescription_date=data.visit_date,
        diagnosis=data.diagnosis,
        reason_for_visit=data.reason_for_visit,
        follow_up_date=data.follow_up_date,
        medicines=medicines,
    )
    return await prescription_service.create_prescription(current_user.id, prescription_create)


# --- Visits (Medical tab main list) ---
@router.get("/visits", response_model=list[VisitSummary])
async def list_visits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrescriptionService(db)
    return await service.get_visits(current_user.id)


# --- OCR Prescription Save ---
@router.post("/ocr-prescription-save", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def ocr_prescription_save(
    file: UploadFile = File(...),
    language: str = Form("en"),
    family_member_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Extract prescription/bill data via AI and auto-create hospital, doctor, prescription, medicines."""
    from app.integrations.gemini import extract_prescription_data
    from datetime import date as dt_date

    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        data = await extract_prescription_data(image_bytes, file.content_type, language)
    except Exception:
        logger.exception("OCR prescription extraction failed")
        raise HTTPException(status_code=422, detail="Could not extract data from image")

    hospital_service = HospitalService(db)
    doctor_service = DoctorService(db)
    prescription_service = PrescriptionService(db)

    hospital_id = None
    if data.get("hospital_name"):
        hospital = await hospital_service.find_or_create_by_name(
            user_id=current_user.id,
            name=data["hospital_name"],
            address=data.get("hospital_address"),
            phone=data.get("hospital_phone"),
        )
        hospital_id = hospital.id

    doctor_id = None
    if data.get("doctor_name"):
        doctor = await doctor_service.find_or_create(
            user_id=current_user.id,
            name=data["doctor_name"],
            hospital_id=hospital_id,
            registration_id=data.get("doctor_registration_id"),
        )
        doctor_id = doctor.id

    raw_medicines = data.get("medicines", [])
    medicines = []
    for med in raw_medicines:
        timing_raw = (med.get("timing") or "").lower()
        if "before" in timing_raw:
            timing = "before_food"
        elif "with" in timing_raw:
            timing = "with_food"
        elif "after" in timing_raw:
            timing = "after_food"
        else:
            timing = None
        medicines.append(MedicineCreate(
            name=med.get("name", "Unknown"),
            dosage=med.get("dosage"),
            frequency=med.get("frequency"),
            duration_days=None,
            timing=timing,
            morning=bool(med.get("morning", False)),
            afternoon=bool(med.get("afternoon", False)),
            night=bool(med.get("night", False)),
        ))

    visit_date = data.get("visit_date") or dt_date.today().isoformat()
    fm_id = None
    if family_member_id and family_member_id.strip():
        from uuid import UUID as _UUID
        try:
            fm_id = _UUID(family_member_id)
        except ValueError:
            pass

    prescription_create = PrescriptionCreate(
        family_member_id=fm_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        prescription_date=visit_date,
        diagnosis=data.get("diagnosis"),
        reason_for_visit=data.get("reason_for_visit"),
        follow_up_date=data.get("follow_up_date"),
        medicines=medicines,
    )
    return await prescription_service.create_prescription(current_user.id, prescription_create)


# --- Hospitals ---
@router.get("/hospitals/details", response_model=list[HospitalDetailResponse])
async def list_hospitals_with_details(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = HospitalService(db)
    results = await service.list_hospitals_with_details(current_user.id)
    return [
        HospitalDetailResponse(
            **{k: getattr(r["hospital"], k) for k in HospitalResponse.__fields__},
            last_visit_date=r["last_visit_date"],
            visit_count=r["visit_count"],
            doctors=r["doctors"],
        )
        for r in results
    ]


@router.get("/hospitals", response_model=list[HospitalResponse])
async def list_hospitals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = HospitalService(db)
    return await service.list_hospitals(current_user.id)


@router.post("/hospitals", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
async def create_hospital(
    data: HospitalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = HospitalService(db)
    return await service.create_hospital(current_user.id, data)


@router.get("/hospitals/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(
    hospital_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = HospitalService(db)
    hospital = await service.get_hospital(current_user.id, hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.put("/hospitals/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(
    hospital_id: UUID,
    data: HospitalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = HospitalService(db)
    hospital = await service.get_hospital(current_user.id, hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return await service.update_hospital(hospital, data)


@router.delete("/hospitals/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospital(
    hospital_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = HospitalService(db)
    hospital = await service.get_hospital(current_user.id, hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    await service.delete_hospital(hospital)


# --- Doctors ---
@router.get("/doctors/details", response_model=list[DoctorDetailResponse])
async def list_doctors_with_details(
    hospital_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DoctorService(db)
    results = await service.list_doctors_with_details(current_user.id, hospital_id)
    return [
        DoctorDetailResponse(
            **{k: getattr(r["doctor"], k) for k in DoctorResponse.__fields__},
            last_visit_date=r["last_visit_date"],
            visit_count=r["visit_count"],
        )
        for r in results
    ]


@router.get("/doctors", response_model=list[DoctorResponse])
async def list_doctors(
    hospital_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DoctorService(db)
    return await service.list_doctors(current_user.id, hospital_id)


@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    data: DoctorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DoctorService(db)
    return await service.create_doctor(current_user.id, data)


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(
    doctor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DoctorService(db)
    doctor = await service.get_doctor(current_user.id, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id: UUID,
    data: DoctorUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DoctorService(db)
    doctor = await service.get_doctor(current_user.id, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return await service.update_doctor(doctor, data)


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(
    doctor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DoctorService(db)
    doctor = await service.get_doctor(current_user.id, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    await service.delete_doctor(doctor)


# --- Prescriptions ---
@router.get("/prescriptions", response_model=list[PrescriptionResponse])
async def list_prescriptions(
    family_member_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrescriptionService(db)
    return await service.list_prescriptions(current_user.id, family_member_id)


@router.post("/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    data: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrescriptionService(db)
    return await service.create_prescription(current_user.id, data)


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrescriptionService(db)
    prescription = await service.get_prescription(current_user.id, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription


@router.put("/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: UUID,
    data: PrescriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrescriptionService(db)
    prescription = await service.get_prescription(current_user.id, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return await service.update_prescription(prescription, data)


@router.delete("/prescriptions/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrescriptionService(db)
    prescription = await service.get_prescription(current_user.id, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    await service.delete_prescription(prescription)


# --- Active Medicines ---
@router.get("/medicines/active", response_model=list[ActiveMedicineResponse])
async def get_active_medicines(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrescriptionService(db)
    return await service.get_active_medicines(current_user.id)
