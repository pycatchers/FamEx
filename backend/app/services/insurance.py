from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.insurance import InsurancePolicy
from app.schemas.insurance import InsuranceCreate, InsuranceUpdate


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
