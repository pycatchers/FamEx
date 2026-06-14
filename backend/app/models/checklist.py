from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class ShoppingChecklist(BaseModel, Base):
    __tablename__ = "shopping_checklists"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    items = relationship("ChecklistItem", back_populates="checklist", cascade="all, delete-orphan")


class ChecklistItem(BaseModel, Base):
    __tablename__ = "checklist_items"

    checklist_id = Column(UUID(as_uuid=True), ForeignKey("shopping_checklists.id"), nullable=False, index=True)
    item_name = Column(String(255), nullable=False)
    quantity = Column(String(50), nullable=True)
    is_checked = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)

    # Relationships
    checklist = relationship("ShoppingChecklist", back_populates="items")
