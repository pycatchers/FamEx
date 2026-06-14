from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.shopping import (
    ShopCreate, ShopUpdate, ShopResponse,
    BillCreate, BillUpdate, BillResponse,
    ChecklistCreate, ChecklistUpdate, ChecklistResponse,
    ChecklistItemCreate, ChecklistItemResponse,
    ShoppingAnalytics,
)
from app.services.shopping import ShopService, BillService, AnalyticsService, ChecklistService

router = APIRouter(prefix="/api/v1/shopping", tags=["shopping"])


# --- Shops ---
@router.get("/shops", response_model=list[ShopResponse])
async def list_shops(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ShopService(db)
    return await service.list_shops(current_user.id)


@router.post("/shops", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
async def create_shop(
    data: ShopCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ShopService(db)
    return await service.create_shop(current_user.id, data)


@router.get("/shops/{shop_id}", response_model=ShopResponse)
async def get_shop(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ShopService(db)
    shop = await service.get_shop(current_user.id, shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop


@router.put("/shops/{shop_id}", response_model=ShopResponse)
async def update_shop(
    shop_id: UUID,
    data: ShopUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ShopService(db)
    shop = await service.get_shop(current_user.id, shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return await service.update_shop(shop, data)


@router.delete("/shops/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shop(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ShopService(db)
    shop = await service.get_shop(current_user.id, shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    await service.delete_shop(shop)


# --- Bills ---
@router.get("/bills", response_model=list[BillResponse])
async def list_bills(
    shop_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BillService(db)
    return await service.list_bills(current_user.id, shop_id)


@router.post("/bills", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(
    data: BillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BillService(db)
    return await service.create_bill(current_user.id, data)


@router.get("/bills/{bill_id}", response_model=BillResponse)
async def get_bill(
    bill_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BillService(db)
    bill = await service.get_bill(current_user.id, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@router.put("/bills/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: UUID,
    data: BillUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BillService(db)
    bill = await service.get_bill(current_user.id, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return await service.update_bill(bill, data)


@router.delete("/bills/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bill(
    bill_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BillService(db)
    bill = await service.get_bill(current_user.id, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    await service.delete_bill(bill)


# --- Analytics ---
@router.get("/analytics", response_model=ShoppingAnalytics)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_analytics(current_user.id)


# --- Checklists ---
@router.get("/checklists", response_model=list[ChecklistResponse])
async def list_checklists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    return await service.list_checklists(current_user.id)


@router.post("/checklists", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist(
    data: ChecklistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    return await service.create_checklist(current_user.id, data)


@router.get("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(
    checklist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    checklist = await service.get_checklist(current_user.id, checklist_id)
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return checklist


@router.put("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(
    checklist_id: UUID,
    data: ChecklistUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    checklist = await service.get_checklist(current_user.id, checklist_id)
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return await service.update_checklist(checklist, data)


@router.delete("/checklists/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist(
    checklist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    checklist = await service.get_checklist(current_user.id, checklist_id)
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    await service.delete_checklist(checklist)


@router.post(
    "/checklists/{checklist_id}/items",
    response_model=ChecklistItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_checklist_item(
    checklist_id: UUID,
    data: ChecklistItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    checklist = await service.get_checklist(current_user.id, checklist_id)
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return await service.add_item(checklist_id, data)


@router.put(
    "/checklists/{checklist_id}/items/{item_id}/toggle",
    response_model=ChecklistItemResponse,
)
async def toggle_checklist_item(
    checklist_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    item = await service.toggle_item(current_user.id, checklist_id, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete(
    "/checklists/{checklist_id}/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_checklist_item(
    checklist_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChecklistService(db)
    deleted = await service.delete_item(current_user.id, checklist_id, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
