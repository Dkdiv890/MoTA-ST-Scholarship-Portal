from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class DigiLockerConsentRequest(BaseModel):
    application_id: str
    consent_given: bool = True
    simulate_branch: str = "BRANCH_A"  # "BRANCH_A" (Record Found) or "BRANCH_B" (Fallback / Record Not Found)

class DigiLockerCallbackRequest(BaseModel):
    code: str
    state: str

class DigiLockerVerificationResponse(BaseModel):
    id: int
    application_id: int
    mode: str
    status: str
    auth_code: Optional[str] = None
    transaction_id: str
    issuer_name: str
    verified_records: Optional[Dict[str, Any]] = None
    fallback_reason: Optional[str] = None
    consent_timestamp: datetime

    class Config:
        from_attributes = True

class AIFlag(BaseModel):
    severity: str  # HIGH, MEDIUM, LOW
    code: str
    message: str
    evidence: Optional[str] = None

class AIVerificationResponse(BaseModel):
    id: int
    application_id: int
    document_type: str
    document_path: str
    parsed_fields: Optional[Dict[str, Any]] = None
    match_scores: Optional[Dict[str, Any]] = None
    quality_flags: Optional[List[Dict[str, Any]]] = None
    cross_document_matches: Optional[Dict[str, Any]] = None
    overall_confidence: float
    processed_at: datetime

    class Config:
        from_attributes = True

class OfficerReviewCreate(BaseModel):
    decision: str  # 'Verify', 'Mark Deficient', 'Recommend Approval', 'Reject'
    remarks: str
    deficiency_document_type: Optional[str] = None
    deficiency_description: Optional[str] = None

class DeficiencyResponse(BaseModel):
    id: int
    application_id: int
    document_type: str
    issue_description: str
    status: str
    raised_at: datetime
    resolved_at: Optional[datetime] = None
    resubmission_remarks: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    actor_email: Optional[str] = None
    actor_role: str
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    category: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
