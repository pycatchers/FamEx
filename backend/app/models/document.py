import uuid
from sqlalchemy import Column, String, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class Document(BaseModel, Base):
    __tablename__ = "documents"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id"), nullable=True, index=True)
    document_type = Column(String(50), nullable=False)  # aadhaar, pan, passport, voter_id, driving_license, birth_certificate, etc.
    document_number = Column(String(100), nullable=True)
    issuing_authority = Column(String(255), nullable=True)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    file_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(JSONB, default=list)  # Store as JSON array since asyncpg handles it well

    # Relationships
    family_member = relationship("FamilyMember", back_populates="documents")
