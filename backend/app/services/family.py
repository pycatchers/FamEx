from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.family import FamilyMember
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate


class FamilyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_members(self, user_id: UUID) -> list[FamilyMember]:
        result = await self.db.execute(
            select(FamilyMember)
            .where(FamilyMember.user_id == user_id)
            .order_by(FamilyMember.full_name)
        )
        return list(result.scalars().all())

    async def get_member(self, user_id: UUID, member_id: UUID) -> FamilyMember | None:
        result = await self.db.execute(
            select(FamilyMember)
            .where(FamilyMember.id == member_id, FamilyMember.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_member(self, user_id: UUID, data: FamilyMemberCreate) -> FamilyMember:
        member = FamilyMember(user_id=user_id, **data.model_dump(exclude_unset=True))
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def update_member(self, member: FamilyMember, data: FamilyMemberUpdate) -> FamilyMember:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(member, field, value)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def delete_member(self, member: FamilyMember) -> None:
        await self.db.delete(member)
        await self.db.flush()
