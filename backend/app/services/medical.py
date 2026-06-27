from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.hospital import Hospital
from app.models.doctor import Doctor
from app.models.family import FamilyMember
from app.models.prescription import Prescription
from app.models.medicine import Medicine
from app.schemas.medical import (
    HospitalCreate, HospitalUpdate,
    DoctorCreate, DoctorUpdate,
    PrescriptionCreate, PrescriptionUpdate,
    ActiveMedicineResponse,
    VisitSummary, MedicineResponse,
)


class HospitalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_or_create_by_name(self, user_id: UUID, name: str, address: str | None, phone: str | None) -> Hospital:
        result = await self.db.execute(
            select(Hospital).where(
                Hospital.user_id == user_id,
                func.lower(Hospital.name) == name.lower(),
            )
        )
        hospital = result.scalar_one_or_none()
        if hospital is None:
            hospital = Hospital(user_id=user_id, name=name, address=address, phone=phone)
            self.db.add(hospital)
            await self.db.flush()
            await self.db.refresh(hospital)
        else:
            updated = False
            if address and not hospital.address:
                hospital.address = address
                updated = True
            if phone and not hospital.phone:
                hospital.phone = phone
                updated = True
            if updated:
                await self.db.flush()
                await self.db.refresh(hospital)
        return hospital

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

    async def list_hospitals_with_details(self, user_id: UUID) -> list[dict]:
        """Get hospitals with last visit date, visit count, and doctors."""
        from sqlalchemy import func

        # Get hospitals
        hospitals = await self.list_hospitals(user_id)
        result = []
        for hospital in hospitals:
            # Get visit stats
            stats = await self.db.execute(
                select(
                    func.count(Prescription.id).label("visit_count"),
                    func.max(Prescription.prescription_date).label("last_visit_date"),
                ).where(
                    Prescription.hospital_id == hospital.id,
                    Prescription.user_id == user_id,
                )
            )
            row = stats.first()

            # Get doctors for this hospital
            doctors_result = await self.db.execute(
                select(Doctor).where(Doctor.hospital_id == hospital.id, Doctor.user_id == user_id)
            )
            doctors = list(doctors_result.scalars().all())

            result.append({
                "hospital": hospital,
                "last_visit_date": row.last_visit_date if row else None,
                "visit_count": row.visit_count if row else 0,
                "doctors": doctors,
            })
        return result


class DoctorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_or_create(self, user_id: UUID, name: str, hospital_id: UUID | None, registration_id: str | None, qualification: str | None = None) -> Doctor:
        query = select(Doctor).where(
            Doctor.user_id == user_id,
            func.lower(Doctor.name) == name.lower(),
        )
        if hospital_id:
            query = query.where(Doctor.hospital_id == hospital_id)
        result = await self.db.execute(query)
        doctor = result.scalar_one_or_none()
        if doctor is None:
            doctor = Doctor(user_id=user_id, name=name, hospital_id=hospital_id, registration_id=registration_id, qualification=qualification)
            self.db.add(doctor)
            await self.db.flush()
            await self.db.refresh(doctor)
        else:
            updated = False
            if registration_id and not doctor.registration_id:
                doctor.registration_id = registration_id
                updated = True
            if qualification and not doctor.qualification:
                doctor.qualification = qualification
                updated = True
            if updated:
                await self.db.flush()
                await self.db.refresh(doctor)
        return doctor

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

    async def list_doctors_with_details(self, user_id: UUID, hospital_id: UUID | None = None) -> list[dict]:
        """Get doctors with last visit date and visit count."""
        from sqlalchemy import func

        doctors = await self.list_doctors(user_id, hospital_id)
        result = []
        for doctor in doctors:
            stats = await self.db.execute(
                select(
                    func.count(Prescription.id).label("visit_count"),
                    func.max(Prescription.prescription_date).label("last_visit_date"),
                ).where(
                    Prescription.doctor_id == doctor.id,
                    Prescription.user_id == user_id,
                )
            )
            row = stats.first()
            result.append({
                "doctor": doctor,
                "last_visit_date": row.last_visit_date if row else None,
                "visit_count": row.visit_count if row else 0,
            })
        return result


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

    async def get_visits(self, user_id: UUID) -> list[VisitSummary]:
        """All prescriptions with hospital, patient, doctor info — most recent first."""
        result = await self.db.execute(
            select(Prescription)
            .where(Prescription.user_id == user_id)
            .options(selectinload(Prescription.medicines))
            .order_by(Prescription.prescription_date.desc())
        )
        prescriptions = list(result.scalars().unique().all())

        visits = []
        for p in prescriptions:
            hospital = None
            if p.hospital_id:
                h = await self.db.execute(select(Hospital).where(Hospital.id == p.hospital_id))
                hospital = h.scalar_one_or_none()

            doctor = None
            if p.doctor_id:
                d = await self.db.execute(select(Doctor).where(Doctor.id == p.doctor_id))
                doctor = d.scalar_one_or_none()

            patient_name = None
            if p.family_member_id:
                fm = await self.db.execute(select(FamilyMember).where(FamilyMember.id == p.family_member_id))
                member = fm.scalar_one_or_none()
                if member:
                    patient_name = member.full_name

            visits.append(VisitSummary(
                prescription_id=p.id,
                hospital_id=p.hospital_id,
                hospital_name=hospital.name if hospital else None,
                hospital_address=hospital.address if hospital else None,
                hospital_phone=hospital.phone if hospital else None,
                visit_date=p.prescription_date,
                patient_name=patient_name,
                reason_for_visit=p.reason_for_visit,
                diagnosis=p.diagnosis,
                doctor_name=doctor.name if doctor else None,
                doctor_qualification=doctor.qualification if doctor else None,
                doctor_registration_id=doctor.registration_id if doctor else None,
                medicines=[MedicineResponse.model_validate(m) for m in p.medicines],
            ))
        return visits

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
