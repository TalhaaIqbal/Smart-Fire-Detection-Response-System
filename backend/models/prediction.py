from pydantic import BaseModel

class SensorPayload(BaseModel):
    smoke: float
    flame: int
    temperature: float
    humidity: float


class PredictionResponse(BaseModel):
    label: str
    label_id: int
    confidence: float
    input: SensorPayload