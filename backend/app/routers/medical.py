from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.medical import (
    HospitalCreate, HospitalUpdate, HospitalResponse,
    DoctorCreate, DoctorUpdate, DoctorResponse,
    PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse,
    ActiveMedicineResponse,
)
from app.services.medical import HospitalService, DoctorService, PrescriptionService

router = APIRouter(prefix="/api/v1/medical", tags=["medical"])


# --- Hospitals ---
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
