"""Notification dispatch service.

Fires notification events for appointment lifecycle changes:
- booked
- confirmed
- cancelled
- reminder (24h before slot)

Current implementation:
- Console log (always, acting as the SMS/WhatsApp stand-in)
- Email via Resend when RESEND_API_KEY is set and the recipient has an email address

TODO(security): Add Twilio or a comparable SMS/WhatsApp provider for production
OTP delivery and appointment notifications. See NOTIFICATIONS.md for the plan.
"""

from __future__ import annotations

import asyncio
import logging
import os

logger = logging.getLogger(__name__)

# Resend client initialised lazily on first use.
_resend_client = None


def _get_resend():
    """Return a configured Resend client or None if the API key is absent."""
    global _resend_client
    if _resend_client is not None:
        return _resend_client

    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        logger.warning(
            "[NOTIFY] RESEND_API_KEY is not set – email notifications are disabled."
        )
        return None

    try:
        import resend  # type: ignore[import]
        resend.api_key = api_key
        _resend_client = resend
        return _resend_client
    except ImportError:
        logger.warning("[NOTIFY] resend package is not installed – email notifications disabled.")
        return None


def _log_notify(channel: str, recipient_phone: str, message: str) -> None:
    """Log a notification in the standard console format."""
    logger.info("[KHALAS NOTIFY] %s -> %s: %s", channel, recipient_phone, message)


async def _send_email(to: str, subject: str, html: str) -> None:
    """Send an email via Resend (fire-and-forget)."""
    client = _get_resend()
    if client is None:
        return
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: client.Emails.send({
                "from": "Khalas <no-reply@khalas.app>",
                "to": [to],
                "subject": subject,
                "html": html,
            }),
        )
    except Exception as exc:
        logger.warning("[NOTIFY] Email send failed: %s", exc)


async def notify_appointment_booked(appointment: dict, user: dict) -> None:
    """Fire notifications when an appointment is booked."""
    phone = user.get("phone", "unknown")
    slot = appointment.get("slot_datetime", "unknown")
    msg = f"تم حجز موعدك بنجاح في {slot}"
    _log_notify("CONSOLE", phone, msg)

    email = user.get("email")
    if email:
        await _send_email(
            to=email,
            subject="Khalas – Appointment Booked / تم الحجز",
            html=f"<p>Your appointment has been booked for <strong>{slot}</strong>.</p>"
                 f"<p>تم حجز موعدك بنجاح في <strong>{slot}</strong>.</p>",
        )


async def notify_appointment_confirmed(appointment: dict, user: dict) -> None:
    """Fire notifications when an appointment is confirmed by the provider."""
    phone = user.get("phone", "unknown")
    slot = appointment.get("slot_datetime", "unknown")
    msg = f"تم تأكيد موعدك في {slot}"
    _log_notify("CONSOLE", phone, msg)

    email = user.get("email")
    if email:
        await _send_email(
            to=email,
            subject="Khalas – Appointment Confirmed / تم تأكيد الموعد",
            html=f"<p>Your appointment on <strong>{slot}</strong> has been confirmed.</p>"
                 f"<p>تم تأكيد موعدك في <strong>{slot}</strong>.</p>",
        )


async def notify_appointment_cancelled(
    appointment: dict, user: dict, cancelled_by: str
) -> None:
    """Fire notifications when an appointment is cancelled."""
    phone = user.get("phone", "unknown")
    slot = appointment.get("slot_datetime", "unknown")
    reason = appointment.get("cancellation_reason", "")
    msg = f"تم إلغاء موعدك في {slot} بواسطة {cancelled_by}. {reason}"
    _log_notify("CONSOLE", phone, msg)

    email = user.get("email")
    if email:
        await _send_email(
            to=email,
            subject="Khalas – Appointment Cancelled / تم إلغاء الموعد",
            html=f"<p>Your appointment on <strong>{slot}</strong> has been cancelled by {cancelled_by}.</p>"
                 f"<p>تم إلغاء موعدك في <strong>{slot}</strong> بواسطة {cancelled_by}.</p>",
        )


async def notify_appointment_reminder(appointment: dict, user: dict) -> None:
    """Fire a 24-hour reminder notification."""
    phone = user.get("phone", "unknown")
    slot = appointment.get("slot_datetime", "unknown")
    msg = f"تذكير: موعدك غداً في {slot}"
    _log_notify("CONSOLE", phone, msg)

    email = user.get("email")
    if email:
        await _send_email(
            to=email,
            subject="Khalas – Appointment Reminder / تذكير بالموعد",
            html=f"<p>Reminder: your appointment is tomorrow at <strong>{slot}</strong>.</p>"
                 f"<p>تذكير: موعدك غداً في <strong>{slot}</strong>.</p>",
        )
