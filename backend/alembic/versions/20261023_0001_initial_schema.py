"""initial schema: users, roles, people, faces, consent, attendance, scans, audit, settings

Revision ID: 0001
Revises: 
Create Date: 2026-10-23 09:57:36.241098
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = '0001'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.create_table('departments',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('code', sa.String(length=20), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=False),
    sa.Column('name_km', sa.String(length=150), nullable=True),
    sa.Column('kind', sa.Enum('DEPARTMENT', 'CLASS', name='department_kind'), nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=False),
    sa.Column('updated_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_departments')),
    sa.UniqueConstraint('code', name=op.f('uq_departments_code')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_table('id_sequences',
    sa.Column('prefix', sa.String(length=10), nullable=False),
    sa.Column('year', sa.SmallInteger(), autoincrement=False, nullable=False),
    sa.Column('next_value', sa.Integer().with_variant(mysql.INTEGER(unsigned=True), 'mysql'), server_default=sa.text('1'), nullable=False),
    sa.PrimaryKeyConstraint('prefix', 'year', name=op.f('pk_id_sequences')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_table('permissions',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('code', sa.String(length=64), nullable=False),
    sa.Column('description', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_permissions')),
    sa.UniqueConstraint('code', name=op.f('uq_permissions_code')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_table('roles',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('display_name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.String(length=255), nullable=True),
    sa.Column('is_system', sa.Boolean(), server_default=sa.text('0'), nullable=False),
    sa.Column('updated_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_roles')),
    sa.UniqueConstraint('name', name=op.f('uq_roles_name')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_table('role_permissions',
    sa.Column('role_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('permission_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], name=op.f('fk_role_permissions_permission_id_permissions'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], name=op.f('fk_role_permissions_role_id_roles'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('role_id', 'permission_id', name=op.f('pk_role_permissions')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_table('users',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=150), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('role_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=False),
    sa.Column('failed_login_count', sa.SmallInteger(), server_default=sa.text('0'), nullable=False),
    sa.Column('locked_until', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('last_login_at', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('password_changed_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.Column('updated_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], name=op.f('fk_users_role_id_roles'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
    sa.UniqueConstraint('email', name=op.f('uq_users_email')),
    sa.UniqueConstraint('username', name=op.f('uq_users_username')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)
    op.create_table('audit_logs',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('actor_user_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('action', sa.String(length=64), nullable=False),
    sa.Column('entity_type', sa.String(length=40), nullable=False),
    sa.Column('entity_id', sa.String(length=40), nullable=True),
    sa.Column('before_data', sa.JSON(), nullable=True),
    sa.Column('after_data', sa.JSON(), nullable=True),
    sa.Column('reason', sa.String(length=255), nullable=True),
    sa.Column('request_id', sa.String(length=36), nullable=True),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('user_agent', sa.String(length=255), nullable=True),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], name=op.f('fk_audit_logs_actor_user_id_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_logs')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_audit_entity', 'audit_logs', ['entity_type', 'entity_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_actor_user_id'), 'audit_logs', ['actor_user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_table('people',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('person_code', sa.String(length=30), nullable=False),
    sa.Column('person_type', sa.Enum('EMPLOYEE', 'STUDENT', name='person_type'), nullable=False),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('name_km', sa.String(length=200), nullable=True),
    sa.Column('department_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('position', sa.String(length=100), nullable=True),
    sa.Column('email', sa.String(length=255), nullable=True),
    sa.Column('phone', sa.String(length=30), nullable=True),
    sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'ARCHIVED', name='person_status'), server_default='ACTIVE', nullable=False),
    sa.Column('photo_file', sa.String(length=64), nullable=True),
    sa.Column('joined_on', sa.Date(), nullable=True),
    sa.Column('archived_at', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('erased_at', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('created_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('updated_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('updated_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_people_created_by_users'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], name=op.f('fk_people_department_id_departments'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['updated_by'], ['users.id'], name=op.f('fk_people_updated_by_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_people')),
    sa.UniqueConstraint('email', name=op.f('uq_people_email')),
    sa.UniqueConstraint('person_code', name=op.f('uq_people_person_code')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index(op.f('ix_people_department_id'), 'people', ['department_id'], unique=False)
    op.create_index('ix_people_name', 'people', ['last_name', 'first_name'], unique=False)
    op.create_index(op.f('ix_people_person_type'), 'people', ['person_type'], unique=False)
    op.create_index(op.f('ix_people_status'), 'people', ['status'], unique=False)
    op.create_table('system_settings',
    sa.Column('key', sa.String(length=64), nullable=False),
    sa.Column('value', sa.JSON(), nullable=False),
    sa.Column('updated_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('updated_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['updated_by'], ['users.id'], name=op.f('fk_system_settings_updated_by_users'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('key', name=op.f('pk_system_settings')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_table('user_sessions',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('family_id', sa.String(length=36), nullable=False),
    sa.Column('expires_at', mysql.DATETIME(fsp=6), nullable=False),
    sa.Column('rotated_at', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('revoked_at', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('user_agent', sa.String(length=255), nullable=True),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_sessions_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_user_sessions')),
    sa.UniqueConstraint('token_hash', name=op.f('uq_user_sessions_token_hash')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index(op.f('ix_user_sessions_family_id'), 'user_sessions', ['family_id'], unique=False)
    op.create_index(op.f('ix_user_sessions_user_id'), 'user_sessions', ['user_id'], unique=False)
    op.create_table('consent_records',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('person_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('consent_type', sa.Enum('BIOMETRIC_FACE', name='consent_type'), nullable=False),
    sa.Column('action', sa.Enum('GRANTED', 'WITHDRAWN', name='consent_action'), nullable=False),
    sa.Column('method', sa.Enum('PAPER_FORM', 'DIGITAL_FORM', 'WITNESSED_VERBAL', name='consent_method'), nullable=False),
    sa.Column('notice_version', sa.String(length=20), nullable=False),
    sa.Column('evidence_ref', sa.String(length=255), nullable=True),
    sa.Column('recorded_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('notes', sa.String(length=500), nullable=True),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['person_id'], ['people.id'], name=op.f('fk_consent_records_person_id_people'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], name=op.f('fk_consent_records_recorded_by_users'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_consent_records')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_consent_person', 'consent_records', ['person_id', 'consent_type', 'created_at'], unique=False)
    op.create_table('face_templates',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('person_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('embedding_ciphertext', sa.LargeBinary().with_variant(sa.VARBINARY(length=1024), 'mysql'), nullable=False),
    sa.Column('key_id', sa.String(length=16), nullable=False),
    sa.Column('model_name', sa.String(length=50), nullable=False),
    sa.Column('detector_name', sa.String(length=50), nullable=False),
    sa.Column('embedding_dim', sa.SmallInteger(), nullable=False),
    sa.Column('quality_score', sa.Float(), nullable=False),
    sa.Column('detection_score', sa.Float(), nullable=False),
    sa.Column('source', sa.Enum('UPLOAD', 'WEBCAM', name='face_source'), nullable=False),
    sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REVOKED', name='template_status'), server_default='PENDING', nullable=False),
    sa.Column('created_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('approved_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('approved_at', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], name=op.f('fk_face_templates_approved_by_users'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_face_templates_created_by_users'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['person_id'], ['people.id'], name=op.f('fk_face_templates_person_id_people'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_face_templates')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_face_templates_person_status', 'face_templates', ['person_id', 'status'], unique=False)
    op.create_table('scan_events',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('request_id', sa.String(length=36), nullable=False),
    sa.Column('face_index', sa.SmallInteger(), server_default=sa.text('0'), nullable=False),
    sa.Column('mode', sa.Enum('LIVE', 'UPLOAD', name='scan_mode'), nullable=False),
    sa.Column('outcome', sa.Enum('MATCH', 'REVIEW', 'NO_MATCH', 'LOW_QUALITY', 'NO_FACE', 'LIVENESS_FAILED', name='scan_outcome'), nullable=False),
    sa.Column('matched_person_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('candidate_person_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('score', sa.Float(), nullable=True),
    sa.Column('second_score', sa.Float(), nullable=True),
    sa.Column('accept_threshold', sa.Float(), nullable=False),
    sa.Column('review_threshold', sa.Float(), nullable=False),
    sa.Column('quality_score', sa.Float(), nullable=True),
    sa.Column('liveness_result', sa.Enum('NOT_RUN', 'PASSED', 'FAILED', name='liveness_result'), server_default='NOT_RUN', nullable=False),
    sa.Column('model_name', sa.String(length=50), nullable=False),
    sa.Column('review_status', sa.Enum('NONE', 'PENDING', 'CONFIRMED', 'REJECTED', name='review_status'), server_default='NONE', nullable=False),
    sa.Column('reviewed_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('reviewed_at', mysql.DATETIME(fsp=6), nullable=True),
    sa.Column('scanned_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('client_ip', sa.String(length=45), nullable=True),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['candidate_person_id'], ['people.id'], name=op.f('fk_scan_events_candidate_person_id_people'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['matched_person_id'], ['people.id'], name=op.f('fk_scan_events_matched_person_id_people'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], name=op.f('fk_scan_events_reviewed_by_users'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['scanned_by'], ['users.id'], name=op.f('fk_scan_events_scanned_by_users'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_scan_events')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index(op.f('ix_scan_events_created_at'), 'scan_events', ['created_at'], unique=False)
    op.create_index(op.f('ix_scan_events_matched_person_id'), 'scan_events', ['matched_person_id'], unique=False)
    op.create_index(op.f('ix_scan_events_outcome'), 'scan_events', ['outcome'], unique=False)
    op.create_index(op.f('ix_scan_events_request_id'), 'scan_events', ['request_id'], unique=False)
    op.create_table('attendance_records',
    sa.Column('id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), autoincrement=True, nullable=False),
    sa.Column('person_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('event_type', sa.Enum('CHECK_IN', 'CHECK_OUT', name='attendance_event_type'), nullable=False),
    sa.Column('occurred_at', mysql.DATETIME(fsp=6), nullable=False),
    sa.Column('attendance_date', sa.Date(), nullable=False),
    sa.Column('method', sa.Enum('FACE_LIVE', 'FACE_UPLOAD', 'MANUAL', 'ID_LOOKUP', name='attendance_method'), nullable=False),
    sa.Column('punctuality', sa.Enum('ON_TIME', 'LATE', name='punctuality'), nullable=True),
    sa.Column('scan_event_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('verified_by_review', sa.Boolean(), server_default=sa.text('0'), nullable=False),
    sa.Column('is_voided', sa.Boolean(), server_default=sa.text('0'), nullable=False),
    sa.Column('void_reason', sa.String(length=255), nullable=True),
    sa.Column('corrects_id', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=True),
    sa.Column('note', sa.String(length=255), nullable=True),
    sa.Column('recorded_by', sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), 'mysql'), nullable=False),
    sa.Column('created_at', mysql.DATETIME(fsp=6), server_default=sa.text('CURRENT_TIMESTAMP(6)'), nullable=False),
    sa.ForeignKeyConstraint(['corrects_id'], ['attendance_records.id'], name=op.f('fk_attendance_records_corrects_id_attendance_records'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['person_id'], ['people.id'], name=op.f('fk_attendance_records_person_id_people'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], name=op.f('fk_attendance_records_recorded_by_users'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['scan_event_id'], ['scan_events.id'], name=op.f('fk_attendance_records_scan_event_id_scan_events'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_attendance_records')),
    mysql_charset='utf8mb4',
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_att_date_person', 'attendance_records', ['attendance_date', 'person_id'], unique=False)
    op.create_index('ix_att_person_time', 'attendance_records', ['person_id', 'occurred_at'], unique=False)


def downgrade() -> None:
    # Dropping a table drops its indexes. Dropping FK-backing indexes first fails on MySQL (error 1553).
    op.drop_table('attendance_records')
    op.drop_table('scan_events')
    op.drop_table('face_templates')
    op.drop_table('consent_records')
    op.drop_table('user_sessions')
    op.drop_table('system_settings')
    op.drop_table('people')
    op.drop_table('audit_logs')
    op.drop_table('users')
    op.drop_table('role_permissions')
    op.drop_table('roles')
    op.drop_table('permissions')
    op.drop_table('id_sequences')
    op.drop_table('departments')
