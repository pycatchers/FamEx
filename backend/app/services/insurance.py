from uuid import UUID
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.insurance import InsurancePolicy, PremiumPayment
from app.schemas.insurance import InsuranceCreate, InsuranceUpdate, PremiumPaymentUpdate

FREQUENCY_MONTHS = {
    "monthly": 1,
    "quarterly": 3,
    "half_yearly": 6,
    "yearly": 12,
}


class InsuranceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_policies(
        self,
        user_id: UUID,
        policy_type: str | None = None,
        status: str | None = None,
    ) -> list[InsurancePolicy]:
        query = select(InsurancePolicy).where(InsurancePolicy.user_id == user_id)
        if policy_type:
            query = query.where(InsurancePolicy.policy_type == policy_type)
        if status:
            query = query.where(InsurancePolicy.status == status)
        query = query.order_by(InsurancePolicy.end_date)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_policy(self, user_id: UUID, policy_id: UUID) -> InsurancePolicy | None:
        result = await self.db.execute(
            select(InsurancePolicy).where(
                InsurancePolicy.id == policy_id, InsurancePolicy.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def create_policy(self, user_id: UUID, data: InsuranceCreate) -> InsurancePolicy:
        policy = InsurancePolicy(user_id=user_id, **data.model_dump(exclude_unset=True))
        self.db.add(policy)
        await self.db.flush()
        await self.db.refresh(policy)

        # Auto-generate premium payment schedule
        await self._generate_premium_schedule(policy)

        return policy

    async def update_policy(self, policy: InsurancePolicy, data: InsuranceUpdate) -> InsurancePolicy:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(policy, field, value)
        await self.db.flush()
        await self.db.refresh(policy)
        return policy

    async def delete_policy(self, policy: InsurancePolicy) -> None:
        await self.db.delete(policy)
        await self.db.flush()

    async def get_premium_payments(self, policy_id: UUID) -> list[PremiumPayment]:
        result = await self.db.execute(
            select(PremiumPayment)
            .where(PremiumPayment.policy_id == policy_id)
            .order_by(PremiumPayment.due_date)
        )
        return list(result.scalars().all())

    async def update_premium_payment(
        self, user_id: UUID, policy_id: UUID, premium_id: UUID, data: PremiumPaymentUpdate
    ) -> PremiumPayment | None:
        # Verify policy belongs to user
        policy = await self.get_policy(user_id, policy_id)
        if not policy:
            return None

        result = await self.db.execute(
            select(PremiumPayment).where(PremiumPayment.id == premium_id, PremiumPayment.policy_id == policy_id)
        )
        premium = result.scalar_one_or_none()
        if not premium:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(premium, field, value)
        await self.db.flush()
        await self.db.refresh(premium)
        return premium

    async def _generate_premium_schedule(self, policy: InsurancePolicy) -> None:
        """Generate premium due entries from start_date to end_date at the policy's frequency."""
        step_months = FREQUENCY_MONTHS.get(policy.premium_frequency, 12)

        current_date = policy.next_premium_date or policy.start_date
        while current_date <= policy.end_date:
            premium = PremiumPayment(
                policy_id=policy.id,
                due_date=current_date,
                amount=policy.premium_amount,
                status="upcoming",
            )
            self.db.add(premium)
            current_date = current_date + relativedelta(months=step_months)

        await self.db.flush()
