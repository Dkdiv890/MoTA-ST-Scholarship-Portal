from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class CriterionCheck(BaseModel):
    criterion: str
    passed: bool
    detail: str
    field: Optional[str] = None
    expected: Optional[str] = None
    actual: Optional[Any] = None

class EligibilityCheckResponse(BaseModel):
    scheme_code: str
    scheme_name: str
    is_eligible: bool
    summary: str
    criteria: List[CriterionCheck]

class ApplicationDocumentResponse(BaseModel):
    id: int
    application_id: int
    document_type: str
    file_path: str
    original_filename: str
    is_present: bool
    verification_status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    scheme_code: str  # NFST or NOS
    scheme_specific_data: Optional[Dict[str, Any]] = None

class ApplicationResponse(BaseModel):
    id: int
    application_id: str
    student_profile_id: int
    scheme_id: int
    scheme_code: Optional[str] = None
    scheme_name: Optional[str] = None
    current_stage: str
    application_status: str
    scheme_specific_data: Optional[Dict[str, Any]] = None
    academic_institution: Optional[str] = None
    course: Optional[str] = None
    annual_family_income_inr: Optional[float] = None
    masters_percentage: Optional[float] = None
    submitted_at: datetime
    updated_at: datetime
    documents: List[ApplicationDocumentResponse] = []

    class Config:
        from_attributes = True

class ApplicationDetailResponse(ApplicationResponse):
    student_name: Optional[str] = None
    student_id_code: Optional[str] = None
    tribe: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    eligibility_result: Optional[Dict[str, Any]] = None
    digilocker_verification: Optional[Dict[str, Any]] = None
    ai_verifications: List[Dict[str, Any]] = []
    officer_reviews: List[Dict[str, Any]] = []
    deficiencies: List[Dict[str, Any]] = []
