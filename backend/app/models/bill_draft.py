from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models import BaseModel
from app.database import Base


class BillDraft(BaseModel, Base):
    __tablename__ = "bill_drafts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    entry_method = Column(String(20), nullable=False, default="manual")  # manual, ocr, voice
    draft_data = Column(JSONB, nullable=False, default=dict)
