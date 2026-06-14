from sqlalchemy import Column, String, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class Hospital(BaseModel, Base):
    __tablename__ = "hospitals"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    doctors = relationship("Doctor", back_populates="hospital", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="hospital")
