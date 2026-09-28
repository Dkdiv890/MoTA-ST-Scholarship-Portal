from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class DigiLockerVerification(Base):
    __tablename__ = "digilocker_verifications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    mode = Column(String(50), default="demo", nullable=False)  # 'demo' or 'production'
    
    # Status: 'RECORD_FOUND' (Branch A), 'RECORD_NOT_FOUND' / 'SERVICE_UNAVAILABLE' / 'TIMEOUT' (Branch B Fallback)
    status = Column(String(50), nullable=False)
    auth_code = Column(String(255), nullable=True)
    transaction_id = Column(String(255), nullable=False)
    issuer_name = Column(String(255), default="National Academic Depository (NAD)", nullable=False)
    
    # Trusted payload retrieved from DigiLocker/NAD
    verified_records = Column(JSON, nullable=True)
    fallback_reason = Column(Text, nullable=True)
    consent_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="digilocker_verification")

class AIVerification(Base):
    __tablename__ = "ai_verifications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    
    document_type = Column(String(100), nullable=False)
    document_path = Column(String(500), nullable=False)
    ocr_extracted_text = Column(Text, nullable=True)
    
    # Structured extracted entities:
    # {"candidate_name": "...", "institution": "...", "roll_number": "...", "percentage": 78.5, "tribe": "Santhal", "date": "..."}
    parsed_fields = Column(JSON, nullable=True)
    
    # Similarity metrics:
    # {"name_similarity": 96.5, "institution_match": true, "tribe_match": true}
    match_scores = Column(JSON, nullable=True)
    
    # Advisory flags (NEVER autonomous decisions):
    # [{"severity": "HIGH", "code": "NAME_MISMATCH", "message": "...", "evidence": "..."}]
    quality_flags = Column(JSON, nullable=True)
    
    cross_document_matches = Column(JSON, nullable=True)
    overall_confidence = Column(Float, default=0.9, nullable=False)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="ai_verifications")
