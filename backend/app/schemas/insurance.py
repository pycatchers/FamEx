from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class InsuranceCreate(BaseModel):
    family_member_id: Optional[UUID] = None
    policy_type: str
    provider_name: str
    policy_number: str
    sum_insured: Optional[Decimal] = None
    premium_amount: Decimal
    premium_frequency: str
    start_date: date
    end_date: date
    next_premium_date: Optional[date] = None
    nominee_name: Optional[str] = None
    nominee_relation: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    document_url: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None


class InsuranceUpdate(BaseModel):
    family_member_id: Optional[UUID] = None
    policy_type: Optional[str] = None
    provider_name: Optional[str] = None
    policy_number: Optional[str] = None
    sum_insured: Optional[Decimal] = None
    premium_amount: Optional[Decimal] = None
    premium_frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    next_premium_date: Optional[date] = None
    nominee_name: Optional[str] = None
    nominee_relation: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    document_url: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class InsuranceResponse(BaseModel):
    id: UUID
    user_id: UUID
    family_member_id: Optional[UUID] = None
    policy_type: str
    provider_name: str
    policy_number: str
    sum_insured: Optional[Decimal] = None
    premium_amount: Decimal
    premium_frequency: str
    start_date: date
    end_date: date
    next_premium_date: Optional[date] = None
    nominee_name: Optional[str] = None
    nominee_relation: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    document_url: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
