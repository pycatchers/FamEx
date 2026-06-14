from uuid import UUID
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.loan import Loan, EMIPayment
from app.models.insurance import InsurancePolicy
from app.models.prescription import Prescription
from app.models.medicine import Medicine
from app.models.doctor import Doctor
from app.models.document import Document
from app.models.bill import ShoppingBill
from app.models.family import FamilyMember
from app.schemas.dashboard import (
    DashboardResponse, UpcomingEMI, UpcomingInsurance,
    UpcomingFollowUp, RecentDocument, MonthlySpendingSummary,
)


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard(self, user_id: UUID) -> DashboardResponse:
        today = date.today()
        next_30_days = today + timedelta(days=30)
        next_60_days = today + timedelta(days=60)
        first_of_month = today.replace(day=1)

        # Upcoming EMIs (next 30 days, unpaid)
        emi_result = await self.db.execute(
            select(EMIPayment, Loan.lender_name)
            .join(Loan, EMIPayment.loan_id == Loan.id)
            .where(
                Loan.user_id == user_id,
                EMIPayment.due_date >= today,
                EMIPayment.due_date <= next_30_days,
                EMIPayment.status != "paid",
            )
            .order_by(EMIPayment.due_date)
            .limit(5)
        )
        upcoming_emis = [
            UpcomingEMI(
                loan_id=row.EMIPayment.loan_id,
                lender_name=row.lender_name,
                amount=row.EMIPayment.amount,
                due_date=row.EMIPayment.due_date,
                status=row.EMIPayment.status,
            )
            for row in emi_result.all()
        ]

        # Upcoming insurance renewals (next 60 days)
        insurance_result = await self.db.execute(
            select(InsurancePolicy)
            .where(
                InsurancePolicy.user_id == user_id,
                InsurancePolicy.next_premium_date >= today,
                InsurancePolicy.next_premium_date <= next_60_days,
                InsurancePolicy.status == "active",
            )
            .order_by(InsurancePolicy.next_premium_date)
            .limit(5)
        )
        upcoming_insurance = [
            UpcomingInsurance(
                policy_id=p.id,
                provider_name=p.provider_name,
                policy_type=p.policy_type,
                premium_amount=p.premium_amount,
                next_premium_date=p.next_premium_date,
            )
            for p in insurance_result.scalars().all()
        ]

        # Upcoming follow-ups (next 30 days)
        followup_result = await self.db.execute(
            select(Prescription, Doctor.name.label("doctor_name"))
            .outerjoin(Doctor, Prescription.doctor_id == Doctor.id)
            .where(
                Prescription.user_id == user_id,
                Prescription.follow_up_date >= today,
                Prescription.follow_up_date <= next_30_days,
            )
            .order_by(Prescription.follow_up_date)
            .limit(5)
        )
        upcoming_follow_ups = [
            UpcomingFollowUp(
                prescription_id=row.Prescription.id,
                diagnosis=row.Prescription.diagnosis,
                doctor_name=row.doctor_name,
                follow_up_date=row.Prescription.follow_up_date,
            )
            for row in followup_result.all()
        ]

        # Recent documents (last 5)
        doc_result = await self.db.execute(
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .limit(5)
        )
        recent_documents = [
            RecentDocument(
                id=d.id,
                document_type=d.document_type,
                document_number=d.document_number,
                created_at=d.created_at,
            )
            for d in doc_result.scalars().all()
        ]

        # Monthly spending (current calendar month)
        spending_result = await self.db.execute(
            select(
                func.coalesce(func.sum(ShoppingBill.total_amount), 0).label("total"),
                func.count(ShoppingBill.id).label("bill_count"),
            )
            .where(
                ShoppingBill.user_id == user_id,
                ShoppingBill.bill_date >= first_of_month,
            )
        )
        spending_row = spending_result.one()
        monthly_spending = MonthlySpendingSummary(
            total=spending_row.total or Decimal("0"),
            bill_count=spending_row.bill_count or 0,
        )

        # Active medicines count
        active_meds_result = await self.db.execute(
            select(func.count(Medicine.id))
            .join(Prescription, Medicine.prescription_id == Prescription.id)
            .where(
                Prescription.user_id == user_id,
                Medicine.is_active == True,  # noqa: E712
            )
            .where(
                (Medicine.end_date == None) | (Medicine.end_date >= today)  # noqa: E711
            )
        )
        active_medicines_count = active_meds_result.scalar() or 0

        # Family members count
        family_result = await self.db.execute(
            select(func.count(FamilyMember.id))
            .where(FamilyMember.user_id == user_id)
        )
        family_members_count = family_result.scalar() or 0

        # Active loans count
        loans_result = await self.db.execute(
            select(func.count(Loan.id))
            .where(Loan.user_id == user_id, Loan.status == "active")
        )
        active_loans_count = loans_result.scalar() or 0

        return DashboardResponse(
            upcoming_emis=upcoming_emis,
            upcoming_insurance=upcoming_insurance,
            upcoming_follow_ups=upcoming_follow_ups,
            recent_documents=recent_documents,
            monthly_spending=monthly_spending,
            active_medicines_count=active_medicines_count,
            family_members_count=family_members_count,
            active_loans_count=active_loans_count,
        )
