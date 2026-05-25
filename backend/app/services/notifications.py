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
    ULTRAMSG_INSTANCE_ID      — UltraMsg instance ID for instant WhatsApp delivery
    ULTRAMSG_TOKEN            — UltraMsg token

When RESEND_API_KEY is absent, OTP is printed to the console only (current behaviour).
When ULTRAMSG_TOKEN is absent, appointment events are printed to the console only.
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


def _ultramsg_instance_id() -> str | None:
    return os.getenv("ULTRAMSG_INSTANCE_ID")

def _ultramsg_token() -> str | None:
    return os.getenv("ULTRAMSG_TOKEN")


# ---------------------------------------------------------------------------
# Email — via Resend
# ---------------------------------------------------------------------------

def _base_email_html(title: str, arabic_content: str, english_content: str) -> str:
    """A premium, responsive base HTML template for all Khalas emails."""
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
            {arabic_content}
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px"><hr style="border:none;border-top:1px solid #e2e8f0"></td></tr>

        <!-- English body -->
        <tr>
          <td style="padding:16px 32px 32px;text-align:left;direction:ltr">
            {english_content}
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

def _otp_email_html(name: str, otp_code: str, expires_minutes: int) -> str:
    """Bilingual OTP email body (Arabic + English)."""
    ar_content = f"""
            <p style="margin:0 0 8px;font-size:16px;color:#1e293b">مرحباً {name}،</p>
            <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7">
              كود التحقق الخاص بك هو:
            </p>
            <div style="text-align:center;margin:0 0 24px">
              <span style="display:inline-block;background:#f0fdfa;border:2px dashed #0f766e;
                           border-radius:12px;padding:16px 40px;font-size:36px;
                           font-weight:700;letter-spacing:12px;color:#0f766e;direction:ltr;">
                {otp_code}
              </span>
            </div>
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              ينتهي الكود خلال {expires_minutes} دقيقة
            </p>
    """
    
    en_content = f"""
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
    """
    return _base_email_html("Verification Code", ar_content, en_content)


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
    """Send an OTP code to the user's WhatsApp via UltraMsg."""
    token = _ultramsg_token()
    if not token:
        logger.info(
            "[KHALAS OTP] WhatsApp delivery skipped — ULTRAMSG_TOKEN not set. "
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
    """Send a WhatsApp message via UltraMsg.

    Returns True if the message was accepted, False otherwise.
    Falls back gracefully to console when credentials are absent.
    """
    instance = _ultramsg_instance_id()
    token = _ultramsg_token()

    if not instance or not token:
        return False  # Caller will log to console

    # Build the text dynamically instead of using pre-approved templates
    text = ""
    if template_name == "khalas_otp_auth":
        text = f"كود التحقق الخاص بك هو: {parameters[0]}\nينتهي خلال {parameters[1]} دقائق."
    elif template_name == "khalas_appointment_booked":
        text = f"مرحباً {parameters[0]}،\nتم حجز موعدك بنجاح بتاريخ {parameters[2]} الساعة {parameters[3]}."
    elif template_name == "khalas_appointment_confirmed":
        text = f"مرحباً {parameters[0]}،\nتم تأكيد موعدك بتاريخ {parameters[2]} الساعة {parameters[3]}."
    elif template_name == "khalas_appointment_cancelled":
        text = f"مرحباً {parameters[0]}،\nتم إلغاء موعدك بتاريخ {parameters[2]} الساعة {parameters[3]}."
    elif template_name == "khalas_reminder_24h":
        text = f"مرحباً {parameters[0]}،\nتذكير: موعدك غداً بتاريخ {parameters[2]} الساعة {parameters[3]}."
    else:
        text = "رسالة من خلاص: " + " ".join(parameters)

    # Normalise phone: UltraMsg expects standard E.164 without the +
    wa_phone = phone.lstrip("+")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://api.ultramsg.com/{instance}/messages/chat",
                data={
                    "token": token,
                    "to": wa_phone,
                    "body": text,
                },
            )
            if resp.status_code >= 400:
                logger.warning(
                    "[NOTIFY] UltraMsg send failed: %s %s",
                    resp.status_code,
                    resp.text,
                )
                return False
            logger.info("[NOTIFY] WhatsApp sent via UltraMsg to %s", phone)
            return True
    except Exception as exc:
        logger.warning("[NOTIFY] UltraMsg error: %s", exc)
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
        ar_html = f"<p style='margin:0;font-size:16px;color:#1e293b;line-height:1.7'>مرحباً {name}،<br>تم حجز موعدك بنجاح بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>.</p>"
        en_html = f"<p style='margin:0;font-size:15px;color:#1e293b;line-height:1.7'>Hi {name},<br>your appointment has been booked for <strong>{date_str}</strong> at <strong>{time_str}</strong>.</p>"
        
        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تم الحجز / Appointment Booked",
            html=_base_email_html("Appointment Booked", ar_html, en_html),
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
        ar_html = f"<p style='margin:0;font-size:16px;color:#1e293b;line-height:1.7'>مرحباً {name}،<br>تم تأكيد موعدك بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>. ✅</p>"
        en_html = f"<p style='margin:0;font-size:15px;color:#1e293b;line-height:1.7'>Hi {name},<br>your appointment on <strong>{date_str}</strong> at <strong>{time_str}</strong> has been confirmed. ✅</p>"
        
        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تم التأكيد / Appointment Confirmed ✅",
            html=_base_email_html("Appointment Confirmed", ar_html, en_html),
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
        ar_html = f"<p style='margin:0;font-size:16px;color:#1e293b;line-height:1.7'>مرحباً {name}،<br>تم إلغاء موعدك بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>.</p>"
        en_html = f"<p style='margin:0;font-size:15px;color:#1e293b;line-height:1.7'>Hi {name},<br>your appointment on <strong>{date_str}</strong> at <strong>{time_str}</strong> has been cancelled by {cancelled_by}.</p>"
        
        if reason:
            ar_html += f"<p style='margin-top:16px;font-size:14px;color:#ef4444;background:#fef2f2;padding:12px;border-radius:8px;'>السبب: {reason}</p>"
            en_html += f"<p style='margin-top:16px;font-size:14px;color:#ef4444;background:#fef2f2;padding:12px;border-radius:8px;'>Reason: {reason}</p>"

        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تم الإلغاء / Appointment Cancelled",
            html=_base_email_html("Appointment Cancelled", ar_html, en_html),
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
        ar_html = f"<p style='margin:0;font-size:16px;color:#1e293b;line-height:1.7'>تذكير: موعدك غداً بتاريخ <strong>{date_str}</strong> الساعة <strong>{time_str}</strong>.</p>"
        en_html = f"<p style='margin:0;font-size:15px;color:#1e293b;line-height:1.7'>Reminder: your appointment is tomorrow on <strong>{date_str}</strong> at <strong>{time_str}</strong>.</p>"
        
        await _send_appointment_email(
            to_email=email,
            subject="Khalas – تذكير بالموعد / Appointment Reminder",
            html=_base_email_html("Appointment Reminder", ar_html, en_html),
        )
