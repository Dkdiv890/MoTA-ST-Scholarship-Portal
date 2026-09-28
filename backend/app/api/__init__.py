from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.student import router as student_router
from app.api.schemes import router as schemes_router
from app.api.applications import router as applications_router
from app.api.digilocker import router as digilocker_router
from app.api.officer import router as officer_router
from app.api.admin import router as admin_router
from app.api.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(student_router)
api_router.include_router(schemes_router)
api_router.include_router(applications_router)
api_router.include_router(digilocker_router)
api_router.include_router(officer_router)
api_router.include_router(admin_router)
api_router.include_router(analytics_router)
