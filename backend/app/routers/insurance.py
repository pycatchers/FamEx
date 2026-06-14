from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.insurance import InsuranceCreate, InsuranceUpdate, InsuranceResponse
from app.services.insurance import InsuranceService

router = APIRouter(prefix="/api/v1/insurance", tags=["insurance"])


@router.get("", response_model=list[InsuranceResponse])
async def list_policies(
    policy_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InsuranceService(db)
    return await service.list_policies(current_user.id, policy_type, status_filter)


@router.post("", response_model=InsuranceResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    data: InsuranceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InsuranceService(db)
    return await service.create_policy(current_user.id, data)


@router.get("/{policy_id}", response_model=InsuranceResponse)
async def get_policy(
    policy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InsuranceService(db)
    policy = await service.get_policy(current_user.id, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    return policy


@router.put("/{policy_id}", response_model=InsuranceResponse)
async def update_policy(
    policy_id: UUID,
    data: InsuranceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InsuranceService(db)
    policy = await service.get_policy(current_user.id, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    return await service.update_policy(policy, data)


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InsuranceService(db)
    policy = await service.get_policy(current_user.id, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    await service.delete_policy(policy)
