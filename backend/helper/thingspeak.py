import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

import requests
from fastapi import HTTPException

from models.prediction import SensorPayload

THINGSPEAK_CHANNEL_ID = os.getenv("THINGSPEAK_CHANNEL_ID")
THINGSPEAK_READ_KEY = os.getenv("THINGSPEAK_READ_KEY")

def fetch_latest_thingspeak_payload() -> SensorPayload:
    if not THINGSPEAK_CHANNEL_ID or not THINGSPEAK_READ_KEY:
        raise HTTPException(
            status_code=500,
            detail="ThingSpeak credentials not set in .env"
        )

    url = (
        f"https://api.thingspeak.com/channels/{THINGSPEAK_CHANNEL_ID}"
        f"/feeds/last.json?api_key={THINGSPEAK_READ_KEY}"
    )

    resp = requests.get(url, timeout=10)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"ThingSpeak error: {resp.status_code}"
        )

    feed = resp.json()

    try:
        return SensorPayload(
            smoke=float(feed["field1"] or 0),
            flame=int(float(feed["field2"] or 0)),
            temperature=float(feed["field3"] or 0),
            humidity=float(feed["field4"] or 0),
        )
    except (KeyError, TypeError, ValueError) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse ThingSpeak fields: {e}"
        )


def parse_webhook_payload(data: dict) -> SensorPayload:
    try:
        return SensorPayload(
            smoke=float(data.get("field1") or 0),
            flame=int(float(data.get("field2") or 0)),
            temperature=float(data.get("field3") or 0),
            humidity=float(data.get("field4") or 0),
        )
    except (KeyError, TypeError, ValueError) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid webhook payload: {e}"
        )