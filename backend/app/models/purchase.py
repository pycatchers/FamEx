from sqlalchemy import Column, String, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class PurchaseItem(BaseModel, Base):
    __tablename__ = "purchase_items"

    bill_id = Column(UUID(as_uuid=True), ForeignKey("shopping_bills.id"), nullable=False, index=True)
    item_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)  # dairy, vegetables, fruits, grains, snacks, etc.
    quantity = Column(Numeric(8, 3), nullable=True)
    unit = Column(String(20), nullable=True)  # kg, litre, piece, pack, etc.
    mrp = Column(Numeric(10, 2), nullable=True)
    discount = Column(Numeric(10, 2), default=0)
    bought_price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    bill = relationship("ShoppingBill", back_populates="items")
