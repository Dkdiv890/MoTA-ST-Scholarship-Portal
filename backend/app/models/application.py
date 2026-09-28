from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., APP20260001
    student_profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("scholarship_schemes.id", ondelete="CASCADE"), nullable=False)
    
    # Workflow Stage Progression
    # Stages: Submitted -> Eligibility Checked -> DigiLocker Verified / Fallback -> AI Verified -> Officer Review -> Approved / Rejected / Deficient
    current_stage = Column(String(100), default="Submitted", nullable=False)
    
    # Statutory/Operational Status: Submitted, Under Verification, Deficiency Raised, Verified, Approved, Rejected
    application_status = Column(String(100), default="Submitted", nullable=False, index=True)
    
    # Scheme Specific Information (JSON)
    # NFST: { "research_topic": "...", "supervisor_name": "...", "fellowship_duration_years": 5, "admission_status": "Confirmed" }
    # NOS: { "target_country": "UK", "university_ranking": 85, "course_duration_months": 24, "visa_status": "In Progress" }
    scheme_specific_data = Column(JSON, nullable=True)

    # Snapshot of academic and financial figures at time of application
    academic_institution = Column(String(255), nullable=True)
    course = Column(String(150), nullable=True)
    annual_family_income_inr = Column(Float, nullable=True)
    masters_percentage = Column(Float, nullable=True)

    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="applications")
    scheme = relationship("ScholarshipScheme", back_populates="applications")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    eligibility_result = relationship("EligibilityResult", back_populates="application", uselist=False, cascade="all, delete-orphan")
    digilocker_verification = relationship("DigiLockerVerification", back_populates="application", uselist=False, cascade="all, delete-orphan")
    ai_verifications = relationship("AIVerification", back_populates="application", cascade="all, delete-orphan")
    officer_reviews = relationship("OfficerReview", back_populates="application", cascade="all, delete-orphan")
    deficiencies = relationship("Deficiency", back_populates="application", cascade="all, delete-orphan")

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    
    # All 7 document types supported
    document_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    is_present = Column(Boolean, default=True, nullable=False)
    verification_status = Column(String(50), default="Pending", nullable=False)  # Verified, Pending, Deficient, Needs Update
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="documents")

class EligibilityResult(Base):
    __tablename__ = "eligibility_results"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_eligible = Column(Boolean, nullable=False)
    evaluation_summary = Column(JSON, nullable=False)  # List of criteria checks with details
    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="eligibility_result")
