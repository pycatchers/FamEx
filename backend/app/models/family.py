import uuid
from sqlalchemy import Column, String, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class FamilyMember(BaseModel, Base):
    __tablename__ = "family_members"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    relationship = Column(String(100), nullable=False)  # father, mother, spouse, child, sibling, etc.
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)  # male, female, other
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    photo_url = Column(String(500), nullable=True)
    blood_group = Column(String(10), nullable=True)
    guardian_name = Column(String(255), nullable=True)
    guardian_phone = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    documents = relationship("Document", back_populates="family_member", cascade="all, delete-orphan")
