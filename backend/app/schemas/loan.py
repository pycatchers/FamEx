from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class LoanCreate(BaseModel):
    family_member_id: Optional[UUID] = None
    loan_type: str
    lender_name: str
    loan_account_number: Optional[str] = None
    principal_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    emi_amount: Decimal
    start_date: date
    end_date: date
    emi_day_of_month: Optional[int] = None
    outstanding_amount: Optional[Decimal] = None
    status: str = "active"
    notes: Optional[str] = None


class LoanUpdate(BaseModel):
    family_member_id: Optional[UUID] = None
    loan_type: Optional[str] = None
    lender_name: Optional[str] = None
    loan_account_number: Optional[str] = None
    principal_amount: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    tenure_months: Optional[int] = None
    emi_amount: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    emi_day_of_month: Optional[int] = None
    outstanding_amount: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class LoanResponse(BaseModel):
    id: UUID
    user_id: UUID
    family_member_id: Optional[UUID] = None
    loan_type: str
    lender_name: str
    loan_account_number: Optional[str] = None
    principal_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    emi_amount: Decimal
    start_date: date
    end_date: date
    emi_day_of_month: Optional[int] = None
    outstanding_amount: Optional[Decimal] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EMIPaymentResponse(BaseModel):
    id: UUID
    loan_id: UUID
    due_date: date
    paid_date: Optional[date] = None
    amount: Decimal
    principal_component: Optional[Decimal] = None
    interest_component: Optional[Decimal] = None
    status: str
    receipt_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EMIPaymentUpdate(BaseModel):
    paid_date: Optional[date] = None
    status: Optional[str] = None
    receipt_url: Optional[str] = None
