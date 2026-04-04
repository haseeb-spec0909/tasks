"""FastAPI application entry point for the scheduling engine."""

import asyncio
from datetime import datetime, date, time, timedelta
from typing import List, Optional
import structlog
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from engine.config import config
from engine.models import (
    TaskInput, HabitInput, CalendarEvent, UserSettings,
    SchedulingResult, PriorityLevel, SourceType
)
from engine.scheduler import SchedulingEngine
from engine.db import db

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


# Lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    await db.init()
    logger.info("Application startup complete")
    yield
    # Shutdown
    await db.close()
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="TMC TimeIntel Scheduling Engine",
    description="AI-powered work intelligence scheduling service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint.

    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "timeintel-scheduling-engine",
        "version": "1.0.0"
    }


# Scheduling endpoints
@app.post("/api/schedule/run/{user_id}", response_model=SchedulingResult, tags=["scheduling"])
async def trigger_schedule_run(
    user_id: str,
    background_tasks: BackgroundTasks
) -> SchedulingResult:
    """Trigger full scheduling run for a user.

    Args:
        user_id: User identifier
        background_tasks: Background task queue

    Returns:
        SchedulingResult

    Raises:
        HTTPException: If user not found
    """
    logger.info("Schedule run requested", user_id=user_id)

    try:
        # Fetch user data
        user_settings = await _get_user_settings(user_id)
        tasks = await _get_user_tasks(user_id)
        habits = await _get_user_habits(user_id)
        calendar_events = await _get_calendar_events(user_id)

        # Run scheduler
        engine = SchedulingEngine(user_settings)
        start_dt = datetime.combine(date.today(), time.min)
        end_dt = start_dt + timedelta(days=user_settings.scheduling_horizon_days)

        result = engine.schedule(
            tasks,
            habits,
            calendar_events,
            (start_dt, end_dt)
        )

        # Save result in background
        background_tasks.add_task(_save_schedule, user_id, result)

        logger.info("Schedule run completed", user_id=user_id, block_count=len(result.scheduled_blocks))
        return result

    except Exception as e:
        logger.error("Schedule run failed", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/schedule/reschedule", response_model=SchedulingResult, tags=["scheduling"])
async def reschedule_task(
    user_id: str,
    task_id: str,
    background_tasks: BackgroundTasks
) -> SchedulingResult:
    """Reschedule a specific task.

    Args:
        user_id: User identifier
        task_id: Task to reschedule
        background_tasks: Background task queue

    Returns:
        SchedulingResult

    Raises:
        HTTPException: If user or task not found
    """
    logger.info("Reschedule requested", user_id=user_id, task_id=task_id)

    try:
        # Fetch user data
        user_settings = await _get_user_settings(user_id)
        tasks = await _get_user_tasks(user_id)
        habits = await _get_user_habits(user_id)
        calendar_events = await _get_calendar_events(user_id)

        # Run scheduler
        engine = SchedulingEngine(user_settings)
        result = engine.reschedule_single(
            task_id,
            tasks,
            habits,
            calendar_events,
            user_settings
        )

        # Save result in background
        background_tasks.add_task(_save_schedule, user_id, result)

        logger.info("Reschedule completed", user_id=user_id, task_id=task_id)
        return result

    except Exception as e:
        logger.error("Reschedule failed", user_id=user_id, task_id=task_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/schedule/calendar-changed", tags=["webhooks"])
async def calendar_changed_webhook(
    user_id: str,
    background_tasks: BackgroundTasks
) -> dict:
    """Webhook handler for calendar changes.

    Enqueued from Google Calendar push notifications via Cloud Tasks.

    Args:
        user_id: User identifier
        background_tasks: Background task queue

    Returns:
        Acknowledgment
    """
    logger.info("Calendar change webhook received", user_id=user_id)

    try:
        # Trigger re-schedule in background
        background_tasks.add_task(_reschedule_user, user_id)

        return {"status": "acknowledged", "user_id": user_id}

    except Exception as e:
        logger.error("Webhook processing failed", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/schedule/batch", tags=["scheduling"])
async def batch_schedule(
    user_ids: List[str],
    background_tasks: BackgroundTasks
) -> dict:
    """Batch scheduling for multiple users (used by cron).

    Args:
        user_ids: List of user identifiers
        background_tasks: Background task queue

    Returns:
        Batch job status
    """
    logger.info("Batch schedule requested", user_count=len(user_ids))

    try:
        # Queue all users
        for user_id in user_ids:
            background_tasks.add_task(_schedule_user, user_id)

        return {
            "status": "queued",
            "user_count": len(user_ids),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error("Batch schedule failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/schedule/explain/{user_id}", tags=["scheduling"])
async def explain_scheduling(user_id: str) -> dict:
    """Explain current scheduling decisions for a user.

    Returns reasoning and scoring for scheduled items.

    Args:
        user_id: User identifier

    Returns:
        Explanation of current schedule

    Raises:
        HTTPException: If user not found
    """
    logger.info("Explain request", user_id=user_id)

    try:
        # Fetch current schedule
        current_blocks = await _get_current_schedule(user_id)

        # Build explanation
        explanation = {
            "user_id": user_id,
            "block_count": len(current_blocks),
            "blocks": [
                {
                    "block_id": b.block_id,
                    "type": b.block_type.value,
                    "start": b.slot_start.isoformat(),
                    "end": b.slot_end.isoformat(),
                    "score": b.score,
                    "reasoning": _explain_block(b)
                }
                for b in current_blocks
            ],
            "timestamp": datetime.utcnow().isoformat()
        }

        return explanation

    except Exception as e:
        logger.error("Explain failed", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions

async def _get_user_settings(user_id: str) -> UserSettings:
    """Fetch user settings from database."""
    settings = await db.get_user_settings(user_id)
    if not settings:
        raise ValueError(f"User {user_id} not found")
    return settings


async def _get_user_tasks(user_id: str) -> List[TaskInput]:
    """Fetch user tasks from database."""
    return await db.get_user_tasks(user_id)


async def _get_user_habits(user_id: str) -> List[HabitInput]:
    """Fetch user habits from database."""
    return await db.get_user_habits(user_id)


async def _get_calendar_events(user_id: str) -> List[CalendarEvent]:
    """Fetch calendar events for user."""
    start = datetime.combine(date.today(), time.min)
    end = start + timedelta(days=14)
    return await db.get_calendar_cache(user_id, start, end)


async def _get_current_schedule(user_id: str) -> List:
    """Fetch current schedule for user."""
    return await db.get_scheduling_state(user_id)


async def _save_schedule(user_id: str, result: SchedulingResult) -> None:
    """Save schedule result to database."""
    logger.info("Saving schedule", user_id=user_id)
    await db.save_scheduling_state(user_id, result.scheduled_blocks)


async def _schedule_user(user_id: str) -> None:
    """Full schedule run for a user."""
    logger.info("Scheduling user", user_id=user_id)
    try:
        user_settings = await _get_user_settings(user_id)
        tasks = await _get_user_tasks(user_id)
        habits = await _get_user_habits(user_id)
        calendar_events = await _get_calendar_events(user_id)

        engine = SchedulingEngine(user_settings)
        start_dt = datetime.combine(date.today(), time.min)
        end_dt = start_dt + timedelta(days=user_settings.scheduling_horizon_days)

        result = engine.schedule(tasks, habits, calendar_events, (start_dt, end_dt))
        await _save_schedule(user_id, result)
    except Exception as e:
        logger.error("Schedule failed", user_id=user_id, error=str(e))


async def _reschedule_user(user_id: str) -> None:
    """Reschedule a user after calendar change."""
    await _schedule_user(user_id)


def _explain_block(block) -> str:
    """Generate explanation for a scheduled block."""
    if block.block_type.value == "task":
        return f"Task scheduled with score {block.score:.1f}"
    elif block.block_type.value == "focus":
        return "Focus time block"
    elif block.block_type.value == "habit":
        return f"Habit scheduled"
    return "Scheduled block"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level=config.LOG_LEVEL.lower()
    )
