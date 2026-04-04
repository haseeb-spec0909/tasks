"""Pydantic models for the scheduling engine."""

from datetime import datetime, date, time
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    """Task source types."""
    GOOGLE_TASKS = "GOOGLE_TASKS"
    PROJECTFLOW = "PROJECTFLOW"


class PriorityLevel(str, Enum):
    """Priority levels for tasks."""
    P1_CRITICAL = "P1_CRITICAL"
    P2_HIGH = "P2_HIGH"
    P3_MEDIUM = "P3_MEDIUM"
    P4_LOW = "P4_LOW"


class TaskType(str, Enum):
    """Task categorization."""
    WORK = "work"
    PERSONAL = "personal"


class BlockType(str, Enum):
    """Types of scheduled blocks."""
    TASK = "task"
    FOCUS = "focus"
    HABIT = "habit"


class TaskInput(BaseModel):
    """Input model for a task to be scheduled."""

    task_id: str = Field(..., description="Unique task identifier")
    source: SourceType = Field(..., description="Source system (Google Tasks or ProjectFlow)")
    title: str = Field(..., description="Task title")
    status: str = Field(default="open", description="Task status (open, completed, etc)")
    priority: PriorityLevel = Field(default=PriorityLevel.P3_MEDIUM, description="Task priority")
    due_date: Optional[date] = Field(None, description="Task due date")
    start_date: Optional[date] = Field(None, description="Earliest date task can be scheduled")
    estimated_duration_mins: int = Field(..., description="Estimated time to complete (minutes)")
    min_block_mins: int = Field(default=30, description="Minimum contiguous time required")
    allow_split: bool = Field(default=True, description="Can task be split across days")
    progress_pct: int = Field(default=0, ge=0, le=100, description="Task completion percentage")
    wp_code: Optional[str] = Field(None, description="Work package/project code")
    task_type: TaskType = Field(default=TaskType.WORK, description="Work or personal")

    class Config:
        use_enum_values = False


class HabitInput(BaseModel):
    """Input model for a habit to be scheduled."""

    habit_id: str = Field(..., description="Unique habit identifier")
    title: str = Field(..., description="Habit title")
    category: str = Field(..., description="Habit category (prayer, exercise, break, etc)")
    min_duration_mins: int = Field(default=15, description="Minimum duration")
    max_duration_mins: int = Field(default=60, description="Maximum duration")
    ideal_time: Optional[time] = Field(None, description="Preferred time of day")
    recurrence_rule: str = Field(default="FREQ=DAILY", description="iCalendar RRULE format")
    priority: PriorityLevel = Field(default=PriorityLevel.P3_MEDIUM, description="Habit priority")

    class Config:
        use_enum_values = False


class CalendarEvent(BaseModel):
    """Represents an existing calendar event."""

    event_id: str = Field(..., description="Calendar event ID")
    start: datetime = Field(..., description="Event start time")
    end: datetime = Field(..., description="Event end time")
    summary: str = Field(default="", description="Event title")
    category: str = Field(default="other", description="Event category")
    is_ai_managed: bool = Field(default=False, description="Created by scheduling engine")

    class Config:
        use_enum_values = False


class TimeSlot(BaseModel):
    """Represents a time slot."""

    start: datetime = Field(..., description="Slot start time")
    end: datetime = Field(..., description="Slot end time")
    duration_mins: int = Field(..., description="Duration in minutes")

    class Config:
        use_enum_values = False


class WorkingHours(BaseModel):
    """Working hours for a day."""

    day: str = Field(..., description="Day of week (MONDAY, TUESDAY, etc)")
    start: time = Field(..., description="Start time")
    end: time = Field(..., description="End time")

    class Config:
        use_enum_values = False


class UserSettings(BaseModel):
    """User scheduling preferences and constraints."""

    user_id: str = Field(..., description="User identifier")
    working_hours: Dict[str, Dict[str, str]] = Field(
        default_factory=lambda: {
            "MONDAY": {"start": "09:00", "end": "17:00"},
            "TUESDAY": {"start": "09:00", "end": "17:00"},
            "WEDNESDAY": {"start": "09:00", "end": "17:00"},
            "THURSDAY": {"start": "09:00", "end": "17:00"},
            "FRIDAY": {"start": "09:00", "end": "17:00"},
        },
        description="Working hours by day"
    )
    focus_target_mins: int = Field(default=300, description="Weekly focus time target (minutes)")
    focus_defense_mode: str = Field(
        default="soft",
        description="Focus block protection: soft (moveable), locked (busy)"
    )
    scheduling_horizon_days: int = Field(default=14, description="How many days ahead to schedule")
    default_task_duration_mins: int = Field(default=60, description="Default task duration")
    min_focus_block_mins: int = Field(default=60, description="Minimum focus block duration")
    max_focus_block_mins: int = Field(default=180, description="Maximum focus block duration")
    ideal_focus_start_time: str = Field(default="09:00", description="Preferred focus start time")
    timezone: str = Field(default="UTC", description="User timezone")

    class Config:
        use_enum_values = False


class ScheduledBlock(BaseModel):
    """A scheduled time block (task, focus, or habit)."""

    block_id: str = Field(..., description="Unique block identifier")
    task_id: Optional[str] = Field(None, description="Associated task ID if block_type=task")
    habit_id: Optional[str] = Field(None, description="Associated habit ID if block_type=habit")
    block_type: BlockType = Field(..., description="Type of block")
    slot_start: datetime = Field(..., description="Block start time")
    slot_end: datetime = Field(..., description="Block end time")
    gcal_event_id: Optional[str] = Field(None, description="Google Calendar event ID")
    is_split: bool = Field(default=False, description="Part of a split task")
    split_index: Optional[int] = Field(None, description="Index if split (0, 1, 2, ...)")
    score: float = Field(default=0.0, description="Scheduling score for this slot")

    class Config:
        use_enum_values = False


class SchedulingResult(BaseModel):
    """Output of the scheduling engine."""

    user_id: str = Field(..., description="User ID")
    scheduled_blocks: List[ScheduledBlock] = Field(default_factory=list, description="Scheduled blocks")
    unschedulable_tasks: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Tasks that could not be scheduled with reasons"
    )
    warnings: List[str] = Field(default_factory=list, description="Scheduling warnings")
    scheduling_version: int = Field(default=1, description="Scheduling run version")
    computed_at: datetime = Field(default_factory=datetime.utcnow, description="When scheduled")

    class Config:
        use_enum_values = False
