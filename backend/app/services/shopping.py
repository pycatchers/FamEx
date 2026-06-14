from uuid import UUID
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.shop import Shop
from app.models.bill import ShoppingBill
from app.models.purchase import PurchaseItem
from app.models.checklist import ShoppingChecklist, ChecklistItem
from app.schemas.shopping import (
    ShopCreate, ShopUpdate, BillCreate, BillUpdate,
    ChecklistCreate, ChecklistUpdate, ChecklistItemCreate,
    MonthlySpending, ShopSpending, ItemFrequency, ShoppingAnalytics,
)


class ShopService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_shops(self, user_id: UUID) -> list[Shop]:
        result = await self.db.execute(
            select(Shop).where(Shop.user_id == user_id).order_by(Shop.name)
        )
        return list(result.scalars().all())

    async def get_shop(self, user_id: UUID, shop_id: UUID) -> Shop | None:
        result = await self.db.execute(
            select(Shop).where(Shop.id == shop_id, Shop.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_shop(self, user_id: UUID, data: ShopCreate) -> Shop:
        shop = Shop(user_id=user_id, **data.model_dump(exclude_unset=True))
        self.db.add(shop)
        await self.db.flush()
        await self.db.refresh(shop)
        return shop

    async def update_shop(self, shop: Shop, data: ShopUpdate) -> Shop:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(shop, field, value)
        await self.db.flush()
        await self.db.refresh(shop)
        return shop

    async def delete_shop(self, shop: Shop) -> None:
        await self.db.delete(shop)
        await self.db.flush()


class BillService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_bills(self, user_id: UUID, shop_id: UUID | None = None) -> list[ShoppingBill]:
        query = (
            select(ShoppingBill)
            .where(ShoppingBill.user_id == user_id)
            .options(selectinload(ShoppingBill.items))
        )
        if shop_id:
            query = query.where(ShoppingBill.shop_id == shop_id)
        query = query.order_by(ShoppingBill.bill_date.desc())
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    async def get_bill(self, user_id: UUID, bill_id: UUID) -> ShoppingBill | None:
        result = await self.db.execute(
            select(ShoppingBill)
            .where(ShoppingBill.id == bill_id, ShoppingBill.user_id == user_id)
            .options(selectinload(ShoppingBill.items))
        )
        return result.scalar_one_or_none()

    async def create_bill(self, user_id: UUID, data: BillCreate) -> ShoppingBill:
        bill_data = data.model_dump(exclude={"items"})
        bill = ShoppingBill(user_id=user_id, **bill_data)
        self.db.add(bill)
        await self.db.flush()

        # Add items
        for item_data in data.items:
            item = PurchaseItem(bill_id=bill.id, **item_data.model_dump())
            self.db.add(item)

        await self.db.flush()
        await self.db.refresh(bill)

        # Load items relationship
        result = await self.db.execute(
            select(ShoppingBill)
            .where(ShoppingBill.id == bill.id)
            .options(selectinload(ShoppingBill.items))
        )
        return result.scalar_one()

    async def update_bill(self, bill: ShoppingBill, data: BillUpdate) -> ShoppingBill:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(bill, field, value)
        await self.db.flush()
        await self.db.refresh(bill)
        return bill

    async def delete_bill(self, bill: ShoppingBill) -> None:
        await self.db.delete(bill)
        await self.db.flush()


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_analytics(self, user_id: UUID) -> ShoppingAnalytics:
        today = date.today()
        first_of_month = today.replace(day=1)
        first_of_last_month = (first_of_month - timedelta(days=1)).replace(day=1)

        # Monthly spending (last 6 months)
        six_months_ago = today - timedelta(days=180)
        monthly_result = await self.db.execute(
            select(
                func.to_char(ShoppingBill.bill_date, "YYYY-MM").label("month"),
                func.sum(ShoppingBill.total_amount).label("total"),
            )
            .where(ShoppingBill.user_id == user_id, ShoppingBill.bill_date >= six_months_ago)
            .group_by(func.to_char(ShoppingBill.bill_date, "YYYY-MM"))
            .order_by(func.to_char(ShoppingBill.bill_date, "YYYY-MM"))
        )
        monthly_spending = [
            MonthlySpending(month=row.month, total=row.total or Decimal("0"))
            for row in monthly_result.all()
        ]

        # Shop-wise spending
        shop_result = await self.db.execute(
            select(
                Shop.id,
                Shop.name,
                func.sum(ShoppingBill.total_amount).label("total"),
                func.count(ShoppingBill.id).label("bill_count"),
            )
            .join(ShoppingBill, ShoppingBill.shop_id == Shop.id)
            .where(ShoppingBill.user_id == user_id)
            .group_by(Shop.id, Shop.name)
            .order_by(func.sum(ShoppingBill.total_amount).desc())
            .limit(10)
        )
        shop_spending = [
            ShopSpending(
                shop_id=row.id,
                shop_name=row.name,
                total=row.total or Decimal("0"),
                bill_count=row.bill_count,
            )
            for row in shop_result.all()
        ]

        # Top items by frequency
        item_result = await self.db.execute(
            select(
                PurchaseItem.item_name,
                func.count(PurchaseItem.id).label("count"),
                func.avg(PurchaseItem.bought_price).label("avg_price"),
            )
            .join(ShoppingBill, PurchaseItem.bill_id == ShoppingBill.id)
            .where(ShoppingBill.user_id == user_id)
            .group_by(PurchaseItem.item_name)
            .order_by(func.count(PurchaseItem.id).desc())
            .limit(20)
        )
        top_items = [
            ItemFrequency(
                item_name=row.item_name,
                count=row.count,
                avg_price=Decimal(str(round(row.avg_price, 2))),
            )
            for row in item_result.all()
        ]

        # This month total
        this_month_result = await self.db.execute(
            select(func.sum(ShoppingBill.total_amount))
            .where(ShoppingBill.user_id == user_id, ShoppingBill.bill_date >= first_of_month)
        )
        total_this_month = this_month_result.scalar() or Decimal("0")

        # Last month total
        last_month_result = await self.db.execute(
            select(func.sum(ShoppingBill.total_amount))
            .where(
                ShoppingBill.user_id == user_id,
                ShoppingBill.bill_date >= first_of_last_month,
                ShoppingBill.bill_date < first_of_month,
            )
        )
        total_last_month = last_month_result.scalar() or Decimal("0")

        return ShoppingAnalytics(
            monthly_spending=monthly_spending,
            shop_spending=shop_spending,
            top_items=top_items,
            total_this_month=total_this_month,
            total_last_month=total_last_month,
        )


class ChecklistService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_checklists(self, user_id: UUID) -> list[ShoppingChecklist]:
        result = await self.db.execute(
            select(ShoppingChecklist)
            .where(ShoppingChecklist.user_id == user_id)
            .options(selectinload(ShoppingChecklist.items))
            .order_by(ShoppingChecklist.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def get_checklist(self, user_id: UUID, checklist_id: UUID) -> ShoppingChecklist | None:
        result = await self.db.execute(
            select(ShoppingChecklist)
            .where(ShoppingChecklist.id == checklist_id, ShoppingChecklist.user_id == user_id)
            .options(selectinload(ShoppingChecklist.items))
        )
        return result.scalar_one_or_none()

    async def create_checklist(self, user_id: UUID, data: ChecklistCreate) -> ShoppingChecklist:
        checklist = ShoppingChecklist(user_id=user_id, title=data.title)
        self.db.add(checklist)
        await self.db.flush()

        for i, item_data in enumerate(data.items):
            item = ChecklistItem(
                checklist_id=checklist.id,
                item_name=item_data.item_name,
                quantity=item_data.quantity,
                sort_order=item_data.sort_order or i,
            )
            self.db.add(item)

        await self.db.flush()
        # Reload with items
        result = await self.db.execute(
            select(ShoppingChecklist)
            .where(ShoppingChecklist.id == checklist.id)
            .options(selectinload(ShoppingChecklist.items))
        )
        return result.scalar_one()

    async def update_checklist(self, checklist: ShoppingChecklist, data: ChecklistUpdate) -> ShoppingChecklist:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(checklist, field, value)
        await self.db.flush()
        await self.db.refresh(checklist)
        return checklist

    async def delete_checklist(self, checklist: ShoppingChecklist) -> None:
        await self.db.delete(checklist)
        await self.db.flush()

    async def add_item(self, checklist_id: UUID, data: ChecklistItemCreate) -> ChecklistItem:
        item = ChecklistItem(checklist_id=checklist_id, **data.model_dump())
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def toggle_item(self, user_id: UUID, checklist_id: UUID, item_id: UUID) -> ChecklistItem | None:
        # Verify ownership
        checklist = await self.get_checklist(user_id, checklist_id)
        if not checklist:
            return None
        result = await self.db.execute(
            select(ChecklistItem).where(
                ChecklistItem.id == item_id,
                ChecklistItem.checklist_id == checklist_id,
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return None
        item.is_checked = not item.is_checked
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def delete_item(self, user_id: UUID, checklist_id: UUID, item_id: UUID) -> bool:
        checklist = await self.get_checklist(user_id, checklist_id)
        if not checklist:
            return False
        result = await self.db.execute(
            select(ChecklistItem).where(
                ChecklistItem.id == item_id,
                ChecklistItem.checklist_id == checklist_id,
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return False
        await self.db.delete(item)
        await self.db.flush()
        return True
