from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import issues, duplicates
from backend import config 

app = FastAPI(
    title="Voice2Action API",
    description="Backend for Voice2Action civic reporting platform",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(issues.router)
app.include_router(duplicates.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Voice2Action backend is running"}
