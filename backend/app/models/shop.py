from sqlalchemy import Column, String, ForeignKey, Text, Numeric, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class Shop(BaseModel, Base):
    __tablename__ = "shops"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    phone = Column(String(100), nullable=True)
    gstin = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)  # grocery, electronics, medical, clothing, etc.
    is_favorite = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    # Relationships
    bills = relationship("ShoppingBill", back_populates="shop", cascade="all, delete-orphan")
