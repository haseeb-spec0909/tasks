# Quick Start Guide - TMC TimeIntel Scheduling Engine

## Installation & Running

### 1. Local Development (5 minutes)

```bash
# Setup
cd /path/to/scheduling-engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your database and Redis URLs

# Run
uvicorn main:app --reload --port 8081

# Test
curl http://localhost:8081/health
```

### 2. Docker (3 minutes)

```bash
# Build
docker build -t timeintel-scheduling:1.0.0 .

# Run
docker run -p 8081:8081 \
  -e DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db" \
  -e REDIS_URL="redis://localhost:6379/0" \
  timeintel-scheduling:1.0.0
```

### 3. Cloud Run (1 minute)

```bash
gcloud run deploy timeintel-scheduling \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2
```

## Key API Calls

### Health Check
```bash
curl http://localhost:8081/health
```

### Run Full Schedule
```bash
curl -X POST http://localhost:8081/api/schedule/run/user-123
```

### Reschedule Single Task
```bash
curl -X POST "http://localhost:8081/api/schedule/reschedule?user_id=user-123&task_id=task-456"
```

### Explain Scheduling
```bash
curl http://localhost:8081/api/schedule/explain/user-123 | jq .
```

### Batch Schedule
```bash
curl -X POST http://localhost:8081/api/schedule/batch \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["user-1", "user-2", "user-3"]}'
```

## File Structure

```
scheduling-engine/
├── main.py                    # FastAPI application
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container config
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
│
├── engine/                    # Core scheduling package
│   ├── __init__.py           # Package exports
│   ├── config.py             # Configuration
│   ├── models.py             # Pydantic models
│   ├── scheduler.py          # Core algorithm (536 lines)
│   ├── constraints.py        # Hard/soft constraints
│   ├── priority.py           # Task prioritization
│   ├── focus_time.py         # Focus time allocation
│   ├── habit_scheduler.py    # Habit scheduling
│   ├── calendar_sync.py      # Calendar integration
│   └── db.py                 # Database layer
│
├── DEVELOPMENT.md            # Developer guide
├── PROJECT_SUMMARY.md        # Complete overview
└── QUICK_START.md            # This file
```

## Core Concepts

### Scheduling Algorithm (7 steps)
1. Build free slot map from calendar
2. Sort tasks by priority
3. Schedule habits (P1 protected)
4. Reserve focus time
5. Schedule tasks in priority order
6. Add buffers between blocks
7. Return result

### Constraint System
- **Hard Constraints:** No overlap, working hours, date ranges, min blocks
- **Soft Constraints:** Urgency, morning preference, focus adjacency, WP grouping

### Scoring Function
```
score = urgency_bonus(100) + morning_bonus(20) + focus_bonus(15) 
        + wp_grouping(10) + fragmentation_penalty(-10)
```

### Focus Time
- Weekly target (default: 300 min)
- Distributed across working days
- Morning preference (before 11am)
- Can be "locked" (Busy) or "soft" (moveable)

### Task Priority
Computed dynamically:
- Due < 24h → P1_CRITICAL
- Due 24h-3d → P2_HIGH
- Otherwise use explicit priority
- ProjectFlow elevated over Google Tasks

## Configuration

Key environment variables:

```bash
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
GCP_PROJECT=tmc-timeintel-prod
SCHEDULING_HORIZON_DAYS=14
MAX_SCHEDULING_TIME_SECS=30
ADMIN_EMAIL=haseeb@tmcltd.ai
```

See `.env.example` for all options.

## Models (Input/Output)

### Input
- `TaskInput` - Task to schedule
- `HabitInput` - Habit to schedule
- `CalendarEvent` - Existing event
- `UserSettings` - User preferences

### Output
- `SchedulingResult` - All scheduled blocks + unschedulable list

## Troubleshooting

### Schedule runs slow
- Increase `MAX_SCHEDULING_TIME_SECS` in .env
- Reduce `SCHEDULING_HORIZON_DAYS`
- Reduce number of tasks

### Tasks not scheduling
- Check `unschedulable_tasks` in result for reasons
- Verify working hours are set
- Check due dates and start dates
- Ensure min_block_mins fits in available slots

### Database connection fails
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify asyncpg is installed

### Calendar sync issues
- Check GCP credentials
- Verify Google Calendar API enabled
- Check user has calendar access

## Performance

- Typical scheduling: < 5 seconds for 30 tasks over 2 weeks
- Concurrent users: > 100 simultaneous schedules
- Memory: ~50-100MB baseline
- Database queries: < 100ms each

## Testing

```bash
# Run tests (when available)
pytest tests/

# With coverage
pytest --cov=engine tests/

# Specific test
pytest tests/test_scheduler.py -v
```

## Logging

All operations logged with structured logging:
- Log level configurable via `LOG_LEVEL` env var
- Default: INFO
- Set to DEBUG for development

View logs:
```bash
# Docker
docker logs <container-id>

# Local
tail -f logs/*.log
```

## Support

- **Admin:** haseeb@tmcltd.ai
- **Issues:** See DEVELOPMENT.md
- **Docs:** DEVELOPMENT.md has full architecture details

## Next Steps

1. Set up database (PostgreSQL)
2. Configure .env with credentials
3. Run local or Docker
4. Call `/api/schedule/run/{user_id}` endpoint
5. Check `/api/schedule/explain/{user_id}` for results

That's it! The engine is ready to use.
