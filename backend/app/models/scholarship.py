from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class ScholarshipScheme(Base):
    __tablename__ = "scholarship_schemes"

    id = Column(Integer, primary_key=True, index=True)
    scheme_code = Column(String(50), unique=True, index=True, nullable=False)  # NFST, NOS
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    objective = Column(Text, nullable=True)
    income_ceiling_inr = Column(Float, nullable=True)  # e.g., 600000.0 (Configurable prototype rule)
    min_academic_percentage = Column(Float, default=55.0, nullable=False)
    application_deadline = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    guidelines_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    rules = relationship("SchemeRule", back_populates="scheme", cascade="all, delete-orphan")
    required_documents = relationship("SchemeDocument", back_populates="scheme", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="scheme")

class SchemeRule(Base):
    __tablename__ = "scheme_rules"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("scholarship_schemes.id", ondelete="CASCADE"), nullable=False)
    rule_code = Column(String(100), nullable=False)  # e.g., ST_COMMUNITY_REQ, INCOME_LIMIT_REQ, ACADEMIC_MIN_SCORE
    criterion_name = Column(String(255), nullable=False)
    field_to_check = Column(String(100), nullable=False)  # e.g., tribe, annual_income_inr, masters_percentage
    operator = Column(String(20), nullable=False)  # '==', '<=', '>=', 'in', 'is_not_null'
    expected_value = Column(String(255), nullable=False)  # e.g. "600000", "55.0", "ST"
    is_mandatory = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=False)

    # Relationships
    scheme = relationship("ScholarshipScheme", back_populates="rules")

class SchemeDocument(Base):
    __tablename__ = "scheme_documents"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("scholarship_schemes.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False)
    # Types: st_certificate, academic_document, income_certificate, admission_registration,
    # research_proposal, foreign_offer_letter, study_research_plan
    is_mandatory = Column(Boolean, default=True, nullable=False)

    # Relationships
    scheme = relationship("ScholarshipScheme", back_populates="required_documents")
