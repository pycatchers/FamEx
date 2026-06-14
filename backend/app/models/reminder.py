from sqlalchemy import Column, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models import BaseModel
from app.database import Base


class Reminder(BaseModel, Base):
    __tablename__ = "reminders"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    reminder_type = Column(String(50), nullable=False)  # emi, insurance_renewal, insurance_premium, document_expiry, follow_up, medicine, custom
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    reference_type = Column(String(50), nullable=True)  # loan, insurance, document, prescription
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    remind_at = Column(DateTime, nullable=False)
    is_sent = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    recurrence = Column(String(20), default="none")  # none, daily, weekly, monthly
