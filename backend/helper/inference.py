import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

import joblib
import numpy as np
from models.prediction import SensorPayload, PredictionResponse

CLASS_NAMES = ["Normal", "Warning", "Fire"]
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "fire_detection_model.pkl")

model = joblib.load(MODEL_PATH)

def run_inference(payload: SensorPayload) -> PredictionResponse:
    features = np.array([[
        payload.smoke,
        payload.flame,
        payload.temperature,
        payload.humidity
    ]])
    
    label_id = int(model.predict(features)[0])
    confidence = float(np.max(model.predict_proba(features)))

    return PredictionResponse(
        label=CLASS_NAMES[label_id],
        label_id=label_id,
        confidence=round(confidence, 4),
        input=payload
    )