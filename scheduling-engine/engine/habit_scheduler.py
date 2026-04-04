"""Habit scheduling and management."""

from datetime import datetime, date, time, timedelta
from typing import List, Optional, Dict
import structlog
from dateutil.rrule import rrulestr, DAILY

from engine.models import UserSettings, HabitInput, TimeSlot, ScheduledBlock, BlockType, PriorityLevel

logger = structlog.get_logger(__name__)


class HabitScheduler:
    """Manages habit scheduling and flexibility."""

    def __init__(self, settings: UserSettings):
        """Initialize habit scheduler.

        Args:
            settings: User scheduling settings
        """
        self.settings = settings

    def schedule_habits(
        self,
        habits: List[HabitInput],
        free_slots: Dict[date, List[TimeSlot]],
        target_date: date
    ) -> List[ScheduledBlock]:
        """Schedule habits for a given date.

        Strategy:
        1. Filter habits occurring on this date (via recurrence rule)
        2. Separate P1 (prayer) habits - must not be displaced
        3. Schedule P1 habits first in ideal windows
        4. Schedule other habits, flexing as needed

        Args:
            habits: List of habits to consider
            free_slots: Dict of date -> list of free slots
            target_date: Date to schedule habits for

        Returns:
            List of scheduled habit blocks
        """
        scheduled = []

        if target_date not in free_slots:
            return scheduled

        # Filter habits that occur on this date
        applicable_habits = [
            h for h in habits
            if self._occurs_on_date(h, target_date)
        ]

        # Sort by priority (P1 first)
        applicable_habits.sort(key=lambda h: (
            h.priority.value,
            h.ideal_time or time.max
        ))

        available_slots = free_slots[target_date].copy()

        for habit in applicable_habits:
            # Find best slot for habit
            slot = self.flex_habit(habit, available_slots, target_date)

            if slot:
                # Create scheduled block
                block = ScheduledBlock(
                    block_id=f"habit_{habit.habit_id}_{target_date}",
                    habit_id=habit.habit_id,
                    block_type=BlockType.HABIT,
                    slot_start=slot.start,
                    slot_end=slot.end,
                    score=100.0 if self.is_prayer_habit(habit) else 50.0
                )
                scheduled.append(block)

                # Remove used slot(s) from available
                available_slots = self._remove_used_slot(available_slots, slot)

        return scheduled

    def flex_habit(
        self,
        habit: HabitInput,
        available_slots: List[TimeSlot],
        target_date: date
    ) -> Optional[TimeSlot]:
        """Find best slot for habit within its ideal window.

        Logic:
        1. If ideal_time set, search within 1-hour window
        2. Otherwise, find any available slot
        3. Compress to min_duration if no exact-fit slot
        4. For prayer habits (P1), must find a slot

        Args:
            habit: Habit to schedule
            available_slots: Available free slots
            target_date: Date to schedule for

        Returns:
            TimeSlot if found, None otherwise
        """
        duration = habit.min_duration_mins

        # If ideal time specified, search near it
        if habit.ideal_time:
            window_start = datetime.combine(
                target_date,
                (datetime.combine(date.today(), habit.ideal_time) - timedelta(minutes=30)).time()
            )
            window_end = datetime.combine(
                target_date,
                (datetime.combine(date.today(), habit.ideal_time) + timedelta(hours=1)).time()
            )

            for slot in available_slots:
                if slot.start >= window_start and slot.end <= window_end:
                    if slot.duration_mins >= habit.min_duration_mins:
                        return TimeSlot(
                            start=slot.start,
                            end=slot.start + timedelta(minutes=duration),
                            duration_mins=duration
                        )

        # No ideal slot found, use any available
        for slot in available_slots:
            if slot.duration_mins >= habit.min_duration_mins:
                return TimeSlot(
                    start=slot.start,
                    end=slot.start + timedelta(minutes=duration),
                    duration_mins=duration
                )

        # If prayer habit and still no slot, try to compress
        if self.is_prayer_habit(habit):
            compressed_duration = self.compress_habit(habit, 20)
            for slot in available_slots:
                if slot.duration_mins >= compressed_duration:
                    return TimeSlot(
                        start=slot.start,
                        end=slot.start + timedelta(minutes=compressed_duration),
                        duration_mins=compressed_duration
                    )

        return None

    def compress_habit(self, habit: HabitInput, available_duration: int) -> int:
        """Compress habit to fit available time.

        Returns max of:
        - Available duration
        - Habit minimum duration

        Args:
            habit: Habit to compress
            available_duration: How much time is available

        Returns:
            Duration to use in minutes
        """
        return max(habit.min_duration_mins, available_duration)

    def is_prayer_habit(self, habit: HabitInput) -> bool:
        """Check if habit is a prayer/spiritual habit (P1).

        Args:
            habit: Habit to check

        Returns:
            True if prayer/spiritual, False otherwise
        """
        return (
            habit.priority == PriorityLevel.P1_CRITICAL
            and habit.category.lower() in ["prayer", "spiritual", "meditation"]
        )

    def parse_recurrence(self, rrule: str, target_date: date) -> bool:
        """Check if habit recurrence rule applies to a date.

        Args:
            rrule: iCalendar RRULE string (e.g., "FREQ=DAILY")
            target_date: Date to check

        Returns:
            True if habit occurs on this date, False otherwise
        """
        try:
            if not rrule or rrule == "FREQ=DAILY":
                return True

            # Parse RRULE
            rule = rrulestr(rrule, dtstart=datetime.combine(target_date, time(9, 0)))

            # Check if target_date is in the recurrence
            occurrences = list(rule.between(
                datetime.combine(target_date, time.min),
                datetime.combine(target_date, time.max)
            ))

            return len(occurrences) > 0

        except Exception as e:
            logger.warning("Failed to parse RRULE", rrule=rrule, error=str(e))
            return True  # Default to True if parsing fails

    def _occurs_on_date(self, habit: HabitInput, target_date: date) -> bool:
        """Check if habit occurs on a specific date.

        Args:
            habit: Habit to check
            target_date: Date to check

        Returns:
            True if habit occurs on date, False otherwise
        """
        return self.parse_recurrence(habit.recurrence_rule, target_date)

    def _remove_used_slot(self, slots: List[TimeSlot], used_slot: TimeSlot) -> List[TimeSlot]:
        """Remove/split free slots after using one.

        Args:
            slots: Available slots
            used_slot: Slot that was used

        Returns:
            Updated list of available slots
        """
        remaining = []

        for slot in slots:
            # Slot completely before used
            if slot.end <= used_slot.start:
                remaining.append(slot)
            # Slot completely after used
            elif slot.start >= used_slot.end:
                remaining.append(slot)
            # Slot overlaps - split it
            else:
                if slot.start < used_slot.start:
                    remaining.append(TimeSlot(
                        start=slot.start,
                        end=used_slot.start,
                        duration_mins=int((used_slot.start - slot.start).total_seconds() / 60)
                    ))
                if slot.end > used_slot.end:
                    remaining.append(TimeSlot(
                        start=used_slot.end,
                        end=slot.end,
                        duration_mins=int((slot.end - used_slot.end).total_seconds() / 60)
                    ))

        return remaining
