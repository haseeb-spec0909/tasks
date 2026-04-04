"""Focus time management and scheduling."""

from datetime import datetime, date, time, timedelta
from typing import Dict, List, Optional
import structlog

from engine.models import UserSettings, TimeSlot, ScheduledBlock, TaskInput, BlockType

logger = structlog.get_logger(__name__)


class FocusTimeManager:
    """Manages focus time allocation and scheduling."""

    def __init__(self, settings: UserSettings):
        """Initialize focus time manager.

        Args:
            settings: User scheduling settings
        """
        self.settings = settings
        self.weekly_target_mins = settings.focus_target_mins
        self.min_block_mins = settings.min_focus_block_mins
        self.max_block_mins = settings.max_focus_block_mins

    def calculate_daily_targets(self, start_date: date, end_date: date) -> Dict[date, int]:
        """Distribute weekly focus target across days in date range.

        Strategy:
        - Calculate working days in range
        - Distribute target evenly across working days
        - Ensure each day gets min_block_mins at least

        Args:
            start_date: Range start date
            end_date: Range end date

        Returns:
            Dict mapping each date to target focus minutes
        """
        targets = {}
        current_date = start_date

        # Count working days
        working_days = 0
        temp_date = start_date
        while temp_date <= end_date:
            if self._is_working_day(temp_date):
                working_days += 1
            temp_date += timedelta(days=1)

        if working_days == 0:
            return targets

        # Distribute weekly target
        daily_target = max(self.min_block_mins, self.weekly_target_mins // working_days)

        while current_date <= end_date:
            if self._is_working_day(current_date):
                targets[current_date] = min(daily_target, self.max_block_mins)
            current_date += timedelta(days=1)

        return targets

    def find_focus_slots(
        self,
        free_slots: List[TimeSlot],
        target_date: date,
        duration_mins: int
    ) -> List[TimeSlot]:
        """Find best focus time slots for a given date.

        Preferences (in order):
        1. Ideal focus start time (from settings)
        2. Morning hours (8am-12pm)
        3. Early afternoon (2pm-4pm)
        4. Any available slot

        Args:
            free_slots: Available free slots for the date
            target_date: Date to find focus slots for
            duration_mins: Duration needed

        Returns:
            List of suitable focus slots, best first
        """
        suitable_slots = []

        # Parse ideal focus start time
        try:
            ideal_hour = int(self.settings.ideal_focus_start_time.split(":")[0])
        except (ValueError, IndexError):
            ideal_hour = 9

        for slot in free_slots:
            if slot.duration_mins < duration_mins:
                continue

            # Create a slot of exact duration from this free slot
            focus_slot = TimeSlot(
                start=slot.start,
                end=slot.start + timedelta(minutes=duration_mins),
                duration_mins=duration_mins
            )

            # Score this slot
            score = 0.0

            slot_hour = focus_slot.start.hour

            # Ideal time bonus
            if slot_hour == ideal_hour:
                score += 100.0
            elif 8 <= slot_hour < 12:
                score += 50.0
            elif 14 <= slot_hour < 16:
                score += 25.0

            suitable_slots.append((score, focus_slot))

        # Sort by score descending
        suitable_slots.sort(key=lambda x: x[0], reverse=True)
        return [slot for _, slot in suitable_slots]

    def should_create_emergency_focus(self, urgent_tasks: List[TaskInput]) -> bool:
        """Determine if emergency focus block needed.

        Emergency focus needed if:
        - P1 task due within 24 hours
        - No focus time already scheduled for today

        Args:
            urgent_tasks: List of urgent tasks

        Returns:
            True if emergency focus should be created
        """
        return len(urgent_tasks) > 0

    def link_task_to_focus(
        self,
        focus_block: ScheduledBlock,
        tasks: List[TaskInput]
    ) -> Optional[str]:
        """Link highest-priority ProjectFlow task to focus block.

        Args:
            focus_block: Focus block to link
            tasks: Available tasks

        Returns:
            Task ID if found, None otherwise
        """
        # Filter to ProjectFlow tasks only
        pf_tasks = [t for t in tasks if t.source.value == "PROJECTFLOW"]
        if not pf_tasks:
            return None

        # Sort by priority, due date
        pf_tasks.sort(
            key=lambda t: (
                t.priority.value,
                t.due_date or date.max
            )
        )

        # Return highest priority task
        return pf_tasks[0].task_id if pf_tasks else None

    def _is_working_day(self, target_date: date) -> bool:
        """Check if date is a working day.

        Args:
            target_date: Date to check

        Returns:
            True if working day, False otherwise
        """
        day_name = target_date.strftime("%A").upper()
        return day_name in self.settings.working_hours and self.settings.working_hours[day_name]
