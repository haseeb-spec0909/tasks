"""Priority calculation and task sorting utilities."""

from datetime import datetime, date, timedelta
from typing import List
import structlog

from engine.models import TaskInput, PriorityLevel, SourceType

logger = structlog.get_logger(__name__)


def calculate_priority(task: TaskInput) -> str:
    """Calculate effective priority based on due date and source.

    Priority hierarchy:
    1. Due date proximity (due within 24h = P1, within 3 days = P2, etc)
    2. Explicit priority level
    3. Source (ProjectFlow elevated over Google Tasks)

    Args:
        task: Task to calculate priority for

    Returns:
        Priority level as string
    """
    today = date.today()

    # Check urgency based on due date
    if task.due_date:
        days_until_due = (task.due_date - today).days

        if days_until_due < 0:
            return PriorityLevel.P1_CRITICAL.value
        elif days_until_due == 0:
            return PriorityLevel.P1_CRITICAL.value
        elif days_until_due <= 1:
            return PriorityLevel.P2_HIGH.value
        elif days_until_due <= 3:
            return PriorityLevel.P2_HIGH.value if task.priority != PriorityLevel.P4_LOW else PriorityLevel.P3_MEDIUM.value

    # Return explicit priority if no due date urgency
    return task.priority.value


def sort_tasks(tasks: List[TaskInput]) -> List[TaskInput]:
    """Sort tasks by priority for scheduling order.

    Sort order:
    1. Priority (P1 > P2 > P3 > P4)
    2. Due date (soonest first, None last)
    3. Source (ProjectFlow first, then Google Tasks)

    Args:
        tasks: List of tasks to sort

    Returns:
        Sorted list of tasks
    """
    def sort_key(task: TaskInput):
        # Priority ranking
        priority_rank = {
            PriorityLevel.P1_CRITICAL.value: 0,
            PriorityLevel.P2_HIGH.value: 1,
            PriorityLevel.P3_MEDIUM.value: 2,
            PriorityLevel.P4_LOW.value: 3,
        }
        priority_val = priority_rank.get(task.priority.value, 4)

        # Due date (None=last)
        due_date_val = task.due_date or date.max

        # Source ranking
        source_rank = {
            SourceType.PROJECTFLOW.value: 0,
            SourceType.GOOGLE_TASKS.value: 1,
        }
        source_val = source_rank.get(task.source.value, 2)

        return (priority_val, due_date_val, source_val)

    return sorted(tasks, key=sort_key)


def is_urgent(task: TaskInput) -> bool:
    """Check if task is urgent (due within 24 hours).

    Args:
        task: Task to check

    Returns:
        True if due within 24 hours, False otherwise
    """
    if task.due_date is None:
        return False

    today = date.today()
    days_until_due = (task.due_date - today).days

    return days_until_due <= 0


def is_at_risk(task: TaskInput, days_threshold: int = 3) -> bool:
    """Check if task is at risk of missing deadline.

    A task is at-risk if:
    - Due within threshold days
    - Not yet completed

    Args:
        task: Task to check
        days_threshold: How many days to consider at-risk

    Returns:
        True if at risk, False otherwise
    """
    if task.due_date is None:
        return False

    if task.status == "completed":
        return False

    today = date.today()
    days_until_due = (task.due_date - today).days

    return 0 <= days_until_due <= days_threshold
