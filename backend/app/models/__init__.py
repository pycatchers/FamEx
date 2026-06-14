import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

__all__ = ["Base", "BaseModel", "FamilyMember", "Document"]


class BaseModel(Base):
    """Abstract mixin providing id, created_at, and updated_at columns."""

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# Import models AFTER BaseModel is defined so Alembic and SQLAlchemy can
# discover all tables when app.models is imported.
from app.models.family import FamilyMember  # noqa: E402, F401
from app.models.document import Document  # noqa: E402, F401
from app.models.loan import Loan, EMIPayment  # noqa: E402, F401
from app.models.insurance import InsurancePolicy  # noqa: E402, F401
from app.models.reminder import Reminder  # noqa: E402, F401
