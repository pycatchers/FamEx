import logging
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.shopping import (
    ShopCreate, ShopUpdate, ShopResponse, RecentShopResponse,
    BillCreate, BillUpdate, BillResponse,
    ChecklistCreate, ChecklistUpdate, ChecklistResponse,
    ChecklistItemCreate, ChecklistItemResponse,
    ShoppingAnalytics,
    ItemPriceComparison,
    PurchaseItemCreate,
)
from app.services.shopping import ShopService, BillService, AnalyticsService, ChecklistService
from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"}

router = APIRouter(prefix="/api/v1/shopping", tags=["shopping"])


# --- Save pre-extracted (possibly user-edited) bill data ---
class OCRBillSaveItem(BaseModel):
    item_name: str
    quantity: float | None = None
    unit: str | None = None
    mrp: float | None = None
    discount: float | None = None
    bought_price: float


class OCRBillSaveRequest(BaseModel):
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    shop_phone: Optional[str] = None
    shop_gstin: Optional[str] = None
    bill_date: str
    total_amount: float
    items: list[OCRBillSaveItem] = []


@router.post("/save-ocr-bill", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def save_ocr_bill(
    data: OCRBillSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save user-reviewed OCR bill data (shop auto-found/created, bill + items saved)."""
    from decimal import Decimal as D

    shop_service = ShopService(db)
    bill_service = BillService(db)

    shop_id = None
    if data.shop_name and data.shop_name.strip():
        shop = await shop_service.find_or_create_by_name(
            user_id=current_user.id,
            name=data.shop_name.strip(),
            address=data.shop_address,
            phone=data.shop_phone,
            gstin=data.shop_gstin,
        )
        shop_id = shop.id

    items = [
        PurchaseItemCreate(
            item_name=item.item_name,
            quantity=item.quantity,
            unit=item.unit,
            mrp=item.mrp,
            discount=item.discount,
            bought_price=D(str(item.bought_price)),
        )
        for item in data.items
    ]

    bill_create = BillCreate(
        shop_id=shop_id,
        bill_date=data.bill_date,
        total_amount=D(str(data.total_amount)),
        entry_method="ocr",
        items=items,
    )
    return await bill_service.create_bill(current_user.id, bill_create)


# --- Recent Shops (main Shopping tab view) ---
@router.get("/shops/recent", response_model=list[RecentShopResponse])
async def list_recent_shops(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ShopService(db)
    return await service.get_recent_shops(current_user.id)


# --- OCR Bill Save (scan + auto-create shop + bill) ---
@router.post("/ocr-bill-save", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def ocr_bill_save(
    file: UploadFile = File(...),
    language: str = Form("en"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Extract bill data via AI, auto-find/create shop, and save bill with items."""
    from app.integrations.gemini import extract_bill_data
    from decimal import Decimal as D

    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        data = await extract_bill_data(image_bytes, file.content_type, language)
    except Exception:
        logger.exception("OCR extraction failed")
        raise HTTPException(status_code=422, detail="Could not extract data from image")

    shop_service = ShopService(db)
    bill_service = BillService(db)

    shop_id = None
    if data.get("shop_name"):
        shop = await shop_service.find_or_create_by_name(
            user_id=current_user.id,
            name=data["shop_name"],
            address=data.get("shop_address"),
            phone=data.get("shop_phone"),
            gstin=data.get("shop_gstin"),
        )
        shop_id = shop.id

    items = [
        PurchaseItemCreate(
            item_name=item.get("item_name", "Unknown"),
            quantity=item.get("quantity"),
            unit=item.get("unit"),
            mrp=item.get("mrp"),
            discount=item.get("discount"),
            bought_price=item.get("bought_price", 0),
        )
        for item in data.get("items", [])
    ]

    total = data.get("total_amount") or sum(i.bought_price for i in items)
    bill_date = data.get("bill_date") or __import__("datetime").date.today().isoformat()

    bill_create = BillCreate(
        shop_id=shop_id,
        bill_date=bill_date,
        total_amount=D(str(total)),
        entry_method="ocr",
        items=items,
    )
    return await bill_service.create_bill(current_user.id, bill_create)


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


# --- Item Price Comparison ---
@router.get("/items/{item_name}/prices", response_model=list[ItemPriceComparison])
async def get_item_prices(
    item_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BillService(db)
    return await service.get_item_price_comparison(current_user.id, item_name)


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
