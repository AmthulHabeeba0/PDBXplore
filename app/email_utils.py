import smtplib
import os
import logging
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
    raise RuntimeError("EMAIL_ADDRESS and EMAIL_PASSWORD must be configured")

def send_otp_email(to_email: str, otp: str):
    msg = MIMEText(f"Your PDBXplore verification OTP is: {otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.")
    msg["Subject"] = "PDBXplore — Email Verification"
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")