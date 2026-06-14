from sqlalchemy import Column, String, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class Prescription(BaseModel, Base):
    __tablename__ = "prescriptions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id"), nullable=True, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True, index=True)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True, index=True)
    prescription_date = Column(Date, nullable=False)
    diagnosis = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    follow_up_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    doctor = relationship("Doctor", back_populates="prescriptions")
    hospital = relationship("Hospital", back_populates="prescriptions")
    medicines = relationship("Medicine", back_populates="prescription", cascade="all, delete-orphan")
