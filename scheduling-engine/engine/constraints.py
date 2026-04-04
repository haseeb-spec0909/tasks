"""Hard and soft constraint definitions for scheduling."""

from datetime import datetime, time
from typing import List, Dict
import structlog

from engine.models import TaskInput, TimeSlot, ScheduledBlock, CalendarEvent

logger = structlog.get_logger(__name__)


class HardConstraints:
    """Hard constraints that must be satisfied for a valid schedule."""

    @staticmethod
    def no_overlap(slot: TimeSlot, existing_events: List[CalendarEvent]) -> bool:
        """Check if slot overlaps with any existing calendar events.

        Args:
            slot: Time slot to check
            existing_events: List of existing calendar events

        Returns:
            True if no overlap, False if overlap found
        """
        for event in existing_events:
            if slot.start < event.end and slot.end > event.start:
                return False
        return True

    @staticmethod
    def within_working_hours(slot: TimeSlot, working_hours: Dict[str, str]) -> bool:
        """Check if slot is within working hours.

        Args:
            slot: Time slot to check
            working_hours: Dict with 'start' and 'end' times

        Returns:
            True if within working hours, False otherwise
        """
        if not working_hours:
            return True

        slot_start_time = slot.start.time()
        slot_end_time = slot.end.time()

        try:
            start_time = datetime.strptime(working_hours["start"], "%H:%M").time()
            end_time = datetime.strptime(working_hours["end"], "%H:%M").time()
        except (KeyError, ValueError):
            return True

        return start_time <= slot_start_time and slot_end_time <= end_time

    @staticmethod
    def after_start_date(slot: TimeSlot, task: TaskInput) -> bool:
        """Check if slot is on or after task start date.

        Args:
            slot: Time slot to check
            task: Task with optional start_date

        Returns:
            True if valid, False if before start date
        """
        if task.start_date is None:
            return True
        return slot.start.date() >= task.start_date

    @staticmethod
    def before_due_date(slot: TimeSlot, task: TaskInput) -> bool:
        """Check if slot is on or before task due date.

        Args:
            slot: Time slot to check
            task: Task with optional due_date

        Returns:
            True if valid, False if after due date
        """
        if task.due_date is None:
            return True
        return slot.end.date() <= task.due_date

    @staticmethod
    def meets_min_block(slot: TimeSlot, task: TaskInput) -> bool:
        """Check if slot meets minimum block duration.

        Args:
            slot: Time slot to check
            task: Task with min_block_mins requirement

        Returns:
            True if slot >= min_block_mins, False otherwise
        """
        return slot.duration_mins >= task.min_block_mins

    @staticmethod
    def all_satisfied(
        slot: TimeSlot,
        task: TaskInput,
        existing_events: List[CalendarEvent],
        working_hours: Dict[str, str]
    ) -> bool:
        """Check all hard constraints for a slot.

        Args:
            slot: Time slot to check
            task: Task to schedule
            existing_events: List of existing calendar events
            working_hours: Working hours for the day

        Returns:
            True if all constraints satisfied, False otherwise
        """
        return (
            HardConstraints.no_overlap(slot, existing_events)
            and HardConstraints.within_working_hours(slot, working_hours)
            and HardConstraints.after_start_date(slot, task)
            and HardConstraints.before_due_date(slot, task)
            and HardConstraints.meets_min_block(slot, task)
        )


class SoftConstraints:
    """Soft constraints that improve schedule quality (used for scoring)."""

    @staticmethod
    def urgency_score(task: TaskInput, slot: TimeSlot) -> float:
        """Score based on task urgency (proximity to due date).

        Args:
            task: Task to score
            slot: Proposed slot

        Returns:
            Score bonus (higher = more urgent)
        """
        if task.due_date is None:
            return 0.0

        days_until_due = (task.due_date - slot.end.date()).days
        if days_until_due < 0:
            return -1000.0  # Severe penalty for scheduling after due date

        if days_until_due == 0:
            return 100.0  # Very urgent
        return max(0.0, 100.0 / max(1, days_until_due))

    @staticmethod
    def morning_preference(slot: TimeSlot) -> float:
        """Bonus for scheduling in morning (before 11am).

        Args:
            slot: Time slot to score

        Returns:
            Score bonus (15 if morning, 0 otherwise)
        """
        return 20.0 if slot.start.hour < 11 else 0.0

    @staticmethod
    def focus_adjacency(slot: TimeSlot, scheduled_blocks: List[ScheduledBlock]) -> float:
        """Bonus for being adjacent to focus blocks.

        Args:
            slot: Time slot to score
            scheduled_blocks: Already scheduled blocks

        Returns:
            Score bonus (higher if adjacent to focus)
        """
        score = 0.0
        buffer_mins = 15

        for block in scheduled_blocks:
            if block.block_type.value == "focus":
                # Check if slot starts within buffer after focus ends
                time_diff = (slot.start - block.slot_end).total_seconds() / 60
                if 0 <= time_diff <= buffer_mins:
                    score += 15.0

                # Check if slot ends within buffer before focus starts
                time_diff = (block.slot_start - slot.end).total_seconds() / 60
                if 0 <= time_diff <= buffer_mins:
                    score += 15.0

        return score

    @staticmethod
    def wp_grouping(task: TaskInput, slot: TimeSlot, scheduled_blocks: List[ScheduledBlock]) -> float:
        """Bonus for grouping tasks from same work package/project.

        Args:
            task: Task with optional wp_code
            slot: Time slot to score
            scheduled_blocks: Already scheduled blocks

        Returns:
            Score bonus (10 if adjacent to same WP, 0 otherwise)
        """
        if not task.wp_code:
            return 0.0

        score = 0.0
        buffer_mins = 30

        for block in scheduled_blocks:
            # Check if adjacent block has same WP code (would need to check task details)
            time_diff = abs((slot.start - block.slot_end).total_seconds() / 60)
            if time_diff <= buffer_mins:
                score += 10.0

        return score

    @staticmethod
    def fragmentation_penalty(slot: TimeSlot, free_slots: List[TimeSlot]) -> float:
        """Penalty for creating small unusable gaps.

        Args:
            slot: Proposed slot
            free_slots: Available free slots

        Returns:
            Score penalty (negative value)
        """
        min_useful_gap = 30  # Minimum gap to be useful

        for free_slot in free_slots:
            # Check gap before proposed slot
            if free_slot.end <= slot.start:
                gap = (slot.start - free_slot.end).total_seconds() / 60
                if 0 < gap < min_useful_gap:
                    return -10.0

            # Check gap after proposed slot
            if slot.end <= free_slot.start:
                gap = (free_slot.start - slot.end).total_seconds() / 60
                if 0 < gap < min_useful_gap:
                    return -10.0

        return 0.0

    @staticmethod
    def total_score(
        task: TaskInput,
        slot: TimeSlot,
        scheduled_blocks: List[ScheduledBlock],
        free_slots: List[TimeSlot]
    ) -> float:
        """Calculate composite score for a slot.

        Args:
            task: Task to schedule
            slot: Proposed slot
            scheduled_blocks: Already scheduled blocks
            free_slots: Available free slots

        Returns:
            Total composite score
        """
        return (
            SoftConstraints.urgency_score(task, slot)
            + SoftConstraints.morning_preference(slot)
            + SoftConstraints.focus_adjacency(slot, scheduled_blocks)
            + SoftConstraints.wp_grouping(task, slot, scheduled_blocks)
            + SoftConstraints.fragmentation_penalty(slot, free_slots)
        )
