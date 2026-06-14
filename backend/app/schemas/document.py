from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import Optional


class DocumentCreate(BaseModel):
    family_member_id: Optional[UUID] = None
    document_type: str
    document_number: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None


class DocumentUpdate(BaseModel):
    family_member_id: Optional[UUID] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None


class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    family_member_id: Optional[UUID] = None
    document_type: str
    document_number: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
