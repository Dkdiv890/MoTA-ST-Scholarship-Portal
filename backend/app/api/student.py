import os
import shutil
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.user import User
from app.models.student import StudentProfile, StudentDocument
from app.models.application import Application
from app.models.audit import Notification
from app.schemas.student import StudentProfileResponse, StudentProfileUpdate, StudentDocumentResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/student", tags=["Student S-OTR & Profile"])

@router.get("/profile", response_model=StudentProfileResponse)
def get_my_profile(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return StudentProfileResponse.model_validate(profile)

@router.put("/profile", response_model=StudentProfileResponse)
def update_profile(
    update_data: StudentProfileUpdate,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    data = update_data.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(profile, field, val)

    # Recalculate completion percentage
    filled_fields = 0
    total_fields = 12
    check_attrs = [
        profile.full_name, profile.dob, profile.gender, profile.phone,
        profile.state, profile.district, profile.tribe, profile.st_certificate_number,
        profile.institution_name, profile.course, profile.masters_percentage,
        profile.annual_income_inr
    ]
    for attr in check_attrs:
        if attr is not None and str(attr).strip() != "":
            filled_fields += 1

    profile.profile_completion_pct = int((filled_fields / total_fields) * 100)
    db.commit()
    db.refresh(profile)

    log_audit_event(
        db=db,
        action="S_OTR_PROFILE_UPDATED",
        actor_role="student",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="StudentProfile",
        entity_id=profile.student_id,
        details={"completion_pct": profile.profile_completion_pct}
    )

    return StudentProfileResponse.model_validate(profile)

@router.post("/documents/upload", response_model=StudentDocumentResponse)
def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    expiry_date: str = Form(None),
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    # Validation: 7 strict document types
    allowed_types = [
        "st_certificate",
        "academic_document",
        "income_certificate",
        "admission_registration",
        "research_proposal",
        "foreign_offer_letter",
        "study_research_plan"
    ]
    if document_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Allowed: {', '.join(allowed_types)}")

    # Ensure storage folder
    upload_dir = Path(settings.STORAGE_DIR) / profile.student_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".pdf"]:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and PDF files are accepted.")

    saved_filename = f"{document_type}_{int(datetime.now().timestamp())}{file_ext}"
    dest_path = upload_dir / saved_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(dest_path)

    # Check if existing document of this type exists
    existing = db.query(StudentDocument).filter(
        StudentDocument.student_profile_id == profile.id,
        StudentDocument.document_type == document_type
    ).first()

    if existing:
        existing.file_path = str(dest_path)
        existing.original_filename = file.filename
        existing.file_size_bytes = file_size
        existing.verification_status = "Pending"
        existing.uploaded_at = datetime.now(timezone.utc)
        existing.expiry_date = expiry_date
        db.commit()
        db.refresh(existing)
        doc_record = existing
    else:
        doc_record = StudentDocument(
            student_profile_id=profile.id,
            document_type=document_type,
            file_path=str(dest_path),
            original_filename=file.filename,
            file_size_bytes=file_size,
            mime_type=file.content_type or "application/octet-stream",
            verification_status="Pending",
            expiry_date=expiry_date
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

    log_audit_event(
        db=db,
        action="DOCUMENT_UPLOADED",
        actor_role="student",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="StudentDocument",
        entity_id=str(doc_record.id),
        details={"document_type": document_type, "filename": file.filename}
    )

    return StudentDocumentResponse.model_validate(doc_record)

@router.get("/dashboard")
def get_student_dashboard(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    applications = db.query(Application).filter(Application.student_profile_id == profile.id).all()
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).order_by(Notification.created_at.desc()).limit(5).all()

    return {
        "student_id": profile.student_id,
        "full_name": profile.full_name,
        "email": profile.email,
        "tribe": profile.tribe,
        "profile_completion_pct": profile.profile_completion_pct,
        "overall_verification_status": profile.overall_verification_status,
        "total_applications": len(applications),
        "applications": [
            {
                "id": a.id,
                "application_id": a.application_id,
                "scheme_code": a.scheme.scheme_code if a.scheme else "N/A",
                "scheme_name": a.scheme.name if a.scheme else "N/A",
                "current_stage": a.current_stage,
                "application_status": a.application_status,
                "submitted_at": a.submitted_at.isoformat()
            } for a in applications
        ],
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "category": n.category,
                "created_at": n.created_at.isoformat()
            } for n in notifications
        ]
    }
