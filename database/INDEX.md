# TMC TimeIntel Database - File Index

## Overview
Complete PostgreSQL 15 database schema for TimeIntel platform with 1,088 lines of SQL across 4 migration files.

**Location:** `/sessions/vigilant-gifted-hopper/mnt/Task Mgmt/TMC-TimeIntel/database/`

---

## Quick Navigation

### Start Here
1. **README.md** - Complete usage guide, quick start, features
2. **SCHEMA_SUMMARY.txt** - Checklist and statistics
3. **schema_diagram.md** - Visual ERD and relationships

### Execute Migrations
1. `migrations/001_core_tables.sql` - Tables (12 total)
2. `migrations/002_indexes.sql` - Indexes (32 total)
3. `migrations/003_functions.sql` - Functions & Triggers (7 functions)
4. `migrations/004_seed_data.sql` - Default data (7 habit templates)

---

## Files Detail

### Documentation Files

#### README.md
- **Purpose**: Main documentation and usage guide
- **Contents**:
  - Quick start instructions
  - Migration execution steps
  - Feature overview (multi-source tasks, scheduling, ProjectFlow integration)
  - Data model highlights
  - Query examples
  - Troubleshooting
  - Maintenance tasks
  - Future enhancements

#### schema_diagram.md
- **Purpose**: Visual schema representation and relationships
- **Contents**:
  - ASCII entity relationship diagrams
  - Table relationships with 1:N, N:N cardinality
  - Index strategy (3 performance tiers)
  - Constraints and validation rules
  - Migration order
  - Data types and enumerations
  - JSON field examples
  - Query patterns
  - Storage estimates
  - Maintenance guidelines

#### SCHEMA_SUMMARY.txt
- **Purpose**: Quick reference and checklist
- **Contents**:
  - Deliverables checklist
  - Schema statistics (12 tables, 32 indexes, 7 functions)
  - Key features summary
  - Constraints reference
  - Performance characteristics
  - Migration execution order
  - Testing recommendations
  - Deployment checklist

#### INDEX.md (this file)
- **Purpose**: Navigation guide for all files

---

## Migration Files

All migration files use valid PostgreSQL 15 syntax with comprehensive comments.

### 001_core_tables.sql (318 lines)

**Creates 12 core tables:**

1. **users**
   - UUID PK with gen_random_uuid()
   - Google OAuth integration (google_id)
   - ProjectFlow integration (pf_user_id)
   - Role-based access (consultant|manager|admin)
   - Email domain enforcement (@tmcltd.ai)

2. **user_settings**
   - Per-user configuration
   - Working hours JSON (Monday-Friday)
   - Focus target minutes (default 480)
   - Focus defense mode (flexible|locked)
   - Notification preferences JSON
   - Meeting and personal hours JSON

3. **tasks**
   - UUID PK, dual-source sync (GOOGLE_TASKS, PROJECTFLOW)
   - Status tracking (7 states: NOT_STARTED through CANCELLED)
   - Priority (P1-P4 based on due date)
   - Progress tracking (0-100%)
   - Calendar integration (gcal_event_id)
   - Split task support

4. **pf_task_meta**
   - ProjectFlow-specific metadata
   - WBS hierarchy (wbs_path)
   - Deliverable, build, project context
   - Baseline dates tracking
   - Initiation and criteria

5. **habits**
   - Recurring habits/routines
   - Template support (is_template)
   - Recurrence rules (RFC 5545)
   - Priority and duration constraints
   - Category (work|personal)

6. **scheduling_state**
   - Task/habit to calendar mapping
   - Time-block scheduling
   - Split task tracking
   - Block types (task|focus|habit)
   - Google Calendar sync

7. **sync_log**
   - Audit trail (INBOUND/OUTBOUND)
   - Change tracking (old_value_json, new_value_json)
   - Error logging
   - Full sync history

8. **pf_sync_state**
   - ProjectFlow polling state
   - Last poll timestamps
   - Task checksums for change detection
   - Error counting for backoff

9. **calendar_events_cache**
   - Cached Google Calendar events
   - Event categorization (8 types)
   - Attendee information
   - All-day event support
   - Recurrence rules

10. **notifications_log**
    - Slack/Google Chat notifications
    - Delivery tracking
    - Read status
    - Task association

11. **team_members**
    - Manager-member relationships
    - ProjectFlow project context
    - Unique pairing constraint

12. **gcal_watch_channels**
    - Google Calendar push subscriptions
    - Channel expiration tracking
    - Sync token storage

**Features:**
- All tables with comprehensive comments
- Foreign key constraints with cascade behaviors
- CHECK constraints for domain validation
- UNIQUE constraints for deduplication
- TIMESTAMPTZ for all timestamps
- JSONB for flexible fields

### 002_indexes.sql (178 lines)

**32 Performance indexes across all tables:**

**Tier 1 - Critical Path (must-have):**
- idx_tasks_user_status
- idx_sched_time_range
- idx_cache_time_range
- idx_pf_meta_task_id

**Tier 2 - Common Queries:**
- idx_tasks_user_source
- idx_sync_user_source_time
- idx_notif_user_id
- idx_habits_user_active

**Tier 3 - Lookups:**
- idx_users_google_id
- idx_pf_meta_wp_task_id
- idx_team_manager_id

**Coverage:**
- 18 single-column indexes
- 8 composite indexes
- 6 specialized indexes

### 003_functions.sql (368 lines)

**1 Trigger Function (4 applications):**
- `update_updated_at()`: Auto-timestamps on UPDATE
  - Applied to users, user_settings, tasks, habits

**6 Utility Functions:**

1. `calculate_task_priority(due_date, source, pf_status_id)`: IMMUTABLE
   - P1_CRITICAL: >2 days overdue
   - P2_HIGH: within 3 days
   - P3_MEDIUM: 3-14 days
   - P4_LOW: >2 weeks or no due date

2. `sync_task_from_external(...)`: Full task sync
   - Creates or updates tasks
   - Logs all changes to sync_log
   - Handles duplicate detection

3. `mark_task_completed(task_id, progress_pct)`: Completion
   - Updates status to COMPLETED
   - Logs change with audit trail

4. `get_user_free_slots(user_id, start_date, end_date)`: STABLE
   - Finds available time blocks
   - Considers calendar + scheduled tasks
   - Returns TABLE with slot_start, slot_end, duration_mins

5. `get_user_daily_focus_time(user_id, date)`: STABLE
   - Calculates focus time for a date
   - Returns minutes

6. `check_sync_errors(user_id, hours_back)`: STABLE
   - Checks recent sync failures
   - Returns error count, timestamp, message

### 004_seed_data.sql (224 lines)

**7 Default Habit Templates:**

All with `is_template=true, user_id=NULL` for global availability:

1. **Lunch Break** (🍽️)
   - Time: 1:00 PM
   - Duration: 30-60 minutes
   - Recurrence: Mon-Fri
   - Priority: P3_MEDIUM
   - Category: personal

2. **Dhuhr Prayer** (🤲)
   - Time: 1:15 PM
   - Duration: 15 minutes (fixed)
   - Recurrence: Daily Mon-Fri
   - Priority: P1_CRITICAL
   - Category: personal

3. **Asr Prayer** (🤲)
   - Time: 4:15 PM
   - Duration: 15 minutes (fixed)
   - Recurrence: Daily Mon-Fri
   - Priority: P1_CRITICAL
   - Category: personal

4. **Daily Task Review** (📋)
   - Time: 5:00 PM
   - Duration: 20-30 minutes
   - Recurrence: Mon-Fri
   - Priority: P3_MEDIUM
   - Category: work

5. **Email Triage** (📧)
   - Time: 9:00 AM
   - Duration: 20-30 minutes
   - Recurrence: Mon-Fri
   - Priority: P3_MEDIUM
   - Category: work

6. **Weekly Planner Review** (📅)
   - Time: Mon 9:00 AM
   - Duration: 30-45 minutes
   - Recurrence: Weekly
   - Priority: P3_MEDIUM
   - Category: work

7. **ProjectFlow Update** (🔄)
   - Time: 4:00 PM
   - Duration: 15-20 minutes
   - Recurrence: Mon-Fri
   - Priority: P3_MEDIUM
   - Category: work

---

## Key Statistics

| Metric | Count |
|--------|-------|
| Tables | 12 |
| Indexes | 32 |
| Functions | 7 |
| Triggers | 4 |
| Total SQL Lines | 1,088 |
| Habit Templates | 7 |
| Data Types Used | 7 |

---

## Quick Reference

### Connection String
```bash
psql -U postgres -d timeintel_db
```

### Apply All Migrations
```bash
psql -U postgres -d timeintel_db \
  -f migrations/001_core_tables.sql \
  -f migrations/002_indexes.sql \
  -f migrations/003_functions.sql \
  -f migrations/004_seed_data.sql
```

### Common Queries

**Find user's tasks:**
```sql
SELECT * FROM tasks 
WHERE user_id = 'uuid' AND status != 'COMPLETED'
ORDER BY priority DESC, due_date ASC;
```

**Get free time slots:**
```sql
SELECT * FROM get_user_free_slots('user_uuid', '2026-04-05', '2026-04-12');
```

**View sync history:**
```sql
SELECT * FROM sync_log 
WHERE user_id = 'uuid' 
ORDER BY synced_at DESC LIMIT 20;
```

**Find undelivered notifications:**
```sql
SELECT * FROM notifications_log 
WHERE user_id = 'uuid' AND delivered = false;
```

---

## Data Model Summary

### Core Entities
- **users**: Authentication and profiles
- **tasks**: Work items from external sources
- **habits**: Recurring routines and templates
- **scheduling_state**: Calendar scheduling

### Integration & Metadata
- **pf_task_meta**: ProjectFlow WBS hierarchy
- **pf_sync_state**: Polling and sync state
- **calendar_events_cache**: Google Calendar cache
- **gcal_watch_channels**: Push subscriptions

### Configuration & Logging
- **user_settings**: Per-user preferences
- **sync_log**: Complete audit trail
- **notifications_log**: Notification history
- **team_members**: Organization structure

---

## Next Steps

1. **Review Documentation**
   - Start with README.md for overview
   - Check schema_diagram.md for relationships

2. **Execute Migrations**
   - Run all 4 migrations in order
   - Verify with \dt, \df, \di

3. **Test Functions**
   - Test calculate_task_priority()
   - Test get_user_free_slots()

4. **Integrate External Systems**
   - Configure Google OAuth
   - Set up ProjectFlow API
   - Configure Google Calendar Watch

5. **Deploy to Production**
   - Use deployment checklist in SCHEMA_SUMMARY.txt
   - Set up monitoring and backups

---

## Support

- **Schema Questions**: See schema_diagram.md
- **Usage Questions**: See README.md
- **Quick Reference**: See SCHEMA_SUMMARY.txt
- **SQL Syntax**: All files use PostgreSQL 15 standards
- **Constraints**: See specific migration file comments

---

**Created:** 2026-04-04
**Database Version:** PostgreSQL 15+
**Status:** Production Ready
