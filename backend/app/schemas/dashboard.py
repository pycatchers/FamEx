from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class UpcomingEMI(BaseModel):
    loan_id: UUID
    lender_name: str
    amount: Decimal
    due_date: date
    status: str


class UpcomingInsurance(BaseModel):
    policy_id: UUID
    provider_name: str
    policy_type: str
    premium_amount: Decimal
    next_premium_date: date


class UpcomingFollowUp(BaseModel):
    prescription_id: UUID
    diagnosis: Optional[str] = None
    doctor_name: Optional[str] = None
    follow_up_date: date


class RecentDocument(BaseModel):
    id: UUID
    document_type: str
    document_number: Optional[str] = None
    created_at: datetime


class MonthlySpendingSummary(BaseModel):
    total: Decimal
    bill_count: int


class DashboardResponse(BaseModel):
    upcoming_emis: list[UpcomingEMI] = []
    upcoming_insurance: list[UpcomingInsurance] = []
    upcoming_follow_ups: list[UpcomingFollowUp] = []
    recent_documents: list[RecentDocument] = []
    monthly_spending: MonthlySpendingSummary
    active_medicines_count: int
    family_members_count: int
    active_loans_count: int


class SearchResult(BaseModel):
    module: str  # "document", "shop", "medicine", "prescription", "insurance", "loan", "family"
    id: UUID
    title: str
    subtitle: Optional[str] = None
    match_field: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult] = []
    total: int = 0
