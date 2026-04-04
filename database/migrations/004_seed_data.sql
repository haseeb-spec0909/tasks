-- TMC TimeIntel Seed Data Migration
-- Created: 2026-04-04
-- PostgreSQL 15 compatible
-- Default habit templates and initial data

BEGIN;

-- ==============================================================================
-- DEFAULT HABIT TEMPLATES
-- ==============================================================================
-- These are global templates (is_template=true, user_id=NULL)
-- Users can create instances by cloning these templates

-- Lunch Break: 1:00 PM - 1:30/1:00 PM daily Mon-Fri
INSERT INTO habits (
    user_id,
    title,
    emoji,
    category,
    min_duration_mins,
    max_duration_mins,
    ideal_time,
    recurrence_rule,
    priority,
    is_template,
    is_active,
    created_at
) VALUES (
    NULL,
    'Lunch Break',
    '🍽️',
    'personal',
    30,
    60,
    '13:00'::TIME,
    'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    'P3_MEDIUM',
    true,
    true,
    NOW()
);

-- Dhuhr Prayer: 1:15 PM, 15 minutes, Critical, Daily Mon-Fri
INSERT INTO habits (
    user_id,
    title,
    emoji,
    category,
    min_duration_mins,
    max_duration_mins,
    ideal_time,
    recurrence_rule,
    priority,
    is_template,
    is_active,
    created_at
) VALUES (
    NULL,
    'Dhuhr Prayer',
    '🤲',
    'personal',
    15,
    15,
    '13:15'::TIME,
    'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    'P1_CRITICAL',
    true,
    true,
    NOW()
);

-- Asr Prayer: 4:15 PM, 15 minutes, Critical, Daily Mon-Fri
INSERT INTO habits (
    user_id,
    title,
    emoji,
    category,
    min_duration_mins,
    max_duration_mins,
    ideal_time,
    recurrence_rule,
    priority,
    is_template,
    is_active,
    created_at
) VALUES (
    NULL,
    'Asr Prayer',
    '🤲',
    'personal',
    15,
    15,
    '16:15'::TIME,
    'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    'P1_CRITICAL',
    true,
    true,
    NOW()
);

-- Daily Task Review: 5:00 PM, 20-30 minutes, Medium, Daily Mon-Fri
INSERT INTO habits (
    user_id,
    title,
    emoji,
    category,
    min_duration_mins,
    max_duration_mins,
    ideal_time,
    recurrence_rule,
    priority,
    is_template,
    is_active,
    created_at
) VALUES (
    NULL,
    'Daily Task Review',
    '📋',
    'work',
    20,
    30,
    '17:00'::TIME,
    'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    'P3_MEDIUM',
    true,
    true,
    NOW()
);

-- Email Triage: 9:00 AM, 20-30 minutes, Medium, Daily Mon-Fri
INSERT INTO habits (
    user_id,
    title,
    emoji,
    category,
    min_duration_mins,
    max_duration_mins,
    ideal_time,
    recurrence_rule,
    priority,
    is_template,
    is_active,
    created_at
) VALUES (
    NULL,
    'Email Triage',
    '📧',
    'work',
    20,
    30,
    '09:00'::TIME,
    'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    'P3_MEDIUM',
    true,
    true,
    NOW()
);

-- Weekly Planner Review: Monday 9:00 AM, 30-45 minutes, Medium
INSERT INTO habits (
    user_id,
    title,
    emoji,
    category,
    min_duration_mins,
    max_duration_mins,
    ideal_time,
    recurrence_rule,
    priority,
    is_template,
    is_active,
    created_at
) VALUES (
    NULL,
    'Weekly Planner Review',
    '📅',
    'work',
    30,
    45,
    '09:00'::TIME,
    'FREQ=WEEKLY;BYDAY=MO',
    'P3_MEDIUM',
    true,
    true,
    NOW()
);

-- ProjectFlow Update: 4:00 PM, 15-20 minutes, Medium, Daily Mon-Fri
INSERT INTO habits (
    user_id,
    title,
    emoji,
    category,
    min_duration_mins,
    max_duration_mins,
    ideal_time,
    recurrence_rule,
    priority,
    is_template,
    is_active,
    created_at
) VALUES (
    NULL,
    'ProjectFlow Update',
    '🔄',
    'work',
    15,
    20,
    '16:00'::TIME,
    'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    'P3_MEDIUM',
    true,
    true,
    NOW()
);

-- ==============================================================================
-- VERIFICATION COMMENTS
-- ==============================================================================
-- Total template habits created: 7
-- These templates are available globally and users can create instances
-- by specifying template_source_id when they want to adopt a habit

COMMIT;
