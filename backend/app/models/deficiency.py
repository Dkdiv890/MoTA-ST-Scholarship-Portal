from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class OfficerReview(Base):
    __tablename__ = "officer_reviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    officer_name = Column(String(255), nullable=False)
    
    # Decisions: 'Verify', 'Mark Deficient', 'Recommend Approval', 'Reject'
    decision = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="officer_reviews")

class Deficiency(Base):
    __tablename__ = "deficiencies"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    
    # Specific document that failed verification
    document_type = Column(String(100), nullable=False)
    issue_description = Column(Text, nullable=False)
    
    # Status: 'Active', 'Resolved'
    status = Column(String(50), default="Active", nullable=False)
    raised_by_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    raised_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Targeted resubmission tracking
    resolved_at = Column(DateTime, nullable=True)
    resubmitted_file_path = Column(String(500), nullable=True)
    resubmission_remarks = Column(Text, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="deficiencies")
