import os
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
ALERT_TO_EMAIL = os.getenv("ALERT_TO_EMAIL")

LAST_ALERT_TIME = 0
ALERT_COOLDOWN_SECONDS = 60


def send_fire_alert(prediction_result):
    global LAST_ALERT_TIME

    current_time = time.time()

    if current_time - LAST_ALERT_TIME < ALERT_COOLDOWN_SECONDS:
        print("[ALERT] Skipped: cooldown active")
        return {
            "sent": False,
            "provider": "Gmail SMTP",
            "reason": "Cooldown active"
        }

    if not GMAIL_USER or not GMAIL_APP_PASSWORD or not ALERT_TO_EMAIL:
        print("[ALERT] Skipped: Gmail environment variables missing")
        return {
            "sent": False,
            "provider": "Gmail SMTP",
            "reason": "Missing Gmail configuration"
        }

    subject = "🔥 Fire Alert: Smart Building Fire Detection System"

    html_content = f"""
    <html>
      <body>
        <h2>🔥 Fire Detected</h2>
        <p>The Smart Fire Detection System classified the current situation as <b>FIRE</b>.</p>

        <h3>Sensor Readings</h3>
        <ul>
          <li><b>Smoke:</b> {prediction_result.input.smoke}</li>
          <li><b>Flame:</b> {prediction_result.input.flame}</li>
          <li><b>Temperature:</b> {prediction_result.input.temperature} °C</li>
          <li><b>Humidity:</b> {prediction_result.input.humidity}%</li>
          <li><b>Confidence:</b> {prediction_result.confidence * 100:.1f}%</li>
        </ul>

        <p><b>Action Required:</b> Please check the building area immediately.</p>
      </body>
    </html>
    """

    message = MIMEMultipart("alternative")
    message["From"] = GMAIL_USER
    message["To"] = ALERT_TO_EMAIL
    message["Subject"] = subject

    message.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, ALERT_TO_EMAIL, message.as_string())

        LAST_ALERT_TIME = current_time

        print("[ALERT] Fire email sent using Gmail SMTP")

        return {
            "sent": True,
            "provider": "Gmail SMTP"
        }

    except Exception as e:
        print(f"[ALERT ERROR] {str(e)}")
        return {
            "sent": False,
            "provider": "Gmail SMTP",
            "reason": str(e)
        }