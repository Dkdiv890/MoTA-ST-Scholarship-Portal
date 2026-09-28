import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api import api_router
from app.seed.seed_data import seed_schemes_and_users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scholarship.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)

    db = SessionLocal()
    try:
        logger.info("Seeding initial users and scheme configurations...")
        seed_schemes_and_users(db)
    finally:
        db.close()

    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Ministry of Tribal Affairs - AI-Enabled Scholarship & Fellowship Management System (SIH Prototype)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(settings.STORAGE_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.STORAGE_DIR), name="uploads")

dataset_docs = Path(settings.DATASET_PATH) / "documents"
if dataset_docs.exists():
    app.mount("/dataset-documents", StaticFiles(directory=str(dataset_docs)), name="dataset-docs")

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "portal": "Ministry of Tribal Affairs - Scholarship Management System",
        "system_version": "1.0.0-PROTOTYPE",
        "active_schemes": ["NFST", "NOS"],
        "api_v1_docs": "/docs",
        "digilocker_mode": settings.DIGILOCKER_MODE,
        "status": "OPERATIONAL"
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY"}
