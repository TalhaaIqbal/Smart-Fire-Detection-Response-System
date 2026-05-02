from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import predictionRoute

app = FastAPI(
    title="Fire Detection API",
    description="API for fire detection using ThingSpeak data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictionRoute.router)

@app.get("/")
def root():
    return {"status": "Fire Detection API is running 🔥", "version": "1.0.0"}