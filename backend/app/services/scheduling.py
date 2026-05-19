"""Scheduling and slot generation helpers."""

from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status

from app.core.security import utc_now

CAIRO_TZ = ZoneInfo("Africa/Cairo")


def parse_hhmm(value: str) -> time:
    """Parse an HH:MM time string."""
    hour_str, minute_str = value.split(":")
    return time(hour=int(hour_str), minute=int(minute_str))


def cairo_today() -> date:
    """Return today's date in Cairo."""
    return utc_now().astimezone(CAIRO_TZ).date()


def parse_requested_date(value: str | None) -> date:
    """Parse an optional date query parameter in Cairo local time."""
    if value is None:
        return cairo_today()
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="date must be YYYY-MM-DD.") from exc


def cairo_date_range(start_date: date) -> tuple[date, date]:
    """Return the inclusive 7-day date window."""
    return start_date, start_date + timedelta(days=6)


def cairo_range_to_utc(start_date: date, end_date: date) -> tuple[datetime, datetime]:
    """Convert a Cairo date range into UTC boundaries."""
    start_dt = datetime.combine(start_date, time.min, tzinfo=CAIRO_TZ)
    end_dt = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=CAIRO_TZ)
    return start_dt.astimezone(UTC), end_dt.astimezone(UTC)


def slot_to_cairo_string(slot_datetime: datetime) -> str:
    """Format a slot datetime for Cairo display."""
    return slot_datetime.astimezone(CAIRO_TZ).isoformat()


def build_candidate_slots(
    *,
    start_date: date,
    days: int,
    availability_rows: list[dict],
    duration_minutes: int,
    buffer_minutes: int,
) -> list[datetime]:
    """Build candidate UTC slot starts from weekly availability."""
    now_utc = utc_now()
    slots: list[datetime] = []
    interval_minutes = duration_minutes + buffer_minutes
    if interval_minutes <= 0:
        interval_minutes = duration_minutes

    for offset in range(days):
        current_date = start_date + timedelta(days=offset)
        day_of_week = current_date.weekday()
        day_rows = [row for row in availability_rows if row["day_of_week"] == day_of_week and row["is_active"]]
        for row in day_rows:
            start_time = parse_hhmm(row["start_time"])
            end_time = parse_hhmm(row["end_time"])
            current_start = datetime.combine(current_date, start_time, tzinfo=CAIRO_TZ)
            window_end = datetime.combine(current_date, end_time, tzinfo=CAIRO_TZ)
            while current_start + timedelta(minutes=duration_minutes) <= window_end:
                current_start_utc = current_start.astimezone(UTC)
                if current_start_utc >= now_utc:
                    slots.append(current_start_utc)
                current_start += timedelta(minutes=interval_minutes)
    return slots


def slot_is_available(slot_datetime: datetime, duration_minutes: int, blocked_ranges: list[tuple[datetime, datetime]]) -> bool:
    """Check if a candidate slot overlaps with existing appointments."""
    slot_end = slot_datetime + timedelta(minutes=duration_minutes)
    return all(slot_end <= blocked_start or slot_datetime >= blocked_end for blocked_start, blocked_end in blocked_ranges)
