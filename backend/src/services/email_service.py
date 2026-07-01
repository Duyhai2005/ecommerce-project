from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from html import escape
from urllib.parse import urlencode

from src.core.config import settings


logger = logging.getLogger("shepoo.email")


def _clean(value: str | None) -> str:
    return value.strip() if value else ""


def _sender_email() -> str:
    return _clean(settings.smtp_from_email) or _clean(settings.smtp_username)


def smtp_configured() -> bool:
    return bool(_clean(settings.smtp_host) and _sender_email())


def email_verification_link(token: str) -> str:
    query = urlencode({"token": token})
    return f"{settings.frontend_url.rstrip('/')}/verify-email?{query}"


def send_email_verification(
    recipient_email: str,
    full_name: str,
    token: str,
) -> bool:
    if not smtp_configured():
        logger.info("email_verification_skipped reason=smtp_unconfigured recipient=%s", recipient_email)
        return False

    link = email_verification_link(token)
    sender_email = _sender_email()
    sender_name = _clean(settings.smtp_from_name)
    sender = f"{sender_name} <{sender_email}>" if sender_name else sender_email

    message = EmailMessage()
    message["Subject"] = "Xac thuc email Shepoo"
    message["From"] = sender
    message["To"] = recipient_email
    message.set_content(
        "\n".join(
            [
                f"Xin chao {full_name},",
                "",
                "Bam vao link sau de xac thuc email Shepoo:",
                link,
                "",
                "Neu ban khong tao tai khoan Shepoo, vui long bo qua email nay.",
            ]
        )
    )
    message.add_alternative(
        f"""
        <html>
          <body>
            <p>Xin chao {escape(full_name)},</p>
            <p>Bam vao nut ben duoi de xac thuc email Shepoo.</p>
            <p>
              <a href="{escape(link)}"
                 style="display:inline-block;padding:10px 16px;background:#08795b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
                Xac thuc email
              </a>
            </p>
            <p>Hoac copy link nay vao trinh duyet:</p>
            <p>{escape(link)}</p>
            <p>Neu ban khong tao tai khoan Shepoo, vui long bo qua email nay.</p>
          </body>
        </html>
        """,
        subtype="html",
    )

    try:
        with smtplib.SMTP(
            host=_clean(settings.smtp_host),
            port=settings.smtp_port,
            timeout=settings.smtp_timeout_seconds,
        ) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            username = _clean(settings.smtp_username)
            password = _clean(settings.smtp_password)
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)
    except Exception:
        logger.exception("email_verification_failed recipient=%s", recipient_email)
        return False

    logger.info("email_verification_sent recipient=%s", recipient_email)
    return True
