import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter

from models.prediction import SensorPayload, PredictionResponse
from controllers.precitionControllers import (
    predict_controller,
    latest_controller,
    webhook_controller
)


router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: SensorPayload):
    """
    Accepts sensor readings and returns a classification.

    - 0: Normal
    - 1: Warning
    - 2: Fire
    """
    return predict_controller(payload)


@router.get("/latest", response_model=PredictionResponse)
def latest():
    """
    Fetches the latest entry from ThingSpeak and runs inference on it.
    """
    return latest_controller()


@router.post("/webhook", response_model=PredictionResponse)
def webhook(data: dict):
    """
    ThingSpeak calls this endpoint automatically when new data arrives.
    """
    return webhook_controller(data)