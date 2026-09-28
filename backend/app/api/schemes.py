from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.student import StudentProfile
from app.models.scholarship import ScholarshipScheme, SchemeRule, SchemeDocument
from app.schemas.scheme import ScholarshipSchemeResponse
from app.schemas.application import EligibilityCheckResponse
from app.services.eligibility_engine import EligibilityEngine

router = APIRouter(prefix="/schemes", tags=["Scholarship Schemes & Discovery"])

@router.get("", response_model=List[ScholarshipSchemeResponse])
def list_schemes(db: Session = Depends(get_db)):
    schemes = db.query(ScholarshipScheme).filter(ScholarshipScheme.is_active == True).all()
    return [ScholarshipSchemeResponse.model_validate(s) for s in schemes]

@router.get("/discovery")
def discover_schemes_with_eligibility(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Scholarship Finder: Returns schemes with real-time evaluated eligibility for the current student profile.
    """
    schemes = db.query(ScholarshipScheme).filter(ScholarshipScheme.is_active == True).all()
    profile = None
    if current_user and current_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()

    results = []
    for s in schemes:
        eligibility = None
        if profile:
            eligibility = EligibilityEngine.evaluate(db=db, profile=profile, scheme=s)

        results.append({
            "id": s.id,
            "scheme_code": s.scheme_code,
            "name": s.name,
            "description": s.description,
            "income_ceiling_inr": s.income_ceiling_inr,
            "min_academic_percentage": s.min_academic_percentage,
            "application_deadline": s.application_deadline,
            "guidelines_url": s.guidelines_url,
            "required_documents": [d.document_type for d in s.required_documents],
            "eligibility_status": "Eligible" if (eligibility and eligibility.is_eligible) else ("Not Eligible" if eligibility else "Login to Check"),
            "eligibility_summary": eligibility.summary if eligibility else "Authenticate as student to view personalized rule calculation."
        })
    return results

@router.get("/{scheme_code}", response_model=ScholarshipSchemeResponse)
def get_scheme_by_code(scheme_code: str, db: Session = Depends(get_db)):
    scheme = db.query(ScholarshipScheme).filter(
        ScholarshipScheme.scheme_code == scheme_code.upper()
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found.")
    return ScholarshipSchemeResponse.model_validate(scheme)

@router.get("/{scheme_code}/eligibility", response_model=EligibilityCheckResponse)
def check_scheme_eligibility(
    scheme_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Eligibility check is only applicable for students.")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    scheme = db.query(ScholarshipScheme).filter(
        ScholarshipScheme.scheme_code == scheme_code.upper()
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_code}' not found.")

    return EligibilityEngine.evaluate(db=db, profile=profile, scheme=scheme)
