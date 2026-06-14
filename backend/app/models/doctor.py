from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class Doctor(BaseModel, Base):
    __tablename__ = "doctors"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    specialization = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    hospital = relationship("Hospital", back_populates="doctors")
    prescriptions = relationship("Prescription", back_populates="doctor")
