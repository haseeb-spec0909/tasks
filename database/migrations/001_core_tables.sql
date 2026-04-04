-- TMC TimeIntel Core Tables Migration
-- Created: 2026-04-04
-- PostgreSQL 15 compatible
-- This migration creates all core tables for the TimeIntel platform

BEGIN;

-- ==============================================================================
-- USERS TABLE
-- ==============================================================================
-- Core user profile information with OAuth integration
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[^@]+@tmcltd\.ai$'),
    display_name VARCHAR(255),
    avatar_url TEXT,
    pf_user_id INTEGER UNIQUE,
    role VARCHAR(20) DEFAULT 'consultant' CHECK (role IN ('consultant', 'manager', 'admin')),
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles with authentication and preferences';
COMMENT ON COLUMN users.google_id IS 'Google OAuth ID for authentication';
COMMENT ON COLUMN users.email IS 'TMC email (must be @tmcltd.ai domain)';
COMMENT ON COLUMN users.pf_user_id IS 'ProjectFlow user ID for integration';
COMMENT ON COLUMN users.role IS 'User role for authorization';

-- ==============================================================================
-- USER_SETTINGS TABLE
-- ==============================================================================
-- Per-user configuration including working hours and notification preferences
CREATE TABLE user_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users ON DELETE CASCADE,
    working_hours_json JSONB DEFAULT '{"monday":{"start":"09:00","end":"18:00"},"tuesday":{"start":"09:00","end":"18:00"},"wednesday":{"start":"09:00","end":"18:00"},"thursday":{"start":"09:00","end":"18:00"},"friday":{"start":"09:00","end":"18:00"}}',
    focus_target_mins INTEGER DEFAULT 480,
    focus_defense_mode VARCHAR(10) DEFAULT 'flexible' CHECK (focus_defense_mode IN ('flexible', 'locked')),
    scheduling_horizon_days INTEGER DEFAULT 14,
    default_task_duration_mins INTEGER DEFAULT 30,
    min_focus_block_mins INTEGER DEFAULT 30,
    max_focus_block_mins INTEGER DEFAULT 120,
    ideal_focus_start_time TIME DEFAULT '09:00',
    notifications_config_json JSONB DEFAULT '{"overdue":true,"deadline":true,"new_assignment":true,"focus_start":true,"daily_digest":true,"weekly_digest":true}',
    meeting_hours_json JSONB,
    personal_hours_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_settings IS 'User-specific settings for focus time, scheduling, and notifications';
COMMENT ON COLUMN user_settings.working_hours_json IS 'Weekly working hours by day with start/end times';
COMMENT ON COLUMN user_settings.focus_target_mins IS 'Daily focus time target in minutes (default 480 = 8 hours)';
COMMENT ON COLUMN user_settings.focus_defense_mode IS 'flexible: can adjust, locked: rigid scheduling';
COMMENT ON COLUMN user_settings.notifications_config_json IS 'Notification type preferences (boolean flags)';

-- ==============================================================================
-- TASKS TABLE
-- ==============================================================================
-- Core task data synced from Google Tasks and ProjectFlow
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('GOOGLE_TASKS', 'PROJECTFLOW')),
    external_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'ON_HOLD', 'COMPLETED', 'BLOCKED', 'CANCELLED')),
    priority VARCHAR(15) DEFAULT 'P3_MEDIUM' CHECK (priority IN ('P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW')),
    due_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    estimated_duration_mins INTEGER DEFAULT 30,
    min_block_mins INTEGER DEFAULT 30,
    allow_split BOOLEAN DEFAULT false,
    progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    context_hierarchy TEXT,
    wp_code VARCHAR(50),
    pf_status_id INTEGER,
    pf_baseline_start DATE,
    pf_baseline_end DATE,
    calendar_block_id VARCHAR(255),
    owner_user_id UUID REFERENCES users ON DELETE SET NULL,
    notes TEXT,
    task_type VARCHAR(10) DEFAULT 'work' CHECK (task_type IN ('work', 'personal')),
    is_archived BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source, external_id, user_id)
);

COMMENT ON TABLE tasks IS 'Tasks synced from Google Tasks and ProjectFlow with metadata';
COMMENT ON COLUMN tasks.source IS 'Source system: GOOGLE_TASKS or PROJECTFLOW';
COMMENT ON COLUMN tasks.external_id IS 'ID from source system (must be unique per source+user)';
COMMENT ON COLUMN tasks.progress_pct IS 'Completion percentage 0-100';
COMMENT ON COLUMN tasks.context_hierarchy IS 'Task list/hierarchy context from source';
COMMENT ON COLUMN tasks.wp_code IS 'ProjectFlow Work Package code';
COMMENT ON COLUMN tasks.calendar_block_id IS 'Google Calendar event ID if scheduled';
COMMENT ON COLUMN tasks.allow_split IS 'Whether task can be split into multiple calendar blocks';

-- ==============================================================================
-- PF_TASK_META TABLE
-- ==============================================================================
-- ProjectFlow-specific metadata and WBS hierarchy information
CREATE TABLE pf_task_meta (
    pf_meta_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID UNIQUE NOT NULL REFERENCES tasks ON DELETE CASCADE,
    wp_task_id INTEGER NOT NULL,
    wp_id INTEGER,
    deliverable_id INTEGER,
    build_id INTEGER,
    project_id INTEGER,
    pf_status_id INTEGER,
    pf_task_name VARCHAR(500),
    wp_code VARCHAR(50),
    wp_description TEXT,
    deliverable_name VARCHAR(255),
    build_name VARCHAR(255),
    project_name VARCHAR(255),
    wbs_path TEXT,
    pf_start_date DATE,
    pf_end_date DATE,
    pf_baseline_start DATE,
    pf_baseline_end DATE,
    pf_progress_pct INTEGER DEFAULT 0 CHECK (pf_progress_pct BETWEEN 0 AND 100),
    pf_task_initiate CHAR(1) DEFAULT 'N',
    pf_task_initiation_date DATE,
    pf_criteria TEXT,
    pf_checkpoint TEXT,
    last_pf_updated_at TIMESTAMPTZ
);

COMMENT ON TABLE pf_task_meta IS 'ProjectFlow-specific metadata: WBS hierarchy, deliverables, builds, and status';
COMMENT ON COLUMN pf_task_meta.wbs_path IS 'Full WBS path for hierarchy navigation';
COMMENT ON COLUMN pf_task_meta.pf_task_initiate IS 'Initiation status: Y or N';
COMMENT ON COLUMN pf_task_meta.pf_criteria IS 'Acceptance criteria from ProjectFlow';
COMMENT ON COLUMN pf_task_meta.pf_checkpoint IS 'Checkpoint/milestone information';

-- ==============================================================================
-- HABITS TABLE
-- ==============================================================================
-- Recurring habits/routines that can be scheduled
CREATE TABLE habits (
    habit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    category VARCHAR(10) DEFAULT 'work' CHECK (category IN ('work', 'personal')),
    min_duration_mins INTEGER DEFAULT 15,
    max_duration_mins INTEGER DEFAULT 60,
    ideal_time TIME,
    recurrence_rule VARCHAR(255),
    priority VARCHAR(15) DEFAULT 'P3_MEDIUM' CHECK (priority IN ('P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW')),
    calendar_block_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    template_source_id UUID REFERENCES habits ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE habits IS 'Recurring habits and routines, can be templates for reuse across users';
COMMENT ON COLUMN habits.user_id IS 'NULL for template habits, set for user-specific instances';
COMMENT ON COLUMN habits.is_template IS 'true = global template, false = user instance';
COMMENT ON COLUMN habits.recurrence_rule IS 'RFC 5545 recurrence rule (RRULE format)';

-- ==============================================================================
-- SCHEDULING_STATE TABLE
-- ==============================================================================
-- Current scheduling state: maps tasks/habits to calendar time slots
CREATE TABLE scheduling_state (
    state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    task_id UUID REFERENCES tasks ON DELETE CASCADE,
    habit_id UUID REFERENCES habits ON DELETE CASCADE,
    scheduled_slot_start TIMESTAMPTZ NOT NULL,
    scheduled_slot_end TIMESTAMPTZ NOT NULL,
    gcal_event_id VARCHAR(255),
    scheduling_version INTEGER DEFAULT 1,
    is_split BOOLEAN DEFAULT false,
    split_index INTEGER DEFAULT 0,
    block_type VARCHAR(20) DEFAULT 'task' CHECK (block_type IN ('task', 'focus', 'habit')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (task_id IS NOT NULL OR habit_id IS NOT NULL)
);

COMMENT ON TABLE scheduling_state IS 'Current scheduling of tasks and habits to calendar time slots';
COMMENT ON COLUMN scheduling_state.gcal_event_id IS 'Google Calendar event ID for sync';
COMMENT ON COLUMN scheduling_state.scheduling_version IS 'Version counter for optimistic locking';
COMMENT ON COLUMN scheduling_state.is_split IS 'true if this is part of a split task';
COMMENT ON COLUMN scheduling_state.split_index IS 'Index if split (0, 1, 2...)';
COMMENT ON COLUMN scheduling_state.block_type IS 'task=task block, focus=focused work, habit=habit execution';

-- ==============================================================================
-- SYNC_LOG TABLE
-- ==============================================================================
-- Audit trail of all synchronization actions with external systems
CREATE TABLE sync_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('GOOGLE_TASKS', 'PROJECTFLOW', 'GOOGLE_CALENDAR')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    external_id VARCHAR(255),
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGE', 'PROGRESS_UPDATE')),
    old_value_json JSONB,
    new_value_json JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

COMMENT ON TABLE sync_log IS 'Audit trail of all sync operations with external systems';
COMMENT ON COLUMN sync_log.direction IS 'INBOUND = from external to TimeIntel, OUTBOUND = from TimeIntel to external';
COMMENT ON COLUMN sync_log.action IS 'Type of change made';

-- ==============================================================================
-- PF_SYNC_STATE TABLE
-- ==============================================================================
-- Track ProjectFlow synchronization state and polling status
CREATE TABLE pf_sync_state (
    user_id UUID PRIMARY KEY REFERENCES users ON DELETE CASCADE,
    last_poll_at TIMESTAMPTZ,
    last_successful_poll_at TIMESTAMPTZ,
    task_checksum_json JSONB DEFAULT '{}',
    consecutive_error_count INTEGER DEFAULT 0 CHECK (consecutive_error_count >= 0),
    is_syncing BOOLEAN DEFAULT false
);

COMMENT ON TABLE pf_sync_state IS 'ProjectFlow polling state: last poll time, checksums, error tracking';
COMMENT ON COLUMN pf_sync_state.task_checksum_json IS 'Checksums of last synced tasks for change detection';
COMMENT ON COLUMN pf_sync_state.consecutive_error_count IS 'Track consecutive failures for backoff strategy';

-- ==============================================================================
-- CALENDAR_EVENTS_CACHE TABLE
-- ==============================================================================
-- Cached Google Calendar events for quick availability checking
CREATE TABLE calendar_events_cache (
    cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    gcal_event_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    summary VARCHAR(500),
    description TEXT,
    category VARCHAR(20) CHECK (category IN ('one_on_one', 'team_meeting', 'external_meeting', 'personal_event', 'focus', 'habit', 'task_block', 'other')),
    is_ai_managed BOOLEAN DEFAULT false,
    is_all_day BOOLEAN DEFAULT false,
    location TEXT,
    attendees_json JSONB,
    recurrence_rule VARCHAR(255),
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, gcal_event_id)
);

COMMENT ON TABLE calendar_events_cache IS 'Cached Google Calendar events for availability analysis';
COMMENT ON COLUMN calendar_events_cache.category IS 'Event category for intelligent analysis';
COMMENT ON COLUMN calendar_events_cache.is_ai_managed IS 'true = created/managed by TimeIntel AI';
COMMENT ON COLUMN calendar_events_cache.attendees_json IS 'List of attendee objects with emails and response status';

-- ==============================================================================
-- NOTIFICATIONS_LOG TABLE
-- ==============================================================================
-- Log of all notifications sent to users via Slack/Google Chat
CREATE TABLE notifications_log (
    notif_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    source_task_id UUID REFERENCES tasks ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    chat_message_id VARCHAR(255),
    chat_space_id VARCHAR(255),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ
);

COMMENT ON TABLE notifications_log IS 'Log of all notifications sent via Slack/Google Chat';
COMMENT ON COLUMN notifications_log.type IS 'Notification type: overdue, deadline, new_assignment, focus_start, daily_digest, etc.';
COMMENT ON COLUMN notifications_log.chat_message_id IS 'Slack message ID for interaction tracking';
COMMENT ON COLUMN notifications_log.delivered IS 'true when message was successfully delivered';

-- ==============================================================================
-- TEAM_MEMBERS TABLE
-- ==============================================================================
-- Team relationships between managers and team members
CREATE TABLE team_members (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    member_user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    pf_project_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_user_id, member_user_id)
);

COMMENT ON TABLE team_members IS 'Manager-member relationships for team management features';
COMMENT ON COLUMN team_members.pf_project_id IS 'ProjectFlow project ID for team context';

-- ==============================================================================
-- GCAL_WATCH_CHANNELS TABLE
-- ==============================================================================
-- Google Calendar push notification channels for real-time sync
CREATE TABLE gcal_watch_channels (
    channel_id VARCHAR(255) PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users ON DELETE CASCADE,
    resource_id VARCHAR(255),
    expiration TIMESTAMPTZ NOT NULL,
    sync_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE gcal_watch_channels IS 'Google Calendar push notification subscriptions for real-time updates';
COMMENT ON COLUMN gcal_watch_channels.expiration IS 'Channel expiration time (must refresh before this)';
COMMENT ON COLUMN gcal_watch_channels.sync_token IS 'Sync token for incremental calendar changes';

COMMIT;
