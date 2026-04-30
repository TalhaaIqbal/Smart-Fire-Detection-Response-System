import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.prediction import SensorPayload, PredictionResponse
from helper.inference import run_inference
from helper.thingspeak import (
    fetch_latest_thingspeak_payload,
    parse_webhook_payload
)


def predict_controller(payload: SensorPayload) -> PredictionResponse:
    return run_inference(payload)


def latest_controller() -> PredictionResponse:
    payload = fetch_latest_thingspeak_payload()
    return run_inference(payload)


def webhook_controller(data: dict) -> PredictionResponse:
    payload = parse_webhook_payload(data)
    result = run_inference(payload)

    print(f"[WEBHOOK] → {result.label} ({result.confidence * 100:.1f}%)")

    return result