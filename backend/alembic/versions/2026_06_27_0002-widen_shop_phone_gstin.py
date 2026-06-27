"""Widen shops.phone to 100 and shops.gstin to 50

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-27 00:02:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('shops', 'phone', type_=sa.String(100), existing_nullable=True)
    op.alter_column('shops', 'gstin', type_=sa.String(50), existing_nullable=True)


def downgrade() -> None:
    op.alter_column('shops', 'phone', type_=sa.String(20), existing_nullable=True)
    op.alter_column('shops', 'gstin', type_=sa.String(20), existing_nullable=True)
