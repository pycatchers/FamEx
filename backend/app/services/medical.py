from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.hospital import Hospital
from app.models.doctor import Doctor
from app.models.prescription import Prescription
from app.models.medicine import Medicine
from app.schemas.medical import (
    HospitalCreate, HospitalUpdate,
    DoctorCreate, DoctorUpdate,
    PrescriptionCreate, PrescriptionUpdate,
    ActiveMedicineResponse,
)


class HospitalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_hospitals(self, user_id: UUID) -> list[Hospital]:
        result = await self.db.execute(
            select(Hospital).where(Hospital.user_id == user_id).order_by(Hospital.name)
        )
        return list(result.scalars().all())

    async def get_hospital(self, user_id: UUID, hospital_id: UUID) -> Hospital | None:
        result = await self.db.execute(
            select(Hospital).where(Hospital.id == hospital_id, Hospital.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_hospital(self, user_id: UUID, data: HospitalCreate) -> Hospital:
        hospital = Hospital(user_id=user_id, **data.model_dump(exclude_unset=True))
        self.db.add(hospital)
        await self.db.flush()
        await self.db.refresh(hospital)
        return hospital

    async def update_hospital(self, hospital: Hospital, data: HospitalUpdate) -> Hospital:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(hospital, field, value)
        await self.db.flush()
        await self.db.refresh(hospital)
        return hospital

    async def delete_hospital(self, hospital: Hospital) -> None:
        await self.db.delete(hospital)
        await self.db.flush()


class DoctorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_doctors(self, user_id: UUID, hospital_id: UUID | None = None) -> list[Doctor]:
        query = select(Doctor).where(Doctor.user_id == user_id)
        if hospital_id:
            query = query.where(Doctor.hospital_id == hospital_id)
        query = query.order_by(Doctor.name)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_doctor(self, user_id: UUID, doctor_id: UUID) -> Doctor | None:
        result = await self.db.execute(
            select(Doctor).where(Doctor.id == doctor_id, Doctor.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_doctor(self, user_id: UUID, data: DoctorCreate) -> Doctor:
        doctor = Doctor(user_id=user_id, **data.model_dump(exclude_unset=True))
        self.db.add(doctor)
        await self.db.flush()
        await self.db.refresh(doctor)
        return doctor

    async def update_doctor(self, doctor: Doctor, data: DoctorUpdate) -> Doctor:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(doctor, field, value)
        await self.db.flush()
        await self.db.refresh(doctor)
        return doctor

    async def delete_doctor(self, doctor: Doctor) -> None:
        await self.db.delete(doctor)
        await self.db.flush()


class PrescriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_prescriptions(self, user_id: UUID, family_member_id: UUID | None = None) -> list[Prescription]:
        query = (
            select(Prescription)
            .where(Prescription.user_id == user_id)
            .options(selectinload(Prescription.medicines))
        )
        if family_member_id:
            query = query.where(Prescription.family_member_id == family_member_id)
        query = query.order_by(Prescription.prescription_date.desc())
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    async def get_prescription(self, user_id: UUID, prescription_id: UUID) -> Prescription | None:
        result = await self.db.execute(
            select(Prescription)
            .where(Prescription.id == prescription_id, Prescription.user_id == user_id)
            .options(selectinload(Prescription.medicines))
        )
        return result.scalar_one_or_none()

    async def create_prescription(self, user_id: UUID, data: PrescriptionCreate) -> Prescription:
        prescription_data = data.model_dump(exclude={"medicines"})
        prescription = Prescription(user_id=user_id, **prescription_data)
        self.db.add(prescription)
        await self.db.flush()

        for med_data in data.medicines:
            medicine = Medicine(prescription_id=prescription.id, **med_data.model_dump())
            self.db.add(medicine)

        await self.db.flush()
        # Reload with medicines
        result = await self.db.execute(
            select(Prescription)
            .where(Prescription.id == prescription.id)
            .options(selectinload(Prescription.medicines))
        )
        return result.scalar_one()

    async def update_prescription(self, prescription: Prescription, data: PrescriptionUpdate) -> Prescription:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(prescription, field, value)
        await self.db.flush()
        await self.db.refresh(prescription)
        return prescription

    async def delete_prescription(self, prescription: Prescription) -> None:
        await self.db.delete(prescription)
        await self.db.flush()

    async def get_active_medicines(self, user_id: UUID) -> list[ActiveMedicineResponse]:
        """Get all active medicines for the user (is_active=True and end_date >= today or null)."""
        today = date.today()
        result = await self.db.execute(
            select(Medicine, Doctor.name.label("doctor_name"), Prescription.diagnosis)
            .join(Prescription, Medicine.prescription_id == Prescription.id)
            .outerjoin(Doctor, Prescription.doctor_id == Doctor.id)
            .where(
                Prescription.user_id == user_id,
                Medicine.is_active == True,
            )
            .where(
                (Medicine.end_date == None) | (Medicine.end_date >= today)
            )
            .order_by(Medicine.name)
        )
        rows = result.all()
        return [
            ActiveMedicineResponse(
                id=row.Medicine.id,
                prescription_id=row.Medicine.prescription_id,
                name=row.Medicine.name,
                dosage=row.Medicine.dosage,
                frequency=row.Medicine.frequency,
                timing=row.Medicine.timing,
                morning=row.Medicine.morning,
                afternoon=row.Medicine.afternoon,
                night=row.Medicine.night,
                start_date=row.Medicine.start_date,
                end_date=row.Medicine.end_date,
                doctor_name=row.doctor_name,
                diagnosis=row.diagnosis,
            )
            for row in rows
        ]
