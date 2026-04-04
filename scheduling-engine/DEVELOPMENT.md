# TMC TimeIntel Scheduling Engine - Development Guide

## Overview

The Scheduling Engine is the core AI-powered work intelligence component of TMC TimeIntel. It implements a sophisticated constraint-satisfaction scheduling algorithm that intelligently allocates tasks, habits, and focus time across a user's calendar.

**Admin Contact:** haseeb@tmcltd.ai

## Architecture

### Core Components

1. **SchedulingEngine** (`engine/scheduler.py`)
   - Main scheduling algorithm
   - Implements constraint-satisfaction approach
   - Handles task prioritization, habit scheduling, focus time allocation
   - Supports task splitting and rescheduling

2. **Models** (`engine/models.py`)
   - Pydantic data models for all entities
   - TaskInput, HabitInput, CalendarEvent, UserSettings
   - ScheduledBlock, SchedulingResult

3. **Constraints** (`engine/constraints.py`)
   - Hard constraints (must-satisfy): no overlap, working hours, date ranges, min block
   - Soft constraints (optimize-for): urgency, morning preference, focus adjacency, WP grouping

4. **Priority** (`engine/priority.py`)
   - Task prioritization logic
   - Calculates priority based on due date and explicit level
   - Identifies urgent and at-risk tasks

5. **Focus Time Management** (`engine/focus_time.py`)
   - Manages focus block allocation
   - Distributes weekly target across working days
   - Links focus blocks to highest-priority ProjectFlow tasks

6. **Habit Scheduling** (`engine/habit_scheduler.py`)
   - Schedules habits with flexibility
   - Handles prayer/spiritual habits (P1) with special protection
   - Supports recurrence rules (RRULE)

7. **Calendar Sync** (`engine/calendar_sync.py`)
   - Builds Google Calendar events from scheduled blocks
   - Computes minimal change deltas (create/update/delete)
   - Stores extended properties for tracking

## Algorithm Details

### Scheduling Algorithm (High Level)

```
1. Build free slot map
   - For each working day, compute available time within working hours
   - Subtract existing calendar events
   - Result: Dict[date] -> List[TimeSlot]

2. Sort tasks by priority
   - P1_CRITICAL > P2_HIGH > P3_MEDIUM > P4_LOW
   - Within priority: soonest due date first
   - Within due date: ProjectFlow before Google Tasks

3. Schedule habits
   - P1 (prayer) habits first - never displaced
   - Other habits in ideal time windows
   - Compress or flex as needed

4. Reserve focus time
   - Distribute weekly target across working days
   - Find best focus slots (morning preference, ideal time)
   - Link to highest-priority ProjectFlow task when possible

5. Schedule tasks (in priority order)
   - For each task:
     a. Find all candidate slots satisfying hard constraints
     b. Score each candidate slot
     c. Assign to highest-scoring slot
     d. If task needs splitting: split across days respecting min_block_mins
     e. If no valid slot: add to unschedulable_tasks with reason

6. Add buffers
   - Insert 5-minute buffers between back-to-back blocks
   - Reorder by time

7. Return SchedulingResult
   - Scheduled blocks with GCal event IDs
   - Unschedulable tasks with reasons
   - Warnings and statistics
```

### Scoring Function

Each candidate slot is scored based on:

```
score = urgency_bonus + morning_bonus + focus_adjacency + wp_grouping + fragmentation_penalty

urgency_bonus        = 100 / max(1, days_until_due)  [higher for imminent deadlines]
morning_bonus        = 20 if slot.start.hour < 11 else 0
focus_adjacency      = 15 if slot adjacent to focus block
wp_grouping          = 10 if same work package as adjacent block
fragmentation_penalty = -10 if creates gap < 30 mins
```

Higher scores = better slots.

### Hard Constraints

Must all be satisfied for a slot to be valid:

1. **no_overlap**: Slot doesn't overlap with existing calendar events
2. **within_working_hours**: Slot is within day's working hours
3. **after_start_date**: Slot is on or after task start_date
4. **before_due_date**: Slot is on or before task due_date (considering due date time)
5. **meets_min_block**: Slot duration >= task.min_block_mins

## Key Design Decisions

### 1. Constraint Satisfaction
Uses hard + soft constraint approach rather than OR-Tools (which is available but would be overkill for this use case). This provides:
- Fast scheduling (typically < 5 seconds for 2-week horizon with 30-40 tasks)
- Deterministic, explainable results
- Easy to extend with new constraints
- Handles complex real-world scheduling naturally

### 2. Focus Time Management
Focus time is allocated proactively based on weekly target (e.g., 300 min/week):
- Distributed across working days
- Scheduled before tasks (in priority order)
- Can be linked to highest-priority ProjectFlow task
- "Defense mode" options:
  - soft: Focus blocks are moveable if needed
  - locked: Focus blocks are marked Busy in GCal

### 3. Habit Flexibility
Habits are scheduled with flexibility:
- Prayer/spiritual (P1) habits have strict time windows
- Other habits flex within ideal_time window (±1 hour)
- Can compress to min_duration if space tight
- Respect recurrence rules (RRULE)

### 4. Task Splitting
Tasks can be split across days if:
- allow_split = True
- Task duration > available slot duration
- Each segment >= min_block_mins

Example: 2-hour task with max 1-hour slot → splits into 2 days

### 5. Priority Calculation
Task priority is computed dynamically:
- Tasks due < 24h → P1_CRITICAL
- Tasks due 24h-3d → P2_HIGH
- Otherwise use explicit priority
- ProjectFlow tasks elevated over Google Tasks (same priority)

## Configuration

See `.env.example` for all options:

```bash
# Database & Redis
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...

# GCP & AI
GCP_PROJECT=tmc-timeintel-prod
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-pro

# Scheduling parameters
SCHEDULING_HORIZON_DAYS=14
MIN_BLOCK_MINS=30
BUFFER_BETWEEN_BLOCKS_MINS=5
MAX_SCHEDULING_TIME_SECS=30

# Server
HOST=0.0.0.0
PORT=8081
DEBUG=false
LOG_LEVEL=INFO
```

## API Endpoints

### Health Check
```
GET /health
```
Always available, returns service status.

### Run Scheduling
```
POST /api/schedule/run/{user_id}
```
Triggers full scheduling run for a user. Runs async, returns immediately.

### Reschedule Single Task
```
POST /api/schedule/reschedule?user_id={user_id}&task_id={task_id}
```
Reschedules a specific task after changes.

### Calendar Changed Webhook
```
POST /api/schedule/calendar-changed?user_id={user_id}
```
Triggered by calendar push notifications (via Cloud Tasks). Queues re-schedule.

### Batch Schedule
```
POST /api/schedule/batch
Body: {"user_ids": ["user1", "user2", ...]}
```
Batch scheduling for multiple users (used by cron). Queues all users.

### Explain Scheduling
```
GET /api/schedule/explain/{user_id}
```
Explain current scheduling decisions and scores for all blocks.

## Database Schema (Outline)

The following tables are required (implement as needed):

### tasks
```sql
CREATE TABLE tasks (
    task_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    source VARCHAR,  -- GOOGLE_TASKS | PROJECTFLOW
    title VARCHAR,
    status VARCHAR,
    priority VARCHAR,
    due_date DATE,
    start_date DATE,
    estimated_duration_mins INT,
    min_block_mins INT,
    allow_split BOOLEAN,
    progress_pct INT,
    wp_code VARCHAR,
    task_type VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### habits
```sql
CREATE TABLE habits (
    habit_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    title VARCHAR,
    category VARCHAR,
    min_duration_mins INT,
    max_duration_mins INT,
    ideal_time TIME,
    recurrence_rule VARCHAR,
    priority VARCHAR,
    active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### scheduled_blocks
```sql
CREATE TABLE scheduled_blocks (
    block_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    task_id VARCHAR,
    habit_id VARCHAR,
    block_type VARCHAR,
    slot_start TIMESTAMP,
    slot_end TIMESTAMP,
    gcal_event_id VARCHAR,
    is_split BOOLEAN,
    split_index INT,
    score FLOAT,
    created_at TIMESTAMP,
    scheduling_version INT
);
```

### user_settings
```sql
CREATE TABLE user_settings (
    user_id VARCHAR PRIMARY KEY,
    working_hours JSONB,
    focus_target_mins INT,
    focus_defense_mode VARCHAR,
    scheduling_horizon_days INT,
    default_task_duration_mins INT,
    min_focus_block_mins INT,
    max_focus_block_mins INT,
    ideal_focus_start_time VARCHAR,
    timezone VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Local Development

### Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with local database and Redis URLs
```

### Run Locally

```bash
# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8081

# Health check
curl http://localhost:8081/health

# Test scheduling (requires valid user_id in database)
curl -X POST http://localhost:8081/api/schedule/run/test-user-1
```

### Testing

```bash
# Run tests (when available)
pytest tests/

# With coverage
pytest --cov=engine tests/
```

## Deployment

### Docker

```bash
# Build image
docker build -t timeintel-scheduling:1.0.0 .

# Run container
docker run -p 8081:8081 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  -e GCP_PROJECT="..." \
  timeintel-scheduling:1.0.0
```

### Google Cloud Run

```bash
# Deploy
gcloud run deploy timeintel-scheduling \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars DATABASE_URL=...,REDIS_URL=...
```

## Monitoring & Observability

### Structured Logging

All logs use structlog with consistent fields:
- `user_id`: User identifier
- `task_id`: Task identifier
- `error`: Error message
- `duration_ms`: Operation duration
- `timestamp`: ISO 8601 timestamp

### Key Metrics to Track

1. **Scheduling Performance**
   - Time to complete schedule run (target: < 5s)
   - Number of tasks scheduled vs unschedulable
   - Percentage of focus time target achieved

2. **Quality**
   - Average task urgency score
   - Fragmentation ratio (unused gaps < 30 min)
   - Task split frequency

3. **Reliability**
   - Schedule run success rate (target: > 99%)
   - Calendar sync error rate
   - Rescheduling frequency

## Future Enhancements

1. **Multi-day Task Sequences**
   - Support for tasks that must complete in sequence
   - Dependency tracking

2. **Time Zone Support**
   - Currently assumes UTC
   - User-specific timezone support

3. **Predictive Scheduling**
   - Use Gemini to estimate duration based on task history
   - Identify high-risk tasks early

4. **Machine Learning**
   - Learn user preferences over time
   - Optimize scoring weights per user
   - Anomaly detection for unusual patterns

5. **Conflict Resolution**
   - Smart rescheduling when new urgent tasks arrive
   - Negotiation algorithms for overlapping requests

6. **Integration Expansion**
   - Slack status integration
   - Notion database sync
   - Linear issue tracking
   - Jira integration

## Support

For questions or issues:
- Email: haseeb@tmcltd.ai
- Internal Slack: #timeintel-dev
