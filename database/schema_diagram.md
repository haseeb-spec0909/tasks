# TMC TimeIntel Database Schema

## Entity Relationship Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  USERS (Core)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  user_id UUID                                                            │
│     google_id VARCHAR(255) UNIQUE                                           │
│     email VARCHAR(255) UNIQUE (@tmcltd.ai)                                  │
│     display_name VARCHAR(255)                                               │
│     avatar_url TEXT                                                         │
│     pf_user_id INTEGER UNIQUE (ProjectFlow integration)                     │
│     role VARCHAR(20): consultant|manager|admin                              │
│     timezone VARCHAR(50)                                                    │
│     is_active BOOLEAN                                                       │
│     onboarding_completed BOOLEAN                                            │
│     created_at, updated_at TIMESTAMPTZ                                      │
└─────────────────────────────────────────────────────────────────────────────┘
         │                  │                          │                    │
         │ 1:1              │ 1:1                      │ 1:N               │ 1:N
         ▼                  ▼                          ▼                   ▼
    ┌──────────────┐  ┌──────────────┐      ┌──────────────────┐  ┌─────────────┐
    │USER_SETTINGS│  │ PF_SYNC_STATE│      │     TASKS        │  │   HABITS    │
    ├──────────────┤  ├──────────────┤      ├──────────────────┤  ├─────────────┤
    │setting_id PK│  │user_id PK FK │      │task_id PK        │  │habit_id PK  │
    │user_id FK   │  │last_poll_at  │      │user_id FK        │  │user_id FK   │
    │working_hours│  │last_succ_poll│      │source: GOOGLE../ │  │title        │
    │focus_target │  │task_checksum │      │PROJECTFLOW       │  │emoji        │
    │focus_defense│  │error_count   │      │external_id       │  │category     │
    │scheduling.. │  │is_syncing    │      │title             │  │duration_min │
    │default_dur..│  │              │      │status            │  │ideal_time   │
    │min_focus... │  │              │      │priority          │  │recurrence   │
    │ideal_focus. │  │              │      │due_date          │  │priority     │
    │notif_config│  │              │      │estimated_dur     │  │is_active    │
    │meeting_hrs  │  │              │      │progress_pct      │  │is_template  │
    │personal_hrs │  │              │      │calendar_block_id │  │template_src │
    └──────────────┘  └──────────────┘      │created_at        │  └─────────────┘
                                             └──────────────────┘         │
                                                     │                    │ N:1
                                                     │ 1:1              (habits can
                                            UNIQUE(source,              reference
                                            external_id,                other habits
                                            user_id)                    as templates)
                                                     │
                                                     ▼
                                          ┌──────────────────────┐
                                          │   PF_TASK_META       │
                                          ├──────────────────────┤
                                          │pf_meta_id PK         │
                                          │task_id FK (UNIQUE)   │
                                          │wp_task_id            │
                                          │wp_id, deliverable_id │
                                          │build_id, project_id  │
                                          │wbs_path              │
                                          │pf_start_date         │
                                          │pf_baseline_start/end │
                                          │pf_criteria           │
                                          │pf_checkpoint         │
                                          │last_pf_updated_at    │
                                          └──────────────────────┘
```

## Many-to-Many and Supporting Tables

```
┌──────────────────────────────┐        ┌─────────────────────────┐
│     SCHEDULING_STATE         │        │ CALENDAR_EVENTS_CACHE   │
├──────────────────────────────┤        ├─────────────────────────┤
│state_id PK                   │        │cache_id PK              │
│user_id FK                    │        │user_id FK               │
│task_id FK (optional)         │        │gcal_event_id UNIQUE     │
│habit_id FK (optional)        │        │start_time TIMESTAMPTZ   │
│scheduled_slot_start          │        │end_time TIMESTAMPTZ     │
│scheduled_slot_end            │        │summary VARCHAR(500)     │
│gcal_event_id VARCHAR(255)    │        │category: one_on_one,    │
│scheduling_version            │        │team_meeting, external.. │
│is_split BOOLEAN              │        │is_ai_managed BOOLEAN    │
│split_index INTEGER           │        │is_all_day BOOLEAN       │
│block_type: task|focus|habit  │        │location TEXT            │
│CHECK (task_id OR habit_id)   │        │attendees_json JSONB     │
│created_at TIMESTAMPTZ        │        │recurrence_rule          │
└──────────────────────────────┘        │cached_at TIMESTAMPTZ    │
         │                              └─────────────────────────┘
         │ Maps tasks/habits to calendar time
         │ (real scheduling state)
         ▼
    ┌──────────────┐
    │   SYNC_LOG   │
    ├──────────────┤
    │log_id PK     │
    │user_id FK    │
    │source: GOOGLE│
    │TASKS/PROJECT │
    │FLOW/CALENDAR │
    │direction:    │
    │INBOUND|      │
    │OUTBOUND      │
    │external_id   │
    │action: CREAT │
    │ED|UPDATED|.. │
    │old_value_jsn │
    │new_value_jsn │
    │synced_at     │
    │success BOOL  │
    │error_message │
    └──────────────┘
```

## Audit & Notification Tables

```
┌────────────────────────────┐      ┌──────────────────────┐
│   NOTIFICATIONS_LOG        │      │  TEAM_MEMBERS        │
├────────────────────────────┤      ├──────────────────────┤
│notif_id PK                 │      │team_id PK            │
│user_id FK                  │      │manager_user_id FK    │
│type VARCHAR(30)            │      │member_user_id FK     │
│source_task_id FK           │      │pf_project_id         │
│message_text TEXT           │      │created_at            │
│chat_message_id VARCHAR     │      │UNIQUE(manager_id,    │
│chat_space_id VARCHAR       │      │member_id)            │
│sent_at TIMESTAMPTZ         │      └──────────────────────┘
│delivered BOOLEAN           │
│read_at TIMESTAMPTZ         │
└────────────────────────────┘

┌──────────────────────────────┐
│  GCAL_WATCH_CHANNELS         │
├──────────────────────────────┤
│channel_id VARCHAR(255) PK    │
│user_id FK UNIQUE             │
│resource_id VARCHAR(255)      │
│expiration TIMESTAMPTZ        │
│sync_token TEXT               │
│created_at TIMESTAMPTZ        │
└──────────────────────────────┘
```

## Key Relationships

### Core Task Flow
1. **users** → **tasks**: One user has many tasks
2. **tasks** → **pf_task_meta**: One task has optional ProjectFlow metadata
3. **tasks** ↔ **scheduling_state**: Tasks are scheduled via scheduling_state
4. **tasks** → **sync_log**: All task changes are audited

### Scheduling & Availability
1. **users** → **user_settings**: User-specific configuration
2. **users** → **scheduling_state**: Current schedule state
3. **users** → **calendar_events_cache**: Cached calendar for availability
4. **scheduling_state** ↔ **calendar_events_cache**: Scheduling considers calendar

### Habits & Routines
1. **users** → **habits**: User-specific habit instances
2. **habits** → **habits**: Template inheritance (is_template=true, user_id=NULL)
3. **habits** → **scheduling_state**: Habits are scheduled like tasks

### Integrations & Sync
1. **users** → **pf_sync_state**: ProjectFlow polling state
2. **users** → **gcal_watch_channels**: Google Calendar push subscriptions
3. **users** → **sync_log**: Complete audit trail of all sync operations
4. **users** → **team_members**: Manager-member relationships

### Notifications
1. **users** → **notifications_log**: Notification history
2. **tasks** → **notifications_log**: Task-related notifications

## Indexes Strategy

### Performance Tier 1 (Critical Path)
- **tasks(user_id, status)**: Dashboard queries
- **tasks(user_id, due_date)**: Overdue/upcoming queries
- **scheduling_state(user_id, scheduled_slot_start, scheduled_slot_end)**: Availability checks
- **calendar_events_cache(user_id, start_time, end_time)**: Scheduling algorithm

### Performance Tier 2 (Common Queries)
- **tasks(source, external_id)**: Sync deduplication
- **sync_log(user_id, source, synced_at)**: Audit history
- **notifications_log(user_id, sent_at)**: Recent notifications
- **habits(user_id, is_active)**: Active habits for scheduling

### Performance Tier 3 (Lookup)
- **users(google_id)**: OAuth lookup
- **pf_task_meta(wp_task_id)**: ProjectFlow sync
- **team_members(manager_user_id)**: Team management

## Constraints & Validation

### Domain Constraints
- `email` LIKE '%@tmcltd.ai': Enforce TMC domain
- `role` IN ('consultant', 'manager', 'admin'): Role validation
- `status` IN ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'ON_HOLD', 'COMPLETED', 'BLOCKED', 'CANCELLED'): Valid statuses
- `priority` IN ('P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW'): Priority levels

### Data Integrity
- `users.created_at, users.updated_at`: Auto-managed by triggers
- `scheduling_state.CHECK (task_id IS NOT NULL OR habit_id IS NOT NULL)`: Must reference task or habit
- `tasks.UNIQUE(source, external_id, user_id)`: No duplicate external imports
- `calendar_events_cache.UNIQUE(user_id, gcal_event_id)`: No duplicate cache entries

### Cascade Behavior
- User deletion cascades to: user_settings, tasks, scheduling_state, sync_log, pf_sync_state, calendar_events_cache, notifications_log, team_members, gcal_watch_channels
- Task deletion cascades to: pf_task_meta, scheduling_state, notifications_log
- Habit deletion cascades to: scheduling_state

## Migration Order

1. **001_core_tables.sql**: Create all base tables (order: users → user_settings, tasks, habits, scheduling_state, sync_log, pf_task_meta, pf_sync_state, calendar_events_cache, notifications_log, team_members, gcal_watch_channels)

2. **002_indexes.sql**: Create all performance indexes

3. **003_functions.sql**: Create trigger functions and utility functions

4. **004_seed_data.sql**: Populate template habits

## Function Library

### Trigger Functions
- `update_updated_at()`: Auto-update timestamps on INSERT/UPDATE

### Task Management
- `calculate_task_priority(due_date, source, pf_status_id)`: Smart priority calculation
- `sync_task_from_external(...)`: Import/update tasks from external systems
- `mark_task_completed(task_id, progress_pct)`: Complete tasks with logging

### Scheduling & Availability
- `get_user_free_slots(user_id, start_date, end_date)`: Find available time blocks
- `get_user_daily_focus_time(user_id, date)`: Calculate daily focus time

### Monitoring
- `check_sync_errors(user_id, hours_back)`: Check for recent sync failures

## Data Types & Enums

### Enumerations (Implemented as VARCHAR CHECK)
- **role**: 'consultant' | 'manager' | 'admin'
- **task_status**: 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'ON_HOLD' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED'
- **priority**: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW'
- **source**: 'GOOGLE_TASKS' | 'PROJECTFLOW' | 'GOOGLE_CALENDAR'
- **sync_direction**: 'INBOUND' | 'OUTBOUND'
- **sync_action**: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGE' | 'PROGRESS_UPDATE'
- **focus_defense_mode**: 'flexible' | 'locked'
- **task_type**: 'work' | 'personal'
- **category**: 'work' | 'personal' (for habits)
- **event_category**: 'one_on_one' | 'team_meeting' | 'external_meeting' | 'personal_event' | 'focus' | 'habit' | 'task_block' | 'other'
- **block_type**: 'task' | 'focus' | 'habit'

### JSON Fields (Flexible, Schema-less)
- `user_settings.working_hours_json`: Weekly working hours by day
- `user_settings.notifications_config_json`: Notification preferences
- `user_settings.meeting_hours_json`: Meeting time preferences
- `user_settings.personal_hours_json`: Personal time preferences
- `pf_sync_state.task_checksum_json`: Checksums for change detection
- `calendar_events_cache.attendees_json`: Attendee list with responses
- `sync_log.old_value_json`: Previous values (audit)
- `sync_log.new_value_json`: New values (audit)

## Performance Characteristics

### Write Optimization
- **Sync operations**: Log all changes via `sync_log` table (append-only benefits)
- **Batch updates**: Use `UNIQUE` constraints to support ON CONFLICT semantics
- **Denormalization**: Store `wp_code`, `pf_status_id` in `tasks` for faster queries

### Read Optimization
- **Composite indexes**: Cover time-range queries for scheduling
- **Partial indexes**: Could add for active/archived status filtering
- **Materialized views**: Consider for complex reporting (not implemented in base schema)

### Query Patterns
- **Find user tasks**: SELECT * FROM tasks WHERE user_id = ? AND status = ?
- **Find free slots**: Use `get_user_free_slots()` function
- **Sync history**: SELECT * FROM sync_log WHERE user_id = ? AND source = ? ORDER BY synced_at DESC
- **Team visibility**: JOIN users → team_members → member tasks

## Storage Estimates (sample)

Assuming 500 users, 1 year of operations:

- **users**: 500 rows × 300 bytes ≈ 150 KB
- **tasks**: ~50 tasks/user × 500 users × 500 bytes ≈ 12.5 MB
- **scheduling_state**: ~100 blocks/user × 500 × 200 bytes ≈ 10 MB
- **calendar_events_cache**: ~20 events/user × 500 × 400 bytes ≈ 4 MB
- **sync_log**: ~10 syncs/user/day × 365 × 500 × 500 bytes ≈ 875 MB
- **Total**: ~1.9 GB (before indexes)

With indexes and JSONB compression, likely 3-4 GB total.

## Maintenance Tasks

- Vacuum `sync_log` regularly (append-only, will grow)
- Archive old notifications_log monthly
- Monitor `pf_sync_state.consecutive_error_count` for sync health
- Reindex `tasks` on sync completions if high turnover
