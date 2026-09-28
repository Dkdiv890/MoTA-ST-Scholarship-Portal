from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., ST-2026-000001

    # Personal Information
    full_name = Column(String(255), nullable=False)
    dob = Column(String(50), nullable=True)  # YYYY-MM-DD or DD-MM-YYYY
    gender = Column(String(20), nullable=True)  # Male, Female, Other
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    pincode = Column(String(20), nullable=True)

    # ST (Scheduled Tribe) Information
    tribe = Column(String(100), nullable=True, index=True)
    st_certificate_number = Column(String(100), nullable=True)
    st_issuing_authority = Column(String(255), nullable=True)
    st_issue_date = Column(String(50), nullable=True)
    st_verification_status = Column(String(50), default="Pending", nullable=False)  # Verified, Pending, Needs Update, Expired, Rejected

    # Academic Profile
    institution_name = Column(String(255), nullable=True, index=True)
    institution_type = Column(String(100), nullable=True)  # Central University, State University, Institute of National Importance, etc.
    course = Column(String(150), nullable=True)
    program = Column(String(150), nullable=True)
    qualification = Column(String(100), nullable=True)  # Post Graduate / Master's, M.Phil, Ph.D.
    academic_year = Column(String(50), nullable=True)
    roll_number = Column(String(100), nullable=True)
    masters_percentage = Column(Float, nullable=True)
    academic_verification_status = Column(String(50), default="Pending", nullable=False)

    # Financial Profile
    annual_income_inr = Column(Float, nullable=True)
    income_cert_number = Column(String(100), nullable=True)
    income_cert_validity = Column(String(50), nullable=True)  # YYYY-MM-DD
    income_verification_status = Column(String(50), default="Pending", nullable=False)

    # S-OTR Profile Status
    profile_completion_pct = Column(Integer, default=40, nullable=False)
    overall_verification_status = Column(String(50), default="Pending", nullable=False)  # Verified, Pending, Action Required
    last_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    documents = relationship("StudentDocument", back_populates="student_profile", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student_profile", cascade="all, delete-orphan")

class StudentDocument(Base):
    __tablename__ = "student_documents"

    id = Column(Integer, primary_key=True, index=True)
    student_profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Strictly all 7 document types supported
    document_type = Column(String(100), nullable=False)
    # Types: st_certificate, academic_document, income_certificate, admission_registration,
    # research_proposal, foreign_offer_letter, study_research_plan

    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), default="image/jpeg", nullable=False)
    
    # State: Verified, Pending, Needs Update, Expired, Rejected, Not Available
    verification_status = Column(String(50), default="Pending", nullable=False)
    rejection_reason = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expiry_date = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="documents")
