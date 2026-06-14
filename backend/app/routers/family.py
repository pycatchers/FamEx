from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate, FamilyMemberResponse
from app.services.family import FamilyService

router = APIRouter(prefix="/api/v1/family", tags=["family"])


@router.get("", response_model=list[FamilyMemberResponse])
async def list_family_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = FamilyService(db)
    return await service.list_members(current_user.id)


@router.post("", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_family_member(
    data: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = FamilyService(db)
    return await service.create_member(current_user.id, data)


@router.get("/{member_id}", response_model=FamilyMemberResponse)
async def get_family_member(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = FamilyService(db)
    member = await service.get_member(current_user.id, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
    return member


@router.put("/{member_id}", response_model=FamilyMemberResponse)
async def update_family_member(
    member_id: UUID,
    data: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = FamilyService(db)
    member = await service.get_member(current_user.id, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
    return await service.update_member(member, data)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_member(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = FamilyService(db)
    member = await service.get_member(current_user.id, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
    await service.delete_member(member)
