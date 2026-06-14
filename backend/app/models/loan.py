from sqlalchemy import Column, String, Date, ForeignKey, Text, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models import BaseModel
from app.database import Base


class Loan(BaseModel, Base):
    __tablename__ = "loans"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id"), nullable=True)
    loan_type = Column(String(50), nullable=False)  # home, vehicle, personal, education, gold, business, other
    lender_name = Column(String(255), nullable=False)
    loan_account_number = Column(String(100), nullable=True)
    principal_amount = Column(Numeric(12, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    tenure_months = Column(Integer, nullable=False)
    emi_amount = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    emi_day_of_month = Column(Integer, nullable=True)  # 1-28
    outstanding_amount = Column(Numeric(12, 2), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, closed, defaulted
    notes = Column(Text, nullable=True)

    # Relationships
    emi_payments = relationship("EMIPayment", back_populates="loan", cascade="all, delete-orphan")


class EMIPayment(BaseModel, Base):
    __tablename__ = "emi_payments"

    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id"), nullable=False, index=True)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    principal_component = Column(Numeric(10, 2), nullable=True)
    interest_component = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), nullable=False, default="upcoming")  # upcoming, paid, overdue, skipped
    receipt_url = Column(String(500), nullable=True)

    # Relationships
    loan = relationship("Loan", back_populates="emi_payments")
