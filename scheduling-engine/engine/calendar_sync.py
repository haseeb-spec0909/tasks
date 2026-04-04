"""Calendar synchronization utilities for Google Calendar."""

from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional
import structlog
import uuid

from engine.models import ScheduledBlock, TaskInput, BlockType, CalendarEvent

logger = structlog.get_logger(__name__)


def build_gcal_event(block: ScheduledBlock, task: Optional[TaskInput] = None) -> Dict[str, Any]:
    """Create a Google Calendar event payload from a scheduled block.

    Args:
        block: Scheduled block
        task: Associated task (optional, for enrichment)

    Returns:
        GCal event dict ready for API
    """
    event = {
        "summary": _build_summary(block, task),
        "description": _build_description(block, task),
        "start": {
            "dateTime": block.slot_start.isoformat(),
            "timeZone": "UTC"
        },
        "end": {
            "dateTime": block.slot_end.isoformat(),
            "timeZone": "UTC"
        },
        "extendedProperties": {
            "private": {
                "timeintel_block_id": block.block_id,
                "timeintel_block_type": block.block_type.value,
                "timeintel_task_id": block.task_id or "",
                "timeintel_habit_id": block.habit_id or "",
                "timeintel_is_split": str(block.is_split),
                "timeintel_split_index": str(block.split_index or -1),
            }
        }
    }

    # Add transparency based on block type
    if block.block_type == BlockType.FOCUS:
        event["transparency"] = "opaque"  # Busy
    else:
        event["transparency"] = "transparent"  # Free

    return event


def diff_schedule(
    old_blocks: List[ScheduledBlock],
    new_blocks: List[ScheduledBlock]
) -> Tuple[List[ScheduledBlock], List[ScheduledBlock], List[ScheduledBlock]]:
    """Compute minimal changeset between old and new schedules.

    Args:
        old_blocks: Previous schedule
        new_blocks: New schedule

    Returns:
        Tuple of (to_create, to_update, to_delete) blocks
    """
    old_ids = {b.block_id: b for b in old_blocks}
    new_ids = {b.block_id: b for b in new_blocks}

    to_create = []
    to_update = []
    to_delete = []

    # Find creates and updates
    for block_id, new_block in new_ids.items():
        if block_id not in old_ids:
            to_create.append(new_block)
        else:
            old_block = old_ids[block_id]
            if _blocks_differ(old_block, new_block):
                to_update.append(new_block)

    # Find deletes
    for block_id, old_block in old_ids.items():
        if block_id not in new_ids:
            to_delete.append(old_block)

    return to_create, to_update, to_delete


def apply_schedule_to_calendar(
    gcal_client: Any,
    user_id: str,
    diff: Tuple[List[ScheduledBlock], List[ScheduledBlock], List[ScheduledBlock]]
) -> List[str]:
    """Apply schedule changes to Google Calendar.

    Args:
        gcal_client: Google Calendar API client
        user_id: User ID for logging
        diff: Tuple of (to_create, to_update, to_delete)

    Returns:
        List of created event IDs
    """
    to_create, to_update, to_delete = diff
    created_event_ids = []

    try:
        # Delete events
        for block in to_delete:
            if block.gcal_event_id:
                try:
                    gcal_client.events().delete(
                        calendarId="primary",
                        eventId=block.gcal_event_id
                    ).execute()
                    logger.info("Deleted calendar event", event_id=block.gcal_event_id)
                except Exception as e:
                    logger.warning("Failed to delete event", event_id=block.gcal_event_id, error=str(e))

        # Update events
        for block in to_update:
            if block.gcal_event_id:
                try:
                    event_body = build_gcal_event(block)
                    gcal_client.events().update(
                        calendarId="primary",
                        eventId=block.gcal_event_id,
                        body=event_body
                    ).execute()
                    logger.info("Updated calendar event", event_id=block.gcal_event_id)
                except Exception as e:
                    logger.warning("Failed to update event", event_id=block.gcal_event_id, error=str(e))

        # Create events
        for block in to_create:
            try:
                event_body = build_gcal_event(block)
                result = gcal_client.events().insert(
                    calendarId="primary",
                    body=event_body
                ).execute()
                event_id = result.get("id")
                block.gcal_event_id = event_id
                created_event_ids.append(event_id)
                logger.info("Created calendar event", event_id=event_id, block_id=block.block_id)
            except Exception as e:
                logger.warning("Failed to create event", block_id=block.block_id, error=str(e))

    except Exception as e:
        logger.error("Error applying schedule to calendar", user_id=user_id, error=str(e))

    return created_event_ids


def _build_summary(block: ScheduledBlock, task: Optional[TaskInput] = None) -> str:
    """Build event summary/title.

    Args:
        block: Scheduled block
        task: Associated task (optional)

    Returns:
        Event summary string
    """
    if block.block_type == BlockType.TASK and task:
        return task.title
    elif block.block_type == BlockType.FOCUS:
        return "Focus Time"
    elif block.block_type == BlockType.HABIT:
        return f"Habit: {block.habit_id}"
    return f"{block.block_type.value.upper()}"


def _build_description(block: ScheduledBlock, task: Optional[TaskInput] = None) -> str:
    """Build event description.

    Args:
        block: Scheduled block
        task: Associated task (optional)

    Returns:
        Event description string
    """
    parts = []

    parts.append(f"TimeIntel Block ID: {block.block_id}")

    if task:
        parts.append(f"Priority: {task.priority.value}")
        if task.wp_code:
            parts.append(f"Work Package: {task.wp_code}")
        if task.estimated_duration_mins:
            parts.append(f"Estimated: {task.estimated_duration_mins}m")

    if block.is_split:
        parts.append(f"Split: Part {block.split_index + 1}")

    return "\n".join(parts)


def _blocks_differ(block1: ScheduledBlock, block2: ScheduledBlock) -> bool:
    """Check if two blocks differ in meaningful ways.

    Args:
        block1: First block
        block2: Second block

    Returns:
        True if blocks differ
    """
    return (
        block1.slot_start != block2.slot_start
        or block1.slot_end != block2.slot_end
        or block1.task_id != block2.task_id
        or block1.habit_id != block2.habit_id
    )
