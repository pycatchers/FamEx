from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class ReminderCreate(BaseModel):
    reminder_type: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    title: str
    description: Optional[str] = None
    remind_at: datetime
    recurrence: str = "none"


class ReminderResponse(BaseModel):
    id: UUID
    user_id: UUID
    reminder_type: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    title: str
    description: Optional[str] = None
    remind_at: datetime
    is_sent: bool
    is_dismissed: bool
    recurrence: str
    created_at: datetime

    model_config = {"from_attributes": True}
