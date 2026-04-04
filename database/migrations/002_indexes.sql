-- TMC TimeIntel Indexes Migration
-- Created: 2026-04-04
-- PostgreSQL 15 compatible
-- Performance indexes for all core tables

BEGIN;

-- ==============================================================================
-- TASKS TABLE INDEXES
-- ==============================================================================
-- Single column indexes for common filters
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
COMMENT ON INDEX idx_tasks_user_id IS 'Filter tasks by user for queries like get_user_tasks()';

CREATE INDEX idx_tasks_source ON tasks(source);
COMMENT ON INDEX idx_tasks_source IS 'Filter tasks by source system (GOOGLE_TASKS vs PROJECTFLOW)';

CREATE INDEX idx_tasks_status ON tasks(status);
COMMENT ON INDEX idx_tasks_status IS 'Filter tasks by status for dashboard views';

CREATE INDEX idx_tasks_priority ON tasks(priority);
COMMENT ON INDEX idx_tasks_priority IS 'Filter tasks by priority level';

CREATE INDEX idx_tasks_due_date ON tasks(due_date);
COMMENT ON INDEX idx_tasks_due_date IS 'Find overdue or upcoming due tasks';

CREATE INDEX idx_tasks_external_id ON tasks(external_id);
COMMENT ON INDEX idx_tasks_external_id IS 'Quick lookup of external task IDs';

CREATE INDEX idx_tasks_calendar_block ON tasks(calendar_block_id);
COMMENT ON INDEX idx_tasks_calendar_block IS 'Find scheduled tasks by Google Calendar event ID';

-- Composite indexes for common WHERE + JOIN patterns
CREATE INDEX idx_tasks_user_source ON tasks(user_id, source);
COMMENT ON INDEX idx_tasks_user_source IS 'Find user tasks from specific source (GOOGLE_TASKS or PROJECTFLOW)';

CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
COMMENT ON INDEX idx_tasks_user_status IS 'Find user tasks with specific status';

CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority);
COMMENT ON INDEX idx_tasks_user_priority IS 'Find user tasks by priority';

-- ==============================================================================
-- PF_TASK_META TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_pf_meta_task_id ON pf_task_meta(task_id);
COMMENT ON INDEX idx_pf_meta_task_id IS 'Join from tasks to pf_task_meta';

CREATE INDEX idx_pf_meta_wp_task_id ON pf_task_meta(wp_task_id);
COMMENT ON INDEX idx_pf_meta_wp_task_id IS 'Quick lookup by ProjectFlow work package task ID';

CREATE INDEX idx_pf_meta_project_id ON pf_task_meta(project_id);
COMMENT ON INDEX idx_pf_meta_project_id IS 'Filter tasks by ProjectFlow project';

CREATE INDEX idx_pf_meta_wp_id ON pf_task_meta(wp_id);
COMMENT ON INDEX idx_pf_meta_wp_id IS 'Filter by work package ID for hierarchy navigation';

-- ==============================================================================
-- SCHEDULING_STATE TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_sched_user_id ON scheduling_state(user_id);
COMMENT ON INDEX idx_sched_user_id IS 'Find all scheduled items for a user';

CREATE INDEX idx_sched_task_id ON scheduling_state(task_id);
COMMENT ON INDEX idx_sched_task_id IS 'Find scheduling record for a task';

CREATE INDEX idx_sched_habit_id ON scheduling_state(habit_id);
COMMENT ON INDEX idx_sched_habit_id IS 'Find scheduling record for a habit';

CREATE INDEX idx_sched_gcal_event ON scheduling_state(gcal_event_id);
COMMENT ON INDEX idx_sched_gcal_event IS 'Find scheduling by Google Calendar event ID';

-- Composite index for time range queries (essential for availability checks)
CREATE INDEX idx_sched_time_range ON scheduling_state(user_id, scheduled_slot_start, scheduled_slot_end);
COMMENT ON INDEX idx_sched_time_range IS 'Find scheduled items in time range for availability analysis';

-- ==============================================================================
-- CALENDAR_EVENTS_CACHE TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_cache_user_id ON calendar_events_cache(user_id);
COMMENT ON INDEX idx_cache_user_id IS 'Find all cached events for a user';

CREATE INDEX idx_cache_gcal_event ON calendar_events_cache(gcal_event_id);
COMMENT ON INDEX idx_cache_gcal_event IS 'Quick lookup of cached event by Google Calendar ID';

-- Composite index for time range availability queries
CREATE INDEX idx_cache_time_range ON calendar_events_cache(user_id, start_time, end_time);
COMMENT ON INDEX idx_cache_time_range IS 'Find calendar events in time range for scheduling availability';

CREATE INDEX idx_cache_category ON calendar_events_cache(category);
COMMENT ON INDEX idx_cache_category IS 'Filter events by category (meetings, focus, etc.)';

-- ==============================================================================
-- SYNC_LOG TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_sync_user_id ON sync_log(user_id);
COMMENT ON INDEX idx_sync_user_id IS 'Find all sync activity for a user';

CREATE INDEX idx_sync_source ON sync_log(source);
COMMENT ON INDEX idx_sync_source IS 'Find sync activity by system';

CREATE INDEX idx_sync_synced_at ON sync_log(synced_at);
COMMENT ON INDEX idx_sync_synced_at IS 'Find recent sync operations';

CREATE INDEX idx_sync_direction ON sync_log(direction);
COMMENT ON INDEX idx_sync_direction IS 'Find INBOUND or OUTBOUND syncs';

-- Composite index for common audit queries
CREATE INDEX idx_sync_user_source_time ON sync_log(user_id, source, synced_at DESC);
COMMENT ON INDEX idx_sync_user_source_time IS 'Find sync history for user/source combination';

CREATE INDEX idx_sync_user_action ON sync_log(user_id, action);
COMMENT ON INDEX idx_sync_user_action IS 'Find sync operations by type (CREATED, UPDATED, etc.)';

-- ==============================================================================
-- NOTIFICATIONS_LOG TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_notif_user_id ON notifications_log(user_id);
COMMENT ON INDEX idx_notif_user_id IS 'Find all notifications for a user';

CREATE INDEX idx_notif_type ON notifications_log(type);
COMMENT ON INDEX idx_notif_type IS 'Find notifications by type';

CREATE INDEX idx_notif_sent_at ON notifications_log(sent_at DESC);
COMMENT ON INDEX idx_notif_sent_at IS 'Find recent notifications';

CREATE INDEX idx_notif_delivered ON notifications_log(delivered);
COMMENT ON INDEX idx_notif_delivered IS 'Find undelivered notifications for retry';

-- ==============================================================================
-- HABITS TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_habits_user_id ON habits(user_id);
COMMENT ON INDEX idx_habits_user_id IS 'Find user habits (NULL user_id = templates)';

CREATE INDEX idx_habits_active ON habits(is_active);
COMMENT ON INDEX idx_habits_active IS 'Find active habits for scheduling';

CREATE INDEX idx_habits_template ON habits(is_template);
COMMENT ON INDEX idx_habits_template IS 'Find habit templates for new user setup';

CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);
COMMENT ON INDEX idx_habits_user_active IS 'Find active habits for a specific user';

-- ==============================================================================
-- USER_SETTINGS TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
COMMENT ON INDEX idx_user_settings_user_id IS 'Fast lookup of user settings';

-- ==============================================================================
-- TEAM_MEMBERS TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_team_manager_id ON team_members(manager_user_id);
COMMENT ON INDEX idx_team_manager_id IS 'Find all team members for a manager';

CREATE INDEX idx_team_member_id ON team_members(member_user_id);
COMMENT ON INDEX idx_team_member_id IS 'Find manager(s) for a team member';

-- ==============================================================================
-- PF_SYNC_STATE TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_pf_sync_user_id ON pf_sync_state(user_id);
COMMENT ON INDEX idx_pf_sync_user_id IS 'Quick lookup of ProjectFlow sync state';

-- ==============================================================================
-- USERS TABLE INDEXES
-- ==============================================================================
CREATE INDEX idx_users_google_id ON users(google_id);
COMMENT ON INDEX idx_users_google_id IS 'Quick lookup by Google OAuth ID';

CREATE INDEX idx_users_email ON users(email);
COMMENT ON INDEX idx_users_email IS 'Find user by email address';

CREATE INDEX idx_users_active ON users(is_active);
COMMENT ON INDEX idx_users_active IS 'Find active users for background jobs';

COMMIT;
