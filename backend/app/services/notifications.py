"""Notification dispatch service.

Channels:
- Email via Resend   → OTP delivery (register + login)
- WhatsApp via Meta  → appointment lifecycle (booked, confirmed, cancelled, reminder)
- Console fallback   → used when API keys are absent (development / testing)

Environment variables:
    RESEND_API_KEY            — Resend API key (free tier, no domain needed for testing)
    RESEND_FROM_EMAIL         — Sender address.
                                Defaults to 'onboarding@resend.dev' (works without a
                                verified domain — use this until khalas.app is verified).
    WHATSAPP_TOKEN            — Meta permanent access token
    WHATSAPP_PHONE_NUMBER_ID  — Meta WhatsApp phone number ID

When RESEND_API_KEY is absent, OTP is printed to the console only (current behaviour).
When WHATSAPP_TOKEN is absent, appointment events are printed to the console only.
Nothing breaks if the vars are not set.
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resend_api_key() -> str | None:
    return os.getenv("RESEND_API_KEY")


def _resend_from() -> str:
    """Return the sender address.

    Falls back to the Resend shared sandbox address which works for testing
    without a verified domain — emails can only be delivered to the inbox of
    the Resend account owner in this mode.
    """
    return os.getenv("RESEND_FROM_EMAIL", "Khalas <onboarding@resend.dev>")


def _whatsapp_token() -> str | None:
    return os.getenv("WHATSAPP_TOKEN")


def _whatsapp_phone_id() -> str | None:
    return os.getenv("WHATSAPP_PHONE_NUMBER_ID")


# ---------------------------------------------------------------------------
# Email — via Resend
# ---------------------------------------------------------------------------

def _otp_email_html(name: str, otp_code: str, expires_minutes: int) -> str:
    """Bilingual OTP email body (Arabic + English)."""
    return f"""
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:#0f766e;padding:32px;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px">خلاص</h1>
            <p style="margin:4px 0 0;color:#99f6e4;font-size:13px">Khalas Booking Platform</p>
          </td>
        </tr>

        <!-- Arabic body -->
        <tr>
          <td style="padding:32px 32px 16px;text-align:right">
            <p style="margin:0 0 8px;font-size:16px;color:#1e293b">مرحباً {name}،</p>
            <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7">
              كود التحقق الخاص بك هو:
            </p>
            <div style="text-align:center;margin:0 0 24px">
              <span style="display:inline-block;background:#f0fdfa;border:2px dashed #0f766e;
                           border-radius:12px;padding:16px 40px;font-size:36px;
                           font-weight:700;letter-spacing:12px;color:#0f766e">
                {otp_code}
              </span>
            </div>
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              ينتهي الكود خلال {expires_minutes} دقيقة
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid #e2e8f0"></td></tr>

        <!-- English body -->
        <tr>
          <td style="padding:16px 32px 32px;text-align:left">
            <p style="margin:0 0 8px;font-size:15px;color:#1e293b">Hi {name},</p>
            <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7">
              Your Khalas verification code is:
            </p>
            <p style="margin:0 0 16px;text-align:center;font-size:36px;font-weight:700;
                      letter-spacing:12px;color:#0f766e">{otp_code}</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              This code expires in {expires_minutes} minutes.<br>
              If you did not request this, please ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;text-align:center">
            <p style="margin:0;font-size:11px;color:#94a3b8">
              © 2026 Khalas &mdash; خلاص | khalas.onrender.com
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def send_otp_email(
    *,
    to_email: str,
    name: str,
    otp_code: str,
    expires_minutes: int = 10,
) -> None:
    """Send an OTP code to the user's email address via Resend.

    Falls back to console log when RESEND_API_KEY is not set so that
    development and testing work without any credentials.
    """
    api_key = _resend_api_key()
    if not api_key:
        logger.info(
            "[KHALAS OTP] email delivery skipped — RESEND_API_KEY not set. "
            "OTP for %s: %s",
            to_email,
            otp_code,
        )
        return

    payload = {
        "from": _resend_from(),
        "to": [to_email],
        "subject": f"[Khalas] كود التحقق / Verification Code: {otp_code}",
        "html": _otp_email_html(name, otp_code, expires_minutes),
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code >= 400:
                logger.warning(
                    "[NOTIFY] Resend OTP email failed: %s %s",
                    resp.status_code,
                    resp.text,
                )
            else:
                logger.info("[NOTIFY] OTP email sent to %s", to_email)
    except Exception as exc:
        logger.warning("[NOTIFY] Resend OTP email error: %s", exc)


async def send_otp_whatsapp(
    *,
    phone: str,
    otp_code: str,
    expires_minutes: int = 10,
) -> None:
    """Send an OTP code to the user's WhatsApp via Meta Cloud API."""
    token = _whatsapp_token()
    if not token:
        logger.info(
            "[KHALAS OTP] WhatsApp delivery skipped — WHATSAPP_TOKEN not set. "
            "OTP for %s: %s",
            phone,
            otp_code,
        )
        return

    # Assuming a template named 'khalas_otp_auth' with 2 parameters: OTP code, Expiry
    sent = await _send_whatsapp(
        phone=phone,
        template_name="khalas_otp_auth",
        parameters=[otp_code, str(expires_minutes)],
    )
    if not sent:
        logger.warning("[NOTIFY] WhatsApp OTP send failed to %s", phone)


async def _send_appointment_email(
    *,
    to_email: str,
    subject: str,
    html: str,
) -> None:
    """Send an appointment notification email via Resend."""
    api_key = _resend_api_key()
    if not api_key:
        return  # WhatsApp or console will handle it

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": _resend_from(),
                    "to": [to_email],
                    "subject": subject,
                    "html": html,
                },
            )
            if resp.status_code >= 400:
                logger.warning(
                    "[NOTIFY] Resend appointment email failed: %s %s",
                    resp.status_code,
                    resp.text,
                )
    except Exception as exc:
        logger.warning("[NOTIFY] Resend appointment email error: %s", exc)


# ---------------------------------------------------------------------------
# WhatsApp — via Meta Cloud API
# ---------------------------------------------------------------------------

async def _send_whatsapp(
    *,
    phone: str,
    template_name: str,
    parameters: list[str],
) -> bool:
    """Send a WhatsApp template message via Meta Cloud API.

    Returns True if the message was accepted, False otherwise.
    Falls back gracefully when credentials are absent.

    Template parameter mapping: parameters[0] → {{1}}, parameters[1] → {{2}}, etc.
    """
    token = _whatsapp_token()
    phone_id = _whatsapp_phone_id()

    if not token or not phone_id:
        return False  # Caller will log to console

    # Normalise phone: Meta requires E.164 without the leading +
    wa_phone = phone.lstrip("+")

    body = {
        "messaging_product": "whatsapp",
        "to": wa_phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "ar"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": p} for p in parameters
                    ],
                }
            ],
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://graph.facebook.com/v19.0/{phone_id}/messages",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            if resp.status_code >= 400:
                logger.warning(
                    "[NOTIFY] WhatsApp send failed (template=%s): %s %s",
                    template_name,
                    resp.status_code,
                    resp.text,
                )
                return False
            logger.info("[NOTIFY] WhatsApp sent template=%s to %s", template_name, phone)
            return True
    except Exception as exc:
        logger.warning("[NOTIFY] WhatsApp error (template=%s): %s", template_name, exc)
        return False


def _log_notify(channel: str, recipient: str, message: str) -> None:
    """Console fallback — matches current log format."""
    logger.info("[KHALAS NOTIFY] %s -> %s: %s", channel, recipient, message)


def _format_slot(slot_datetime: object) -> tuple[str, str]:
    """Return (date_str, time_str) in Cairo-friendly format."""
    try:
        from app.services.scheduling import CAIRO_TZ
        if hasattr(slot_datetime, "astimezone"):
            cairo_dt: datetime = slot_datetime.astimezone(CAIRO_TZ)
        else:
            cairo_dt = slot_datetime
        return cairo_dt.strftime("%Y-%m-%d"), cairo_dt.strftime("%H:%M")
    except Exception:
        return str(slot_datetime), ""


# ---------------------------------------------------------------------------
# Appointment notification public API
# ---------------------------------------------------------------------------

async def notify_appointment_booked(appointment: dict, user: dict) -> None:
    """Notify patient when an appointment is booked."""
    phone = user.get("phone", "")
    email = user.get("email")
    name = user.get("name_ar") or user.get("name_en") or "عزيزي العميل"
    venue_id = appointment.get("venue_id", "")
    date_str, time_str = _format_slot(appointment.get("slot_datetime"))
    channel = user.get("preferred_channel", "whatsapp")

    if channel == "whatsapp" and phone:
        sent = await _send_whatsapp(
            phone=phone,
            template_name="khalas_appointment_booked",
            parameters=[name, venue_id, date_str, time_str],
        )
        if not sent:
            msg = f"تم حجز موعدك بنجاح بتاريخ {date_str} الساعة {time_str}"
            _log_notify("CONSOLE", phone, msg)

    if channel == "email" and email:
        html = (
            f"<p>مرحباً {name}، تم حجز موعدك بنجاح بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>.</p>"
            f"<p>Hi {name}, your appointment has been booked for <strong>{date_str}</strong> at <strong>{time_str}</strong>.</p>"
        )
        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تم الحجز / Appointment Booked",
            html=html,
        )


async def notify_appointment_confirmed(appointment: dict, user: dict) -> None:
    """Notify patient when a provider confirms their appointment."""
    phone = user.get("phone", "")
    email = user.get("email")
    name = user.get("name_ar") or user.get("name_en") or "عزيزي العميل"
    venue_id = appointment.get("venue_id", "")
    date_str, time_str = _format_slot(appointment.get("slot_datetime"))
    channel = user.get("preferred_channel", "whatsapp")

    if channel == "whatsapp" and phone:
        sent = await _send_whatsapp(
            phone=phone,
            template_name="khalas_appointment_confirmed",
            parameters=[name, venue_id, date_str, time_str],
        )
        if not sent:
            msg = f"تم تأكيد موعدك بتاريخ {date_str} الساعة {time_str}"
            _log_notify("CONSOLE", phone, msg)

    if channel == "email" and email:
        html = (
            f"<p>مرحباً {name}، تم تأكيد موعدك بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>. ✅</p>"
            f"<p>Hi {name}, your appointment on <strong>{date_str}</strong> at <strong>{time_str}</strong> has been confirmed. ✅</p>"
        )
        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تم التأكيد / Appointment Confirmed ✅",
            html=html,
        )


async def notify_appointment_cancelled(
    appointment: dict, user: dict, cancelled_by: str
) -> None:
    """Notify patient when an appointment is cancelled."""
    phone = user.get("phone", "")
    email = user.get("email")
    name = user.get("name_ar") or user.get("name_en") or "عزيزي العميل"
    venue_id = appointment.get("venue_id", "")
    date_str, time_str = _format_slot(appointment.get("slot_datetime"))
    reason = appointment.get("cancellation_reason") or ""
    channel = user.get("preferred_channel", "whatsapp")

    if channel == "whatsapp" and phone:
        sent = await _send_whatsapp(
            phone=phone,
            template_name="khalas_appointment_cancelled",
            parameters=[name, venue_id, date_str, time_str],
        )
        if not sent:
            msg = f"تم إلغاء موعدك بتاريخ {date_str} الساعة {time_str} بواسطة {cancelled_by}. {reason}".strip()
            _log_notify("CONSOLE", phone, msg)

    if channel == "email" and email:
        html = (
            f"<p>مرحباً {name}، تم إلغاء موعدك بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>.</p>"
            f"<p>Hi {name}, your appointment on <strong>{date_str}</strong> at <strong>{time_str}</strong> has been cancelled by {cancelled_by}.</p>"
        )
        if reason:
            html += f"<p>السبب / Reason: {reason}</p>"
        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تم الإلغاء / Appointment Cancelled",
            html=html,
        )


async def notify_appointment_reminder(appointment: dict, user: dict) -> None:
    """Send a 24-hour reminder to the patient."""
    phone = user.get("phone", "")
    email = user.get("email")
    name = user.get("name_ar") or user.get("name_en") or "عزيزي العميل"
    venue_id = appointment.get("venue_id", "")
    date_str, time_str = _format_slot(appointment.get("slot_datetime"))
    channel = user.get("preferred_channel", "whatsapp")

    if channel == "whatsapp" and phone:
        sent = await _send_whatsapp(
            phone=phone,
            template_name="khalas_reminder_24h",
            parameters=[name, venue_id, date_str, time_str],
        )
        if not sent:
            msg = f"تذكير: موعدك غداً بتاريخ {date_str} الساعة {time_str}"
            _log_notify("CONSOLE", phone, msg)

    if channel == "email" and email:
        html = (
            f"<p>تذكير: موعدك غداً بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>.</p>"
            f"<p>Reminder: your appointment is tomorrow on <strong>{date_str}</strong> at <strong>{time_str}</strong>.</p>"
        )
        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تذكير بالموعد / Appointment Reminder",
            html=html,
        )
