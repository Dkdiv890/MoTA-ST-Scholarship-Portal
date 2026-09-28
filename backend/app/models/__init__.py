from app.core.database import Base
from app.models.user import User
from app.models.student import StudentProfile, StudentDocument
from app.models.scholarship import ScholarshipScheme, SchemeRule, SchemeDocument
from app.models.application import Application, ApplicationDocument, EligibilityResult
from app.models.verification import DigiLockerVerification, AIVerification
from app.models.deficiency import OfficerReview, Deficiency
from app.models.audit import AuditLog, Notification

__all__ = [
    "Base",
    "User",
    "StudentProfile",
    "StudentDocument",
    "ScholarshipScheme",
    "SchemeRule",
    "SchemeDocument",
    "Application",
    "ApplicationDocument",
    "EligibilityResult",
    "DigiLockerVerification",
    "AIVerification",
    "OfficerReview",
    "Deficiency",
    "AuditLog",
    "Notification",
]
