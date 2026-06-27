from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


# --- Hospital ---
class HospitalCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    notes: Optional[str] = None


class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    notes: Optional[str] = None


class HospitalResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Doctor ---
class DoctorCreate(BaseModel):
    hospital_id: Optional[UUID] = None
    name: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    registration_id: Optional[str] = None
    notes: Optional[str] = None


class DoctorUpdate(BaseModel):
    hospital_id: Optional[UUID] = None
    name: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    registration_id: Optional[str] = None
    notes: Optional[str] = None


class DoctorResponse(BaseModel):
    id: UUID
    user_id: UUID
    hospital_id: Optional[UUID] = None
    name: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    registration_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Medicine ---
class MedicineCreate(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    timing: Optional[str] = None
    morning: bool = False
    afternoon: bool = False
    night: bool = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True


class MedicineResponse(BaseModel):
    id: UUID
    prescription_id: UUID
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    timing: Optional[str] = None
    morning: bool
    afternoon: bool
    night: bool
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Prescription ---
class PrescriptionCreate(BaseModel):
    family_member_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    hospital_id: Optional[UUID] = None
    prescription_date: date
    diagnosis: Optional[str] = None
    reason_for_visit: Optional[str] = None
    image_url: Optional[str] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    medicines: list[MedicineCreate] = []


class PrescriptionUpdate(BaseModel):
    family_member_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    hospital_id: Optional[UUID] = None
    prescription_date: Optional[date] = None
    diagnosis: Optional[str] = None
    reason_for_visit: Optional[str] = None
    image_url: Optional[str] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    family_member_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    hospital_id: Optional[UUID] = None
    prescription_date: date
    diagnosis: Optional[str] = None
    reason_for_visit: Optional[str] = None
    image_url: Optional[str] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    medicines: list[MedicineResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Detail Responses ---
class HospitalDetailResponse(HospitalResponse):
    last_visit_date: Optional[date] = None
    visit_count: int = 0
    doctors: list[DoctorResponse] = []


class DoctorDetailResponse(DoctorResponse):
    last_visit_date: Optional[date] = None
    visit_count: int = 0


# --- Visit Summary (for the Medical tab list) ---
class VisitSummary(BaseModel):
    prescription_id: UUID
    hospital_id: Optional[UUID] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_phone: Optional[str] = None
    visit_date: date
    patient_name: Optional[str] = None
    reason_for_visit: Optional[str] = None
    diagnosis: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_qualification: Optional[str] = None
    doctor_registration_id: Optional[str] = None
    medicines: list["MedicineResponse"] = []


# --- Active Medicines ---
class ActiveMedicineResponse(BaseModel):
    id: UUID
    prescription_id: UUID
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    morning: bool
    afternoon: bool
    night: bool
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    doctor_name: Optional[str] = None
    diagnosis: Optional[str] = None
