"""Core scheduling engine with constraint satisfaction algorithm."""

from datetime import datetime, date, time, timedelta
from typing import List, Dict, Tuple, Optional
import uuid
import structlog

from engine.models import (
    TaskInput, HabitInput, CalendarEvent, UserSettings,
    TimeSlot, ScheduledBlock, SchedulingResult, BlockType, PriorityLevel
)
from engine.constraints import HardConstraints, SoftConstraints
from engine.priority import sort_tasks, is_urgent
from engine.focus_time import FocusTimeManager
from engine.habit_scheduler import HabitScheduler

logger = structlog.get_logger(__name__)


class SchedulingEngine:
    """Main scheduling engine implementing constraint-satisfaction algorithm."""

    def __init__(self, user_settings: UserSettings):
        """Initialize scheduling engine.

        Args:
            user_settings: User scheduling preferences and constraints
        """
        self.settings = user_settings
        self.focus_manager = FocusTimeManager(user_settings)
        self.habit_scheduler = HabitScheduler(user_settings)
        self.buffer_mins = 5

    def schedule(
        self,
        tasks: List[TaskInput],
        habits: List[HabitInput],
        existing_events: List[CalendarEvent],
        date_range: Tuple[datetime, datetime]
    ) -> SchedulingResult:
        """Main scheduling method.

        Algorithm steps:
        1. Build free-slot map from working hours minus existing calendar events
        2. Sort tasks by priority, due date, source
        3. Schedule P1 habits first (prayer - NEVER displaced)
        4. Schedule other habits in their ideal windows
        5. Reserve focus time blocks based on weekly target
        6. For each task in priority order:
           - Find candidate free slots satisfying hard constraints
           - Score each candidate slot
           - Assign to highest-scoring slot
           - Handle task splitting if needed
           - If no valid slot: add to unschedulable list
        7. Add 5-min buffers between back-to-back blocks
        8. Return SchedulingResult

        Args:
            tasks: List of tasks to schedule
            habits: List of habits to schedule
            existing_events: List of existing calendar events
            date_range: (start_datetime, end_datetime) for scheduling window

        Returns:
            SchedulingResult with scheduled blocks and unschedulable tasks
        """
        logger.info(
            "Starting scheduling run",
            user_id=self.settings.user_id,
            task_count=len(tasks),
            habit_count=len(habits),
            event_count=len(existing_events)
        )

        start_dt, end_dt = date_range
        start_date = start_dt.date()
        end_date = end_dt.date()

        # Step 1: Build free slot map
        free_slots = self._build_free_slot_map(existing_events, start_date, end_date)
        logger.info("Built free slot map", date_count=len(free_slots))

        scheduled_blocks: List[ScheduledBlock] = []
        unschedulable_tasks: List[Dict] = []
        warnings: List[str] = []

        # Step 3-4: Schedule habits
        habit_blocks = []
        for current_date in self._date_range(start_date, end_date):
            habits_for_day = self.habit_scheduler.schedule_habits(
                habits,
                free_slots,
                current_date
            )
            habit_blocks.extend(habits_for_day)
            # Update free slots after habits
            free_slots[current_date] = self._remove_blocks_from_slots(
                free_slots[current_date],
                habits_for_day
            )

        scheduled_blocks.extend(habit_blocks)
        logger.info("Scheduled habits", habit_block_count=len(habit_blocks))

        # Step 5: Reserve focus time
        focus_daily_targets = self.focus_manager.calculate_daily_targets(start_date, end_date)
        focus_blocks = []

        for current_date, target_mins in focus_daily_targets.items():
            if current_date not in free_slots:
                continue

            focus_slots = self.focus_manager.find_focus_slots(
                free_slots[current_date],
                current_date,
                min(target_mins, self.settings.max_focus_block_mins)
            )

            if focus_slots:
                slot = focus_slots[0]
                block = ScheduledBlock(
                    block_id=f"focus_{current_date}_{uuid.uuid4().hex[:8]}",
                    block_type=BlockType.FOCUS,
                    slot_start=slot.start,
                    slot_end=slot.end,
                    score=75.0
                )
                focus_blocks.append(block)
                free_slots[current_date] = self._remove_blocks_from_slots(
                    free_slots[current_date],
                    [block]
                )

        scheduled_blocks.extend(focus_blocks)
        logger.info("Scheduled focus time", focus_block_count=len(focus_blocks))

        # Step 2: Sort tasks
        sorted_tasks = sort_tasks(tasks)
        logger.info("Sorted tasks by priority", task_count=len(sorted_tasks))

        # Step 6: Schedule tasks
        for task in sorted_tasks:
            slot = self._find_best_slot(task, free_slots, scheduled_blocks)

            if slot:
                # Check if task needs splitting
                if task.allow_split and task.estimated_duration_mins > slot.duration_mins:
                    split_blocks = self._split_task(task, free_slots, scheduled_blocks)
                    scheduled_blocks.extend(split_blocks)
                    logger.info("Split task", task_id=task.task_id, block_count=len(split_blocks))

                    # Update free slots for each day the split blocks were scheduled into
                    for split_block in split_blocks:
                        block_date = split_block.slot_start.date()
                        if block_date in free_slots:
                            free_slots[block_date] = self._remove_blocks_from_slots(
                                free_slots[block_date],
                                [split_block]
                            )
                else:
                    # Single slot
                    block = ScheduledBlock(
                        block_id=f"task_{task.task_id}_{uuid.uuid4().hex[:8]}",
                        task_id=task.task_id,
                        block_type=BlockType.TASK,
                        slot_start=slot.start,
                        slot_end=slot.end,
                        score=self._score_slot(task, slot, scheduled_blocks, free_slots)
                    )
                    scheduled_blocks.append(block)
                    free_slots[slot.start.date()] = self._remove_blocks_from_slots(
                        free_slots[slot.start.date()],
                        [block]
                    )
                    logger.info("Scheduled task", task_id=task.task_id)
            else:
                # Unschedulable
                unschedulable_tasks.append({
                    "task_id": task.task_id,
                    "title": task.title,
                    "reason": "No valid slot found within constraints",
                    "priority": task.priority.value,
                    "due_date": str(task.due_date) if task.due_date else None
                })
                logger.warning("Task unschedulable", task_id=task.task_id)

        # Step 7: Add buffers
        final_blocks = self._add_buffers(scheduled_blocks)

        result = SchedulingResult(
            user_id=self.settings.user_id,
            scheduled_blocks=final_blocks,
            unschedulable_tasks=unschedulable_tasks,
            warnings=warnings,
            scheduling_version=1,
            computed_at=datetime.utcnow()
        )

        logger.info(
            "Scheduling complete",
            scheduled_count=len(final_blocks),
            unschedulable_count=len(unschedulable_tasks)
        )

        return result

    def _build_free_slot_map(
        self,
        existing_events: List[CalendarEvent],
        start_date: date,
        end_date: date
    ) -> Dict[date, List[TimeSlot]]:
        """Build map of free time slots for each day.

        For each day in range:
        - Get working hours
        - Subtract existing calendar events
        - Return list of free TimeSlots

        Args:
            existing_events: List of calendar events
            start_date: Range start
            end_date: Range end

        Returns:
            Dict mapping date to list of free TimeSlots
        """
        free_slots = {}
        current_date = start_date

        while current_date <= end_date:
            day_name = current_date.strftime("%A").upper()
            working_hours = self.settings.working_hours.get(day_name)

            if not working_hours:
                # Non-working day
                current_date += timedelta(days=1)
                continue

            # Create full working day slot
            start_time = datetime.strptime(working_hours["start"], "%H:%M").time()
            end_time = datetime.strptime(working_hours["end"], "%H:%M").time()

            day_start = datetime.combine(current_date, start_time)
            day_end = datetime.combine(current_date, end_time)

            slots = [TimeSlot(
                start=day_start,
                end=day_end,
                duration_mins=int((day_end - day_start).total_seconds() / 60)
            )]

            # Remove events from slots
            day_events = [
                e for e in existing_events
                if e.start.date() == current_date
            ]

            for event in sorted(day_events, key=lambda e: e.start):
                new_slots = []
                for slot in slots:
                    if event.end <= slot.start or event.start >= slot.end:
                        # No overlap
                        new_slots.append(slot)
                    else:
                        # Overlap - split slot
                        if event.start > slot.start:
                            new_slots.append(TimeSlot(
                                start=slot.start,
                                end=event.start,
                                duration_mins=int((event.start - slot.start).total_seconds() / 60)
                            ))
                        if event.end < slot.end:
                            new_slots.append(TimeSlot(
                                start=event.end,
                                end=slot.end,
                                duration_mins=int((slot.end - event.end).total_seconds() / 60)
                            ))
                slots = new_slots

            free_slots[current_date] = slots
            current_date += timedelta(days=1)

        return free_slots

    def _find_best_slot(
        self,
        task: TaskInput,
        free_slots: Dict[date, List[TimeSlot]],
        scheduled_blocks: List[ScheduledBlock]
    ) -> Optional[TimeSlot]:
        """Find optimal slot for a task.

        Algorithm:
        1. Collect all free slots in range that satisfy hard constraints
        2. Score each candidate slot
        3. Return highest-scoring slot

        Args:
            task: Task to schedule
            free_slots: Available free slots by date
            scheduled_blocks: Already scheduled blocks

        Returns:
            Best TimeSlot or None if no valid slot
        """
        candidates = []

        for current_date in sorted(free_slots.keys()):
            # Check date constraints
            if task.start_date and current_date < task.start_date:
                continue
            if task.due_date and current_date > task.due_date:
                continue

            working_hours = self.settings.working_hours.get(
                current_date.strftime("%A").upper()
            )
            if not working_hours:
                continue

            for slot in free_slots[current_date]:
                # Check hard constraints
                if not HardConstraints.all_satisfied(
                    slot,
                    task,
                    [],  # existing_events already removed from free_slots
                    working_hours
                ):
                    continue

                # Score this slot
                score = self._score_slot(task, slot, scheduled_blocks, free_slots)
                candidates.append((score, slot))

        if not candidates:
            return None

        # Sort by score descending
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    def _score_slot(
        self,
        task: TaskInput,
        slot: TimeSlot,
        scheduled_blocks: List[ScheduledBlock],
        free_slots: Dict[date, List[TimeSlot]]
    ) -> float:
        """Score a candidate slot for a task.

        Components:
        - urgency_bonus: 100 * (1 / max(1, days_until_due))
        - morning_bonus: 20 if before 11am
        - focus_adjacency: 15 if adjacent to focus block
        - wp_grouping: 10 if same WP as adjacent block
        - fragmentation_penalty: -10 if creates gap < 30 mins

        Args:
            task: Task to score
            slot: Candidate slot
            scheduled_blocks: Already scheduled blocks
            free_slots: Available free slots

        Returns:
            Composite score
        """
        return SoftConstraints.total_score(
            task,
            slot,
            scheduled_blocks,
            free_slots.get(slot.start.date(), [])
        )

    def _split_task(
        self,
        task: TaskInput,
        free_slots: Dict[date, List[TimeSlot]],
        scheduled_blocks: List[ScheduledBlock]
    ) -> List[ScheduledBlock]:
        """Split a task across multiple slots/days.

        Respects min_block_mins per segment.

        Args:
            task: Task to split
            free_slots: Available free slots
            scheduled_blocks: Already scheduled blocks

        Returns:
            List of ScheduledBlock segments
        """
        blocks = []
        remaining_mins = task.estimated_duration_mins
        split_index = 0

        for current_date in sorted(free_slots.keys()):
            if remaining_mins <= 0:
                break

            for slot in free_slots[current_date]:
                if remaining_mins <= 0:
                    break

                if slot.duration_mins < task.min_block_mins:
                    continue

                # Use this slot
                segment_duration = min(slot.duration_mins, remaining_mins)
                block = ScheduledBlock(
                    block_id=f"task_{task.task_id}_split_{split_index}",
                    task_id=task.task_id,
                    block_type=BlockType.TASK,
                    slot_start=slot.start,
                    slot_end=slot.start + timedelta(minutes=segment_duration),
                    is_split=True,
                    split_index=split_index,
                    score=self._score_slot(task, slot, scheduled_blocks, free_slots)
                )
                blocks.append(block)
                remaining_mins -= segment_duration
                split_index += 1

        return blocks

    def _add_buffers(self, blocks: List[ScheduledBlock]) -> List[ScheduledBlock]:
        """Add 5-minute buffers between back-to-back blocks.

        Args:
            blocks: Scheduled blocks (may be in any order)

        Returns:
            Blocks with buffers applied (reordered by time)
        """
        # Sort by start time
        sorted_blocks = sorted(blocks, key=lambda b: b.slot_start)

        # Group blocks by date
        blocks_by_date: Dict[date, List[ScheduledBlock]] = {}
        for block in sorted_blocks:
            block_date = block.slot_start.date()
            if block_date not in blocks_by_date:
                blocks_by_date[block_date] = []
            blocks_by_date[block_date].append(block)

        # For each day, process consecutive blocks and add buffers
        buffered_blocks = []
        for day_blocks in blocks_by_date.values():
            # Sort blocks for this day by start time
            day_blocks.sort(key=lambda b: b.slot_start)

            for i in range(len(day_blocks) - 1):
                current_block = day_blocks[i]
                next_block = day_blocks[i + 1]

                # Check if both blocks are on the same day
                if current_block.slot_end.date() == next_block.slot_start.date():
                    # Calculate gap between end of current and start of next
                    gap_mins = int((next_block.slot_start - current_block.slot_end).total_seconds() / 60)

                    # If gap is less than 5 minutes, shift next block forward
                    if 0 < gap_mins < self.buffer_mins:
                        shift_mins = self.buffer_mins - gap_mins
                        next_block.slot_start = next_block.slot_start + timedelta(minutes=shift_mins)
                        next_block.slot_end = next_block.slot_end + timedelta(minutes=shift_mins)

            buffered_blocks.extend(day_blocks)

        return buffered_blocks

    def _remove_blocks_from_slots(
        self,
        slots: List[TimeSlot],
        blocks: List[ScheduledBlock]
    ) -> List[TimeSlot]:
        """Remove scheduled blocks from available slots.

        Args:
            slots: Available free slots
            blocks: Scheduled blocks to remove

        Returns:
            Updated list of free slots
        """
        remaining_slots = slots.copy()

        for block in blocks:
            block_slot = TimeSlot(
                start=block.slot_start,
                end=block.slot_end,
                duration_mins=int((block.slot_end - block.slot_start).total_seconds() / 60)
            )

            new_slots = []
            for slot in remaining_slots:
                if slot.end <= block_slot.start or slot.start >= block_slot.end:
                    # No overlap
                    new_slots.append(slot)
                else:
                    # Split slot
                    if slot.start < block_slot.start:
                        new_slots.append(TimeSlot(
                            start=slot.start,
                            end=block_slot.start,
                            duration_mins=int((block_slot.start - slot.start).total_seconds() / 60)
                        ))
                    if slot.end > block_slot.end:
                        new_slots.append(TimeSlot(
                            start=block_slot.end,
                            end=slot.end,
                            duration_mins=int((slot.end - block_slot.end).total_seconds() / 60)
                        ))

            remaining_slots = new_slots

        return remaining_slots

    def _date_range(self, start: date, end: date):
        """Generate date range.

        Args:
            start: Start date
            end: End date

        Yields:
            Each date in range
        """
        current = start
        while current <= end:
            yield current
            current += timedelta(days=1)

    def reschedule_single(
        self,
        task_id: str,
        tasks: List[TaskInput],
        habits: List[HabitInput],
        events: List[CalendarEvent],
        settings: UserSettings
    ) -> SchedulingResult:
        """Reschedule a single task (partial re-run).

        Args:
            task_id: Task to reschedule
            tasks: All tasks
            habits: All habits
            events: Calendar events
            settings: User settings

        Returns:
            Updated SchedulingResult
        """
        logger.info("Rescheduling single task", task_id=task_id)

        # Find the task
        task = next((t for t in tasks if t.task_id == task_id), None)
        if not task:
            return SchedulingResult(
                user_id=settings.user_id,
                unschedulable_tasks=[{"task_id": task_id, "reason": "Task not found"}]
            )

        # Re-run full schedule
        start_dt = datetime.combine(date.today(), time.min)
        end_dt = start_dt + timedelta(days=settings.scheduling_horizon_days)

        return self.schedule(tasks, habits, events, (start_dt, end_dt))
