# TMC TimeIntel Database Schema

Complete PostgreSQL 15 database schema for TimeIntel - AI-powered work intelligence platform for TallyMarks Consulting.

## Files Overview

### Migration Files (in `migrations/` directory)

#### 001_core_tables.sql (318 lines)
**Core database schema with 12 tables:**
- **users**: User profiles with OAuth (Google) and ProjectFlow integration
- **user_settings**: Per-user configuration (working hours, focus targets, notifications)
- **tasks**: Core task data from Google Tasks and ProjectFlow
- **pf_task_meta**: ProjectFlow-specific metadata and WBS hierarchy
- **habits**: Recurring habits/routines with template support
- **scheduling_state**: Current scheduling of tasks/habits to calendar time
- **sync_log**: Audit trail of all sync operations (INBOUND/OUTBOUND)
- **pf_sync_state**: ProjectFlow polling state and change detection
- **calendar_events_cache**: Cached Google Calendar events for scheduling
- **notifications_log**: Log of all Slack/Google Chat notifications
- **team_members**: Manager-member relationships
- **gcal_watch_channels**: Google Calendar push notification subscriptions

All tables include comprehensive comments and proper constraints.

#### 002_indexes.sql (178 lines)
**Performance indexes across all tables:**
- 32 indexes total covering:
  - Single-column lookups (user_id, status, priority, etc.)
  - Composite indexes for common queries (user_id+status, user_id+time_range)
  - Indexes for time-range queries essential for scheduling
  - Audit trail optimization

#### 003_functions.sql (368 lines)
**Utility functions and triggers:**

**Trigger Functions:**
- `update_updated_at()`: Auto-updates timestamps on INSERT/UPDATE

**Task Management:**
- `calculate_task_priority()`: Smart priority calculation based on due date
- `sync_task_from_external()`: Import/update tasks with change logging
- `mark_task_completed()`: Complete tasks with audit trail

**Scheduling & Availability:**
- `get_user_free_slots()`: Find available time blocks by analyzing calendar + scheduled tasks
- `get_user_daily_focus_time()`: Calculate daily focus time

**Monitoring:**
- `check_sync_errors()`: Check for recent sync failures

#### 004_seed_data.sql (224 lines)
**Default habit templates (7 total):**
- Lunch Break (1:00 PM, 30-60 min, Mon-Fri, P3_MEDIUM)
- Dhuhr Prayer (1:15 PM, 15 min, Daily, P1_CRITICAL)
- Asr Prayer (4:15 PM, 15 min, Daily, P1_CRITICAL)
- Daily Task Review (5:00 PM, 20-30 min, Mon-Fri, P3_MEDIUM)
- Email Triage (9:00 AM, 20-30 min, Mon-Fri, P3_MEDIUM)
- Weekly Planner Review (Mon 9:00 AM, 30-45 min, P3_MEDIUM)
- ProjectFlow Update (4:00 PM, 15-20 min, Mon-Fri, P3_MEDIUM)

### Documentation

#### schema_diagram.md
Visual representation of the database schema including:
- ASCII entity relationship diagrams
- Table relationships and cardinality
- Index strategy and performance tiers
- Constraints and validation rules
- Migration order and dependencies
- Data types and enumerations
- Performance characteristics
- Query patterns and examples
- Storage estimates
- Maintenance tasks

## Quick Start

### Prerequisites
- PostgreSQL 15 or later
- psql command-line tool

### Apply Migrations

```bash
# Connect to your database
psql -U postgres -d timeintel_db

# Run migrations in order (required - they have dependencies)
\i migrations/001_core_tables.sql
\i migrations/002_indexes.sql
\i migrations/003_functions.sql
\i migrations/004_seed_data.sql

# Verify schema
\dt  # List all tables
\df  # List all functions
```

Or with a single connection:

```bash
psql -U postgres -d timeintel_db \
  -f migrations/001_core_tables.sql \
  -f migrations/002_indexes.sql \
  -f migrations/003_functions.sql \
  -f migrations/004_seed_data.sql
```

## Key Features

### Multi-Source Task Management
- Sync tasks from **Google Tasks** and **ProjectFlow**
- Automatic deduplication via UNIQUE(source, external_id, user_id)
- Full audit trail of all sync operations

### Intelligent Scheduling
- Integration with Google Calendar for real-time availability
- Focus time management with configurable defense modes
- Habit templates for quick adoption
- Time-block based scheduling with split support

### ProjectFlow Integration
- Full WBS hierarchy support (pf_task_meta table)
- Baseline tracking (pf_baseline_start/end)
- Build and deliverable context
- Automatic priority calculation based on dates

### User Customization
- Per-user working hours (JSON)
- Configurable focus targets
- Notification preferences
- Meeting/personal time designation
- Timezone support (default: Asia/Karachi)

### Real-Time Sync
- Google Calendar push notifications (Watch API)
- Polling support with error tracking
- Checksum-based change detection
- Consecutive error counting for backoff strategies

## Data Model Highlights

### Priority Calculation
```sql
P1_CRITICAL: Task overdue >2 days
P2_HIGH:     Due within 3 days
P3_MEDIUM:   3-14 days until due
P4_LOW:      >2 weeks or no due date
```

### Task Lifecycle
```
NOT_STARTED → IN_PROGRESS → UNDER_REVIEW → COMPLETED
                         ↘ ON_HOLD
                         ↘ BLOCKED
                         ↘ CANCELLED
```

### Habit Templates
Users can create habit instances by referencing template habits:
- `is_template = true, user_id = NULL`: Global template
- `is_template = false, user_id = <uuid>`: User-specific instance
- `template_source_id`: Link back to source template

## Performance Considerations

### Index Strategy
1. **Tier 1** (Critical): Time-range and status queries
2. **Tier 2** (Common): User task filtering and sync history
3. **Tier 3** (Lookup): OAuth and ProjectFlow lookups

### Write Optimization
- Append-only sync_log for efficient logging
- UNIQUE constraints enable ON CONFLICT semantics
- Denormalized fields (wp_code) avoid joins

### Query Examples
```sql
-- Find user's incomplete tasks
SELECT * FROM tasks 
WHERE user_id = $1 AND status != 'COMPLETED' 
ORDER BY priority DESC, due_date ASC;

-- Get free slots for scheduling
SELECT * FROM get_user_free_slots($user_id, $start_date, $end_date);

-- Audit trail for task
SELECT * FROM sync_log 
WHERE source = 'PROJECTFLOW' AND synced_at > NOW() - INTERVAL '7 days'
ORDER BY synced_at DESC;

-- Team management
SELECT m.member_user_id, u.email FROM team_members m
JOIN users u ON m.member_user_id = u.user_id
WHERE m.manager_user_id = $1;
```

## Constraints & Validation

### Email Domain
All user emails must be @tmcltd.ai domain (enforced via CHECK constraint)

### Referential Integrity
- Cascade deletes: User deletion removes all related records
- Cascading null: Owner of task set to NULL if owner deleted
- Optional foreign keys for metadata relationships

### Data Constraints
- Progress percentage: 0-100
- Consecutive error count: >= 0
- Task and habit must reference either task_id OR habit_id (checked)

## JSON Fields (Flexible Schema)

Several fields use JSONB for flexibility:

```json
// working_hours_json example
{
  "monday": {"start": "09:00", "end": "18:00"},
  "tuesday": {"start": "09:00", "end": "18:00"},
  ...
}

// notifications_config_json example
{
  "overdue": true,
  "deadline": true,
  "new_assignment": true,
  "focus_start": true,
  "daily_digest": true,
  "weekly_digest": true
}

// attendees_json example (calendar events)
[
  {"email": "user@example.com", "response_status": "accepted"},
  {"email": "other@example.com", "response_status": "tentative"}
]
```

## Sync Operations

The schema tracks all synchronization:

```sql
-- Log structure
INSERT INTO sync_log (
  user_id,           -- Who synced
  source,            -- GOOGLE_TASKS | PROJECTFLOW | GOOGLE_CALENDAR
  direction,         -- INBOUND (external→TimeIntel) | OUTBOUND (TimeIntel→external)
  external_id,       -- ID from source system
  action,            -- CREATED | UPDATED | DELETED | STATUS_CHANGE | PROGRESS_UPDATE
  old_value_json,    -- Previous state (for updates)
  new_value_json,    -- New state
  success,           -- true/false
  error_message      -- Error details if failed
)
```

## Troubleshooting

### Duplicate Task Import
If a task appears twice, check `sync_log` for retry attempts. The UNIQUE constraint on (source, external_id, user_id) will prevent duplicates in tasks table.

### Sync Failures
Monitor `pf_sync_state.consecutive_error_count`. When this exceeds threshold, implement exponential backoff.

### Calendar Availability Issues
Ensure `calendar_events_cache` is fresh (check `cached_at`). Stale cache may give incorrect availability.

### Performance Degradation
Check index health:
```sql
SELECT * FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_blks_read DESC;
```

## Maintenance

### Regular Tasks
1. **Weekly**: Vacuum sync_log (append-only growth)
2. **Monthly**: Archive old notifications_log
3. **Quarterly**: Analyze table statistics (`ANALYZE`)
4. **Annually**: Reindex tasks table (high turnover)

### Monitoring Queries
```sql
-- Sync health
SELECT user_id, consecutive_error_count, last_poll_at 
FROM pf_sync_state WHERE consecutive_error_count > 3;

-- Largest tables
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active users
SELECT COUNT(*) FROM users WHERE is_active = true AND onboarding_completed = true;
```

## Future Enhancements

- Add materialized views for reporting
- Implement row-level security (RLS) for multi-tenant concerns
- Consider partitioning sync_log by date
- Add full-text search on task titles/descriptions
- Implement task dependency tracking
- Add calendar integration for team availability
