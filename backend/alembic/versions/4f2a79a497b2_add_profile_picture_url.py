"""add_profile_picture_url

Revision ID: 4f2a79a497b2
Revises: c18de29d696a
Create Date: 2026-05-12

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f2a79a497b2'
down_revision: Union[str, Sequence[str], None] = 'c18de29d696a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'clients',
        sa.Column('profile_picture_url', sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('clients', 'profile_picture_url')
