"""TMC TimeIntel Scheduling Engine - AI-powered work intelligence scheduling module."""

__version__ = "1.0.0"
__author__ = "TMC TimeIntel Team"
__email__ = "haseeb@tmcltd.ai"

from engine.scheduler import SchedulingEngine
from engine.models import (
    TaskInput,
    HabitInput,
    CalendarEvent,
    UserSettings,
    TimeSlot,
    ScheduledBlock,
    SchedulingResult,
)

__all__ = [
    "SchedulingEngine",
    "TaskInput",
    "HabitInput",
    "CalendarEvent",
    "UserSettings",
    "TimeSlot",
    "ScheduledBlock",
    "SchedulingResult",
]
