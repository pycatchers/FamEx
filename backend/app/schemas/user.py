import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    supabase_uid: str
    email: str | None = None
    display_name: str | None = None


class UserUpdate(BaseModel):
    display_name: str | None = None
    phone: str | None = None
    preferred_language: str | None = None
    push_token: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    supabase_uid: str
    email: str | None
    phone: str | None
    display_name: str | None
    preferred_language: str
    created_at: datetime
