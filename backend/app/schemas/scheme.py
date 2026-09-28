from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SchemeRuleBase(BaseModel):
    rule_code: str
    criterion_name: str
    field_to_check: str
    operator: str
    expected_value: str
    is_mandatory: bool = True
    error_message: str

class SchemeRuleResponse(SchemeRuleBase):
    id: int
    scheme_id: int

    class Config:
        from_attributes = True

class SchemeDocumentBase(BaseModel):
    document_type: str
    is_mandatory: bool = True

class SchemeDocumentResponse(SchemeDocumentBase):
    id: int
    scheme_id: int

    class Config:
        from_attributes = True

class ScholarshipSchemeBase(BaseModel):
    scheme_code: str
    name: str
    description: str
    objective: Optional[str] = None
    income_ceiling_inr: Optional[float] = None
    min_academic_percentage: float = 55.0
    application_deadline: Optional[str] = None
    is_active: bool = True
    guidelines_url: Optional[str] = None

class ScholarshipSchemeCreate(ScholarshipSchemeBase):
    pass

class ScholarshipSchemeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    income_ceiling_inr: Optional[float] = None
    min_academic_percentage: Optional[float] = None
    application_deadline: Optional[str] = None
    is_active: Optional[bool] = None
    guidelines_url: Optional[str] = None

class ScholarshipSchemeResponse(ScholarshipSchemeBase):
    id: int
    created_at: datetime
    rules: List[SchemeRuleResponse] = []
    required_documents: List[SchemeDocumentResponse] = []

    class Config:
        from_attributes = True
