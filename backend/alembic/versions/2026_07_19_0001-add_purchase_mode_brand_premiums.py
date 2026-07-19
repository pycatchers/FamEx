"""Add purchase_mode, brand_name, and premium_payments table

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-07-19 00:01:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'shopping_bills',
        sa.Column('purchase_mode', sa.String(length=10), nullable=False, server_default='offline'),
    )
    op.add_column('purchase_items', sa.Column('brand_name', sa.String(length=255), nullable=True))

    op.create_table(
        'premium_payments',
        sa.Column('policy_id', sa.UUID(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('paid_date', sa.Date(), nullable=True),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='upcoming'),
        sa.Column('receipt_url', sa.String(length=500), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['policy_id'], ['insurance_policies.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_premium_payments_policy_id'), 'premium_payments', ['policy_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_premium_payments_policy_id'), table_name='premium_payments')
    op.drop_table('premium_payments')
    op.drop_column('purchase_items', 'brand_name')
    op.drop_column('shopping_bills', 'purchase_mode')
