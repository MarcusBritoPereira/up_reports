"""add whatsapp automation tables

Revision ID: 8a9f2d1c4b7e
Revises: 1628c2bb14b1
Create Date: 2026-05-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8a9f2d1c4b7e"
down_revision: Union[str, Sequence[str], None] = "1628c2bb14b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "whatsapp_connections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("phone_label", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("qr_payload", sa.Text(), nullable=True),
        sa.Column("qr_expires_at", sa.DateTime(), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_whatsapp_connections_client_id"), "whatsapp_connections", ["client_id"], unique=False)
    op.create_index(op.f("ix_whatsapp_connections_id"), "whatsapp_connections", ["id"], unique=False)

    op.create_table(
        "whatsapp_groups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("connection_id", sa.Integer(), nullable=False),
        sa.Column("external_group_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("selected", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["connection_id"], ["whatsapp_connections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("connection_id", "external_group_id", name="uq_whatsapp_group_connection_external"),
    )
    op.create_index(op.f("ix_whatsapp_groups_client_id"), "whatsapp_groups", ["client_id"], unique=False)
    op.create_index(op.f("ix_whatsapp_groups_connection_id"), "whatsapp_groups", ["connection_id"], unique=False)
    op.create_index(op.f("ix_whatsapp_groups_id"), "whatsapp_groups", ["id"], unique=False)

    op.create_table(
        "whatsapp_message_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("variables_json", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_whatsapp_message_templates_client_id"), "whatsapp_message_templates", ["client_id"], unique=False)
    op.create_index(op.f("ix_whatsapp_message_templates_id"), "whatsapp_message_templates", ["id"], unique=False)

    op.create_table(
        "whatsapp_report_schedules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("template_id", sa.Integer(), nullable=False),
        sa.Column("report_type", sa.String(), nullable=False),
        sa.Column("period_days", sa.Integer(), nullable=False),
        sa.Column("frequency", sa.String(), nullable=False),
        sa.Column("send_time", sa.String(), nullable=False),
        sa.Column("timezone", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("next_run_at", sa.DateTime(), nullable=True),
        sa.Column("last_run_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["group_id"], ["whatsapp_groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["template_id"], ["whatsapp_message_templates.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_whatsapp_report_schedules_client_id"), "whatsapp_report_schedules", ["client_id"], unique=False)
    op.create_index(op.f("ix_whatsapp_report_schedules_group_id"), "whatsapp_report_schedules", ["group_id"], unique=False)
    op.create_index(op.f("ix_whatsapp_report_schedules_id"), "whatsapp_report_schedules", ["id"], unique=False)
    op.create_index(op.f("ix_whatsapp_report_schedules_template_id"), "whatsapp_report_schedules", ["template_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_whatsapp_report_schedules_template_id"), table_name="whatsapp_report_schedules")
    op.drop_index(op.f("ix_whatsapp_report_schedules_id"), table_name="whatsapp_report_schedules")
    op.drop_index(op.f("ix_whatsapp_report_schedules_group_id"), table_name="whatsapp_report_schedules")
    op.drop_index(op.f("ix_whatsapp_report_schedules_client_id"), table_name="whatsapp_report_schedules")
    op.drop_table("whatsapp_report_schedules")
    op.drop_index(op.f("ix_whatsapp_message_templates_id"), table_name="whatsapp_message_templates")
    op.drop_index(op.f("ix_whatsapp_message_templates_client_id"), table_name="whatsapp_message_templates")
    op.drop_table("whatsapp_message_templates")
    op.drop_index(op.f("ix_whatsapp_groups_id"), table_name="whatsapp_groups")
    op.drop_index(op.f("ix_whatsapp_groups_connection_id"), table_name="whatsapp_groups")
    op.drop_index(op.f("ix_whatsapp_groups_client_id"), table_name="whatsapp_groups")
    op.drop_table("whatsapp_groups")
    op.drop_index(op.f("ix_whatsapp_connections_id"), table_name="whatsapp_connections")
    op.drop_index(op.f("ix_whatsapp_connections_client_id"), table_name="whatsapp_connections")
    op.drop_table("whatsapp_connections")
