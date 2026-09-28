from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.user import User
from app.models.student import StudentProfile
from app.models.scholarship import ScholarshipScheme
from app.models.application import Application, ApplicationDocument
from app.models.verification import DigiLockerVerification, AIVerification
from app.models.deficiency import OfficerReview, Deficiency
from app.schemas.verification import OfficerReviewCreate
from app.schemas.application import ApplicationDetailResponse
from app.services.audit_service import log_audit_event
from app.services.notification_service import send_notification

router = APIRouter(prefix="/officer", tags=["Officer Verification & Review"])

@router.get("/dashboard")
def get_officer_dashboard_stats(
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    total = db.query(Application).count()
    under_verification = db.query(Application).filter(Application.application_status == "Under Verification").count()
    submitted = db.query(Application).filter(Application.application_status == "Submitted").count()
    deficient = db.query(Application).filter(Application.application_status == "Deficiency Raised").count()
    approved = db.query(Application).filter(Application.application_status.in_(["Approved", "Verified"])).count()
    rejected = db.query(Application).filter(Application.application_status == "Rejected").count()

    nfst_scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NFST").first()
    nos_scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NOS").first()

    nfst_count = db.query(Application).filter(Application.scheme_id == nfst_scheme.id).count() if nfst_scheme else 0
    nos_count = db.query(Application).filter(Application.scheme_id == nos_scheme.id).count() if nos_scheme else 0

    return {
        "metrics": {
            "total_applications": total,
            "pending_scrutiny": under_verification + submitted,
            "under_verification": under_verification,
            "deficient_cases": deficient,
            "approved_applications": approved,
            "rejected_applications": rejected,
            "nfst_count": nfst_count,
            "nos_count": nos_count
        }
    }

@router.get("/applications")
def list_applications_for_review(
    filter_status: Optional[str] = Query(None),
    scheme_code: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if filter_status:
        query = query.filter(Application.application_status == filter_status)

    if scheme_code:
        scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == scheme_code.upper()).first()
        if scheme:
            query = query.filter(Application.scheme_id == scheme.id)

    if search:
        query = query.join(StudentProfile).filter(
            or_(
                Application.application_id.ilike(f"%{search}%"),
                StudentProfile.full_name.ilike(f"%{search}%"),
                StudentProfile.student_id.ilike(f"%{search}%"),
                StudentProfile.tribe.ilike(f"%{search}%")
            )
        )

    total_records = query.count()
    applications = query.order_by(Application.submitted_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for a in applications:
        prof = a.student_profile
        ai_flag_count = sum(len(v.quality_flags or []) for v in a.ai_verifications)
        dl_status = a.digilocker_verification.status if a.digilocker_verification else "NOT_ATTEMPTED"

        items.append({
            "id": a.id,
            "application_id": a.application_id,
            "student_id": prof.student_id if prof else "N/A",
            "student_name": prof.full_name if prof else "N/A",
            "tribe": prof.tribe if prof else "N/A",
            "state": prof.state if prof else "N/A",
            "scheme_code": a.scheme.scheme_code if a.scheme else "N/A",
            "course": a.course,
            "annual_income_inr": a.annual_family_income_inr,
            "masters_percentage": a.masters_percentage,
            "current_stage": a.current_stage,
            "application_status": a.application_status,
            "digilocker_status": dl_status,
            "ai_flags_count": ai_flag_count,
            "submitted_at": a.submitted_at.isoformat()
        })

    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "items": items
    }

@router.post("/applications/{app_id}/review")
def record_officer_review(
    app_id: str,
    review_in: OfficerReviewCreate,
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Mandatory Statutory Human Review.
    Actions: 'Verify', 'Mark Deficient', 'Recommend Approval', 'Reject'.
    AI never makes this decision.
    """
    app_record = db.query(Application).filter(Application.application_id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    valid_decisions = ["Verify", "Mark Deficient", "Recommend Approval", "Reject"]
    if review_in.decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Allowed: {', '.join(valid_decisions)}")

    review_entry = OfficerReview(
        application_id=app_record.id,
        officer_id=current_user.id,
        officer_name=current_user.full_name,
        decision=review_in.decision,
        remarks=review_in.remarks
    )
    db.add(review_entry)

    if review_in.decision == "Mark Deficient":
        app_record.application_status = "Deficiency Raised"
        app_record.current_stage = "Deficient"

        doc_type = review_in.deficiency_document_type or "academic_document"
        desc = review_in.deficiency_description or review_in.remarks
        deficiency = Deficiency(
            application_id=app_record.id,
            document_type=doc_type,
            issue_description=desc,
            status="Active",
            raised_by_officer_id=current_user.id
        )
        db.add(deficiency)

        send_notification(
            db=db,
            user_id=app_record.student_profile.user_id,
            title="Action Required: Deficiency Raised",
            message=f"Deficiency raised in Application {app_id} for '{doc_type}': {desc}. Please resubmit corrected document.",
            category="deficiency",
            link=f"/student/applications/{app_id}"
        )

    elif review_in.decision == "Recommend Approval":
        app_record.application_status = "Approved"
        app_record.current_stage = "Approved"
        send_notification(
            db=db,
            user_id=app_record.student_profile.user_id,
            title="Application Approved",
            message=f"Congratulations. Your application {app_id} for {app_record.scheme.name} has been verified and approved.",
            category="application",
            link=f"/student/applications/{app_id}"
        )

    elif review_in.decision == "Reject":
        app_record.application_status = "Rejected"
        app_record.current_stage = "Rejected"
        send_notification(
            db=db,
            user_id=app_record.student_profile.user_id,
            title="Application Decision Notice",
            message=f"Application {app_id} was rejected during statutory scrutiny: {review_in.remarks}",
            category="application",
            link=f"/student/applications/{app_id}"
        )

    elif review_in.decision == "Verify":
        app_record.application_status = "Verified"
        app_record.current_stage = "Officer Review"

    db.commit()

    log_audit_event(
        db=db,
        action="OFFICER_REVIEW_DECISION",
        actor_role=current_user.role,
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="Application",
        entity_id=app_id,
        details={
            "decision": review_in.decision,
            "remarks": review_in.remarks,
            "deficiency_doc": review_in.deficiency_document_type
        }
    )

    return {"status": "SUCCESS", "decision": review_in.decision, "application_status": app_record.application_status}
