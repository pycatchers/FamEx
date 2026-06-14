from sqlalchemy import Column, String, Integer, Date, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class Medicine(BaseModel, Base):
    __tablename__ = "medicines"

    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    duration_days = Column(Integer, nullable=True)
    timing = Column(String(20), nullable=True)  # before_food, after_food, with_food
    morning = Column(Boolean, default=False)
    afternoon = Column(Boolean, default=False)
    night = Column(Boolean, default=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    prescription = relationship("Prescription", back_populates="medicines")
