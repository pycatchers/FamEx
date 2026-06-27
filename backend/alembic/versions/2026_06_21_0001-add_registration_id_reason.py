"""Add registration_id to doctors and reason_for_visit to prescriptions

Revision ID: a1b2c3d4e5f6
Revises: 923e63a88a30
Create Date: 2026-06-21 00:01:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '923e63a88a30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('doctors', sa.Column('registration_id', sa.String(100), nullable=True))
    op.add_column('prescriptions', sa.Column('reason_for_visit', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('prescriptions', 'reason_for_visit')
    op.drop_column('doctors', 'registration_id')
