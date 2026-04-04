-- TMC TimeIntel Functions and Triggers Migration
-- Created: 2026-04-04
-- PostgreSQL 15 compatible
-- Utility functions and trigger functions for data management

BEGIN;

-- ==============================================================================
-- TRIGGER FUNCTION: update_updated_at()
-- ==============================================================================
-- Automatically updates the updated_at timestamp on any row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS 'Trigger function: automatically sets updated_at = NOW() on UPDATE';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==============================================================================
-- FUNCTION: calculate_task_priority()
-- ==============================================================================
-- Calculates task priority based on due date and other factors
-- Returns priority enum value based on deadline proximity
CREATE OR REPLACE FUNCTION calculate_task_priority(
    p_due_date TIMESTAMPTZ,
    p_source VARCHAR,
    p_pf_status_id INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
    v_days_until_due FLOAT;
BEGIN
    -- If no due date, return LOW priority
    IF p_due_date IS NULL THEN
        RETURN 'P4_LOW';
    END IF;

    -- Calculate days remaining
    v_days_until_due := (p_due_date - NOW()) / INTERVAL '1 day';

    -- Priority rules:
    -- Overdue >2 days = P1_CRITICAL
    IF v_days_until_due < -2 THEN
        RETURN 'P1_CRITICAL';
    END IF;

    -- Due within 3 days = P2_HIGH (includes today and overdue < 2 days)
    IF v_days_until_due <= 3 THEN
        RETURN 'P2_HIGH';
    END IF;

    -- More than 2 weeks away = P4_LOW
    IF v_days_until_due > 14 THEN
        RETURN 'P4_LOW';
    END IF;

    -- Default for 3-14 days out = P3_MEDIUM
    RETURN 'P3_MEDIUM';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_task_priority(TIMESTAMPTZ, VARCHAR, INTEGER) IS 
'Calculate task priority based on due date. P1_CRITICAL: >2 days overdue, P2_HIGH: within 3 days, P3_MEDIUM: 3-14 days, P4_LOW: >2 weeks';

-- ==============================================================================
-- FUNCTION: get_user_free_slots()
-- ==============================================================================
-- Returns available time slots for a user within a date range
-- Considers both calendar events and scheduled tasks
CREATE OR REPLACE FUNCTION get_user_free_slots(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE(slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ, duration_mins INTEGER) AS $$
DECLARE
    v_user_timezone VARCHAR;
    v_working_hours JSONB;
    v_current_time TIMESTAMPTZ;
BEGIN
    -- Get user's timezone and working hours
    SELECT timezone, working_hours_json
    INTO v_user_timezone, v_working_hours
    FROM users u
    LEFT JOIN user_settings us ON u.user_id = us.user_id
    WHERE u.user_id = p_user_id;

    IF v_user_timezone IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    -- Build a CTE of all occupied time blocks
    -- This is a complex query that finds gaps between scheduled items
    -- For now, returning a simplified version that finds free periods

    -- Get all blocked time within range (calendar + scheduled tasks)
    -- and return inverse (free) slots

    RETURN QUERY
    WITH occupied_times AS (
        -- Calendar events
        SELECT 
            start_time AS block_start,
            end_time AS block_end
        FROM calendar_events_cache
        WHERE user_id = p_user_id
          AND start_time >= p_start_date
          AND end_time <= p_end_date
        
        UNION ALL
        
        -- Scheduled task/habit blocks
        SELECT 
            scheduled_slot_start AS block_start,
            scheduled_slot_end AS block_end
        FROM scheduling_state
        WHERE user_id = p_user_id
          AND scheduled_slot_start >= p_start_date
          AND scheduled_slot_end <= p_end_date
    ),
    ordered_blocks AS (
        SELECT 
            block_start,
            block_end,
            LAG(block_end) OVER (ORDER BY block_start) AS prev_end
        FROM occupied_times
        ORDER BY block_start
    ),
    gaps AS (
        SELECT 
            CASE WHEN prev_end IS NULL THEN p_start_date ELSE prev_end END AS gap_start,
            block_start AS gap_end
        FROM ordered_blocks
        WHERE prev_end IS NULL OR prev_end < block_start
    )
    SELECT 
        gap_start,
        gap_end,
        EXTRACT(EPOCH FROM (gap_end - gap_start))::INTEGER / 60 AS duration_minutes
    FROM gaps
    WHERE EXTRACT(EPOCH FROM (gap_end - gap_start))::INTEGER / 60 >= 30  -- Min 30 min slots
    ORDER BY gap_start;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_free_slots(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Find free time slots for scheduling. Returns slots >= 30 minutes by finding gaps between calendar events and scheduled tasks.';

-- ==============================================================================
-- FUNCTION: get_user_daily_focus_time()
-- ==============================================================================
-- Calculates total focus time scheduled for a specific date
CREATE OR REPLACE FUNCTION get_user_daily_focus_time(
    p_user_id UUID,
    p_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_focus_mins INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (scheduled_slot_end - scheduled_slot_start))::INTEGER / 60
    ), 0)
    INTO v_focus_mins
    FROM scheduling_state
    WHERE user_id = p_user_id
      AND block_type = 'focus'
      AND DATE(scheduled_slot_start AT TIME ZONE COALESCE(
          (SELECT timezone FROM users WHERE user_id = p_user_id),
          'Asia/Karachi'
      )) = p_date;

    RETURN v_focus_mins;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_daily_focus_time(UUID, DATE) IS 
'Calculate total focus time scheduled for a specific date in minutes';

-- ==============================================================================
-- FUNCTION: sync_task_from_external()
-- ==============================================================================
-- Upserts a task from external source (Google Tasks or ProjectFlow)
-- Handles creation, updates, and sync logging
CREATE OR REPLACE FUNCTION sync_task_from_external(
    p_user_id UUID,
    p_source VARCHAR,
    p_external_id VARCHAR,
    p_title VARCHAR,
    p_status VARCHAR,
    p_due_date TIMESTAMPTZ,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_estimated_duration_mins INTEGER DEFAULT 30,
    p_context_hierarchy TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
    v_old_data JSONB;
    v_new_data JSONB;
    v_action VARCHAR;
BEGIN
    -- Check if task already exists
    SELECT task_id INTO v_task_id
    FROM tasks
    WHERE user_id = p_user_id
      AND source = p_source
      AND external_id = p_external_id;

    v_new_data := jsonb_build_object(
        'title', p_title,
        'status', p_status,
        'due_date', p_due_date,
        'start_date', p_start_date,
        'estimated_duration_mins', p_estimated_duration_mins
    );

    IF v_task_id IS NULL THEN
        -- Create new task
        INSERT INTO tasks (
            user_id, source, external_id, title, status, due_date,
            start_date, estimated_duration_mins, context_hierarchy, notes,
            priority, last_synced_at
        ) VALUES (
            p_user_id, p_source, p_external_id, p_title, p_status, p_due_date,
            p_start_date, p_estimated_duration_mins, p_context_hierarchy, p_notes,
            calculate_task_priority(p_due_date, p_source, NULL), NOW()
        )
        RETURNING task_id INTO v_task_id;

        v_action := 'CREATED';
    ELSE
        -- Update existing task
        SELECT jsonb_build_object(
            'title', title,
            'status', status,
            'due_date', due_date
        ) INTO v_old_data
        FROM tasks WHERE task_id = v_task_id;

        UPDATE tasks
        SET 
            title = p_title,
            status = p_status,
            due_date = p_due_date,
            start_date = COALESCE(p_start_date, start_date),
            estimated_duration_mins = COALESCE(p_estimated_duration_mins, estimated_duration_mins),
            context_hierarchy = COALESCE(p_context_hierarchy, context_hierarchy),
            notes = COALESCE(p_notes, notes),
            priority = calculate_task_priority(p_due_date, p_source, NULL),
            last_synced_at = NOW()
        WHERE task_id = v_task_id;

        v_action := 'UPDATED';
    END IF;

    -- Log the sync operation
    INSERT INTO sync_log (
        user_id, source, direction, external_id, action,
        old_value_json, new_value_json, success
    ) VALUES (
        p_user_id, p_source, 'INBOUND', p_external_id, v_action,
        v_old_data, v_new_data, true
    );

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_task_from_external(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT) IS 
'Sync a task from external source (Google Tasks or ProjectFlow). Creates new or updates existing, logs sync activity.';

-- ==============================================================================
-- FUNCTION: mark_task_completed()
-- ==============================================================================
-- Mark a task as completed and log the sync
CREATE OR REPLACE FUNCTION mark_task_completed(
    p_task_id UUID,
    p_progress_pct INTEGER DEFAULT 100
)
RETURNS VOID AS $$
DECLARE
    v_old_status VARCHAR;
    v_user_id UUID;
BEGIN
    SELECT user_id, status INTO v_user_id, v_old_status
    FROM tasks
    WHERE task_id = p_task_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Task not found: %', p_task_id;
    END IF;

    UPDATE tasks
    SET 
        status = 'COMPLETED',
        progress_pct = p_progress_pct,
        last_synced_at = NOW()
    WHERE task_id = p_task_id;

    -- Log the completion
    INSERT INTO sync_log (
        user_id, source, direction, external_id, action,
        old_value_json, new_value_json, success
    ) VALUES (
        v_user_id, 'GOOGLE_TASKS', 'OUTBOUND', p_task_id, 'STATUS_CHANGE',
        jsonb_build_object('status', v_old_status),
        jsonb_build_object('status', 'COMPLETED', 'progress', p_progress_pct),
        true
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_task_completed(UUID, INTEGER) IS 
'Mark task as completed with optional progress percentage, logs change.';

-- ==============================================================================
-- FUNCTION: check_sync_errors()
-- ==============================================================================
-- Check for recent sync errors for a user
CREATE OR REPLACE FUNCTION check_sync_errors(
    p_user_id UUID,
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(error_count INTEGER, last_error_time TIMESTAMPTZ, error_message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as error_count,
        MAX(synced_at) as last_error_time,
        LAST_VALUE(error_message) OVER (ORDER BY synced_at) as error_message
    FROM sync_log
    WHERE user_id = p_user_id
      AND success = false
      AND synced_at > NOW() - (p_hours_back || ' hours')::INTERVAL
    GROUP BY user_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_sync_errors(UUID, INTEGER) IS 
'Check for recent sync errors, useful for monitoring and alerting.';

COMMIT;
