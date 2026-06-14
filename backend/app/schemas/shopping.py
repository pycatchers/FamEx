from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


# --- Shop ---
class ShopCreate(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    is_favorite: bool = False
    notes: Optional[str] = None


class ShopUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    is_favorite: Optional[bool] = None
    notes: Optional[str] = None


class ShopResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    is_favorite: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Purchase Item ---
class PurchaseItemCreate(BaseModel):
    item_name: str
    category: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    mrp: Optional[Decimal] = None
    discount: Decimal = Decimal("0")
    bought_price: Decimal


class PurchaseItemResponse(BaseModel):
    id: UUID
    bill_id: UUID
    item_name: str
    category: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    mrp: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    bought_price: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Shopping Bill ---
class BillCreate(BaseModel):
    shop_id: Optional[UUID] = None
    bill_number: Optional[str] = None
    bill_date: date
    total_amount: Decimal
    discount_amount: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    payment_method: Optional[str] = None
    image_url: Optional[str] = None
    entry_method: str = "manual"
    notes: Optional[str] = None
    items: list[PurchaseItemCreate] = []


class BillUpdate(BaseModel):
    shop_id: Optional[UUID] = None
    bill_number: Optional[str] = None
    bill_date: Optional[date] = None
    total_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class BillResponse(BaseModel):
    id: UUID
    user_id: UUID
    shop_id: Optional[UUID] = None
    bill_number: Optional[str] = None
    bill_date: date
    total_amount: Decimal
    discount_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    image_url: Optional[str] = None
    entry_method: str
    notes: Optional[str] = None
    items: list[PurchaseItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Checklist ---
class ChecklistItemCreate(BaseModel):
    item_name: str
    quantity: Optional[str] = None
    sort_order: int = 0


class ChecklistItemResponse(BaseModel):
    id: UUID
    checklist_id: UUID
    item_name: str
    quantity: Optional[str] = None
    is_checked: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChecklistCreate(BaseModel):
    title: str
    items: list[ChecklistItemCreate] = []


class ChecklistUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None


class ChecklistResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    is_active: bool
    items: list[ChecklistItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Analytics ---
class MonthlySpending(BaseModel):
    month: str  # "2024-01"
    total: Decimal


class ShopSpending(BaseModel):
    shop_id: UUID
    shop_name: str
    total: Decimal
    bill_count: int


class ItemFrequency(BaseModel):
    item_name: str
    count: int
    avg_price: Decimal


class ShoppingAnalytics(BaseModel):
    monthly_spending: list[MonthlySpending] = []
    shop_spending: list[ShopSpending] = []
    top_items: list[ItemFrequency] = []
    total_this_month: Decimal = Decimal("0")
    total_last_month: Decimal = Decimal("0")
