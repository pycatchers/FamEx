from uuid import UUID
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.loan import Loan, EMIPayment
from app.schemas.loan import LoanCreate, LoanUpdate, EMIPaymentUpdate


class LoanService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_loans(self, user_id: UUID, status: str | None = None) -> list[Loan]:
        query = select(Loan).where(Loan.user_id == user_id)
        if status:
            query = query.where(Loan.status == status)
        query = query.order_by(Loan.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_loan(self, user_id: UUID, loan_id: UUID) -> Loan | None:
        result = await self.db.execute(
            select(Loan).where(Loan.id == loan_id, Loan.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_loan(self, user_id: UUID, data: LoanCreate) -> Loan:
        loan = Loan(user_id=user_id, **data.model_dump(exclude_unset=True))
        self.db.add(loan)
        await self.db.flush()
        await self.db.refresh(loan)

        # Auto-generate EMI schedule
        await self._generate_emi_schedule(loan)

        return loan

    async def update_loan(self, loan: Loan, data: LoanUpdate) -> Loan:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(loan, field, value)
        await self.db.flush()
        await self.db.refresh(loan)
        return loan

    async def delete_loan(self, loan: Loan) -> None:
        await self.db.delete(loan)
        await self.db.flush()

    async def get_emi_payments(self, loan_id: UUID) -> list[EMIPayment]:
        result = await self.db.execute(
            select(EMIPayment)
            .where(EMIPayment.loan_id == loan_id)
            .order_by(EMIPayment.due_date)
        )
        return list(result.scalars().all())

    async def update_emi_payment(
        self, user_id: UUID, loan_id: UUID, emi_id: UUID, data: EMIPaymentUpdate
    ) -> EMIPayment | None:
        # Verify loan belongs to user
        loan = await self.get_loan(user_id, loan_id)
        if not loan:
            return None

        result = await self.db.execute(
            select(EMIPayment).where(EMIPayment.id == emi_id, EMIPayment.loan_id == loan_id)
        )
        emi = result.scalar_one_or_none()
        if not emi:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(emi, field, value)
        await self.db.flush()
        await self.db.refresh(emi)
        return emi

    async def _generate_emi_schedule(self, loan: Loan) -> None:
        """Generate EMI payment entries for the full tenure."""
        emi_day = loan.emi_day_of_month or loan.start_date.day
        if emi_day > 28:
            emi_day = 28

        current_date = loan.start_date.replace(day=emi_day)
        if current_date < loan.start_date:
            current_date = current_date + relativedelta(months=1)

        for i in range(loan.tenure_months):
            emi = EMIPayment(
                loan_id=loan.id,
                due_date=current_date,
                amount=loan.emi_amount,
                status="upcoming",
            )
            self.db.add(emi)
            current_date = current_date + relativedelta(months=1)

        await self.db.flush()
