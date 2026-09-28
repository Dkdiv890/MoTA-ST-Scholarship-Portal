from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class StudentDocumentBase(BaseModel):
    document_type: str
    original_filename: str
    verification_status: str = "Pending"
    expiry_date: Optional[str] = None

class StudentDocumentResponse(StudentDocumentBase):
    id: int
    student_profile_id: int
    file_path: str
    mime_type: str
    rejection_reason: Optional[str] = None
    uploaded_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class StudentProfileBase(BaseModel):
    full_name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None

    # ST Details
    tribe: Optional[str] = None
    st_certificate_number: Optional[str] = None
    st_issuing_authority: Optional[str] = None
    st_issue_date: Optional[str] = None

    # Academic Details
    institution_name: Optional[str] = None
    institution_type: Optional[str] = None
    course: Optional[str] = None
    program: Optional[str] = None
    qualification: Optional[str] = None
    academic_year: Optional[str] = None
    roll_number: Optional[str] = None
    masters_percentage: Optional[float] = None

    # Financial Details
    annual_income_inr: Optional[float] = None
    income_cert_number: Optional[str] = None
    income_cert_validity: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None

    tribe: Optional[str] = None
    st_certificate_number: Optional[str] = None
    st_issuing_authority: Optional[str] = None
    st_issue_date: Optional[str] = None

    institution_name: Optional[str] = None
    institution_type: Optional[str] = None
    course: Optional[str] = None
    program: Optional[str] = None
    qualification: Optional[str] = None
    academic_year: Optional[str] = None
    roll_number: Optional[str] = None
    masters_percentage: Optional[float] = None

    annual_income_inr: Optional[float] = None
    income_cert_number: Optional[str] = None
    income_cert_validity: Optional[str] = None

class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int
    student_id: str
    st_verification_status: str
    academic_verification_status: str
    income_verification_status: str
    profile_completion_pct: int
    overall_verification_status: str
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    documents: List[StudentDocumentResponse] = []

    class Config:
        from_attributes = True
