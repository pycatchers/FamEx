from sqlalchemy import Column, String, Date, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class ShoppingBill(BaseModel, Base):
    __tablename__ = "shopping_bills"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    shop_id = Column(UUID(as_uuid=True), ForeignKey("shops.id"), nullable=True, index=True)
    bill_number = Column(String(100), nullable=True)
    bill_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0)
    tax_amount = Column(Numeric(10, 2), default=0)
    payment_method = Column(String(20), nullable=True)  # cash, upi, card, other
    image_url = Column(String(500), nullable=True)
    entry_method = Column(String(20), nullable=False, default="manual")  # ocr, manual, voice
    notes = Column(Text, nullable=True)

    # Relationships
    shop = relationship("Shop", back_populates="bills")
    items = relationship("PurchaseItem", back_populates="bill", cascade="all, delete-orphan")
