from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, TokenPayload
from app.schemas.student import StudentProfileCreate, StudentProfileUpdate, StudentProfileResponse, StudentDocumentResponse
from app.schemas.scheme import ScholarshipSchemeCreate, ScholarshipSchemeUpdate, ScholarshipSchemeResponse, SchemeRuleResponse, SchemeDocumentResponse
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationDetailResponse, EligibilityCheckResponse, CriterionCheck
from app.schemas.verification import (
    DigiLockerConsentRequest,
    DigiLockerCallbackRequest,
    DigiLockerVerificationResponse,
    AIVerificationResponse,
    OfficerReviewCreate,
    DeficiencyResponse,
    AuditLogResponse,
    NotificationResponse,
)

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "TokenPayload",
    "StudentProfileCreate",
    "StudentProfileUpdate",
    "StudentProfileResponse",
    "StudentDocumentResponse",
    "ScholarshipSchemeCreate",
    "ScholarshipSchemeUpdate",
    "ScholarshipSchemeResponse",
    "SchemeRuleResponse",
    "SchemeDocumentResponse",
    "ApplicationCreate",
    "ApplicationResponse",
    "ApplicationDetailResponse",
    "EligibilityCheckResponse",
    "CriterionCheck",
    "DigiLockerConsentRequest",
    "DigiLockerCallbackRequest",
    "DigiLockerVerificationResponse",
    "AIVerificationResponse",
    "OfficerReviewCreate",
    "DeficiencyResponse",
    "AuditLogResponse",
    "NotificationResponse",
]
