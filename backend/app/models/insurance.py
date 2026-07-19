from sqlalchemy import Column, String, Date, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class InsurancePolicy(BaseModel, Base):
    __tablename__ = "insurance_policies"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id"), nullable=True)
    policy_type = Column(String(50), nullable=False)  # life, health, vehicle, home, travel, personal_accident, other
    provider_name = Column(String(255), nullable=False)
    policy_number = Column(String(100), nullable=False)
    sum_insured = Column(Numeric(12, 2), nullable=True)
    premium_amount = Column(Numeric(10, 2), nullable=False)
    premium_frequency = Column(String(20), nullable=False)  # monthly, quarterly, half_yearly, yearly
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    next_premium_date = Column(Date, nullable=True)
    nominee_name = Column(String(255), nullable=True)
    nominee_relation = Column(String(100), nullable=True)
    vehicle_number = Column(String(50), nullable=True)
    vehicle_make_model = Column(String(255), nullable=True)
    agent_name = Column(String(255), nullable=True)
    agent_phone = Column(String(20), nullable=True)
    document_url = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, expired, cancelled, claimed
    notes = Column(Text, nullable=True)

    # Relationships
    premium_payments = relationship("PremiumPayment", back_populates="policy", cascade="all, delete-orphan")


class PremiumPayment(BaseModel, Base):
    __tablename__ = "premium_payments"

    policy_id = Column(UUID(as_uuid=True), ForeignKey("insurance_policies.id"), nullable=False, index=True)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="upcoming")  # upcoming, paid, overdue, skipped
    receipt_url = Column(String(500), nullable=True)

    # Relationships
    policy = relationship("InsurancePolicy", back_populates="premium_payments")
