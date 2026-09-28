import secrets
import os
import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.user import User
from app.models.student import StudentProfile, StudentDocument
from app.models.scholarship import ScholarshipScheme, SchemeDocument
from app.models.application import Application, ApplicationDocument, EligibilityResult
from app.models.verification import DigiLockerVerification, AIVerification
from app.models.deficiency import Deficiency, OfficerReview
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationDetailResponse
from app.services.eligibility_engine import EligibilityEngine
from app.services.ai_verification_service import AIVerificationService
from app.services.audit_service import log_audit_event
from app.services.notification_service import send_notification

router = APIRouter(prefix="/applications", tags=["Scholarship Applications"])

@router.post("", response_model=ApplicationResponse)
def create_prefilled_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """
    One-Click / Pre-filled Application Creation.
    Pre-fills applicant name, DOB, student ID, institute, course, marks from verified S-OTR profile.
    Only scheme-specific fields are requested.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    scheme = db.query(ScholarshipScheme).filter(
        ScholarshipScheme.scheme_code == app_in.scheme_code.upper()
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{app_in.scheme_code}' not found.")

    eligibility = EligibilityEngine.evaluate(db=db, profile=profile, scheme=scheme)
    if not eligibility.is_eligible:
        raise HTTPException(
            status_code=400,
            detail=f"Ineligible for application: {eligibility.summary}"
        )

    existing = db.query(Application).filter(
        Application.student_profile_id == profile.id,
        Application.scheme_id == scheme.id
    ).first()
    if existing:
        return ApplicationResponse.model_validate(existing)

    count = db.query(Application).count() + 1
    app_id_code = f"APP2026{str(count).zfill(4)}"

    new_app = Application(
        application_id=app_id_code,
        student_profile_id=profile.id,
        scheme_id=scheme.id,
        current_stage="Eligibility Checked",
        application_status="Submitted",
        scheme_specific_data=app_in.scheme_specific_data or {},
        academic_institution=profile.institution_name,
        course=profile.course,
        annual_family_income_inr=profile.annual_income_inr,
        masters_percentage=profile.masters_percentage
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    el_result = EligibilityResult(
        application_id=new_app.id,
        is_eligible=eligibility.is_eligible,
        evaluation_summary=[c.model_dump() for c in eligibility.criteria]
    )
    db.add(el_result)

    req_docs = db.query(SchemeDocument).filter(SchemeDocument.scheme_id == scheme.id).all()
    for req in req_docs:
        vault_doc = db.query(StudentDocument).filter(
            StudentDocument.student_profile_id == profile.id,
            StudentDocument.document_type == req.document_type
        ).first()

        file_path = vault_doc.file_path if vault_doc else f"dataset/documents/{scheme.scheme_code}/{req.document_type}/SAMPLE.jpg"
        orig_name = vault_doc.original_filename if vault_doc else f"{req.document_type}.jpg"

        app_doc = ApplicationDocument(
            application_id=new_app.id,
            document_type=req.document_type,
            file_path=file_path,
            original_filename=orig_name,
            is_present=vault_doc is not None,
            verification_status="Pending"
        )
        db.add(app_doc)

    db.commit()
    db.refresh(new_app)

    log_audit_event(
        db=db,
        action="APPLICATION_SUBMITTED",
        actor_role="student",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="Application",
        entity_id=new_app.application_id,
        details={"scheme": scheme.scheme_code}
    )

    send_notification(
        db=db,
        user_id=current_user.id,
        title="Application Created Successfully",
        message=f"Application {new_app.application_id} for {scheme.name} submitted. Next stage: DigiLocker / NAD Consent.",
        category="application",
        link=f"/student/applications/{new_app.application_id}"
    )

    resp = ApplicationResponse.model_validate(new_app)
    resp.scheme_code = scheme.scheme_code
    resp.scheme_name = scheme.name
    return resp

@router.get("", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []
    apps = db.query(Application).filter(Application.student_profile_id == profile.id).all()
    out = []
    for a in apps:
        resp = ApplicationResponse.model_validate(a)
        resp.scheme_code = a.scheme.scheme_code if a.scheme else None
        resp.scheme_name = a.scheme.name if a.scheme else None
        out.append(resp)
    return out

@router.get("/{app_id}", response_model=ApplicationDetailResponse)
def get_application_detail(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_record = db.query(Application).filter(Application.application_id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Authorization: Student can only view own; Officer and Admin can view all
    if current_user.role == "student":
        if app_record.student_profile.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this application.")

    resp_dict = ApplicationResponse.model_validate(app_record).model_dump()
    resp_dict["scheme_code"] = app_record.scheme.scheme_code if app_record.scheme else None
    resp_dict["scheme_name"] = app_record.scheme.name if app_record.scheme else None

    # Student snapshot
    prof = app_record.student_profile
    resp_dict["student_name"] = prof.full_name
    resp_dict["student_id_code"] = prof.student_id
    resp_dict["tribe"] = prof.tribe
    resp_dict["state"] = prof.state
    resp_dict["district"] = prof.district
    resp_dict["phone"] = prof.phone
    resp_dict["email"] = prof.email

    # Verification layers
    if app_record.eligibility_result:
        resp_dict["eligibility_result"] = {
            "is_eligible": app_record.eligibility_result.is_eligible,
            "criteria": app_record.eligibility_result.evaluation_summary
        }
    if app_record.digilocker_verification:
        dl = app_record.digilocker_verification
        resp_dict["digilocker_verification"] = {
            "status": dl.status,
            "mode": dl.mode,
            "transaction_id": dl.transaction_id,
            "issuer_name": dl.issuer_name,
            "verified_records": dl.verified_records,
            "fallback_reason": dl.fallback_reason,
            "consent_timestamp": dl.consent_timestamp.isoformat()
        }

    resp_dict["ai_verifications"] = [
        {
            "document_type": v.document_type,
            "parsed_fields": v.parsed_fields,
            "match_scores": v.match_scores,
            "quality_flags": v.quality_flags,
            "overall_confidence": v.overall_confidence,
            "processed_at": v.processed_at.isoformat()
        } for v in app_record.ai_verifications
    ]

    resp_dict["officer_reviews"] = [
        {
            "officer_name": r.officer_name,
            "decision": r.decision,
            "remarks": r.remarks,
            "created_at": r.created_at.isoformat()
        } for r in app_record.officer_reviews
    ]

    resp_dict["deficiencies"] = [
        {
            "id": d.id,
            "document_type": d.document_type,
            "issue_description": d.issue_description,
            "status": d.status,
            "raised_at": d.raised_at.isoformat(),
            "resolved_at": d.resolved_at.isoformat() if d.resolved_at else None,
            "resubmission_remarks": d.resubmission_remarks
        } for d in app_record.deficiencies
    ]

    return ApplicationDetailResponse(**resp_dict)

@router.post("/{app_id}/resubmit-deficient-document")
def resubmit_deficient_document(
    app_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    remarks: str = Form(""),
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """
    Targeted deficiency resolution:
    Upload replacement for ONLY the affected document.
    Re-runs AI verification on the affected document, updates deficiency to 'Resolved',
    and transitions application back to 'Officer Review'.
    """
    app_record = db.query(Application).filter(Application.application_id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    if app_record.student_profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access.")

    deficiency = db.query(Deficiency).filter(
        Deficiency.application_id == app_record.id,
        Deficiency.document_type == document_type,
        Deficiency.status == "Active"
    ).first()

    upload_dir = Path(settings.STORAGE_DIR) / app_record.student_profile.student_id / "resubmitted"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_ext = Path(file.filename).suffix.lower()
    dest_path = upload_dir / f"{document_type}_corrected_{int(datetime.now().timestamp())}{file_ext}"

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    app_doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.application_id == app_record.id,
        ApplicationDocument.document_type == document_type
    ).first()
    if app_doc:
        app_doc.file_path = str(dest_path)
        app_doc.original_filename = file.filename
        app_doc.verification_status = "Pending"
        app_doc.uploaded_at = datetime.now(timezone.utc)

    if deficiency:
        deficiency.status = "Resolved"
        deficiency.resolved_at = datetime.now(timezone.utc)
        deficiency.resubmitted_file_path = str(dest_path)
        deficiency.resubmission_remarks = remarks

    AIVerificationService.verify_application_documents(db=db, application_id=app_id)

    app_record.current_stage = "Officer Review"
    app_record.application_status = "Under Verification"
    db.commit()

    log_audit_event(
        db=db,
        action="DEFICIENT_DOCUMENT_RESUBMITTED",
        actor_role="student",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="Application",
        entity_id=app_id,
        details={"document_type": document_type, "filename": file.filename}
    )

    send_notification(
        db=db,
        user_id=current_user.id,
        title="Correction Resubmitted",
        message=f"Replacement for '{document_type}' in Application {app_id} resubmitted and AI re-verified. Pending officer review.",
        category="deficiency",
        link=f"/student/applications/{app_id}"
    )

    return {"status": "SUCCESS", "message": f"Document '{document_type}' resubmitted and AI re-verified."}

@router.get("/{app_id}/documents/{document_type}/file")
def get_application_document_file(
    app_id: str,
    document_type: str,
    db: Session = Depends(get_db)
):
    """
    Serves the actual physical document file for officer verification or student preview.
    Supports uploaded student documents, direct storage paths, and synthetic dataset files.
    """
    app_record = db.query(Application).filter(Application.application_id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    app_doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.application_id == app_record.id,
        ApplicationDocument.document_type == document_type
    ).first()
    if not app_doc or not app_doc.file_path:
        raise HTTPException(status_code=404, detail="Document record not found.")

    candidate_paths = [
        Path(app_doc.file_path),
        Path(settings.STORAGE_DIR) / app_doc.file_path,
        Path(settings.BASE_DIR) / app_doc.file_path,
        Path(settings.DATASET_PATH) / app_doc.file_path,
    ]

    scheme_code = app_record.scheme.scheme_code if app_record.scheme else "NFST"
    candidate_paths.append(Path(settings.DATASET_PATH) / "documents" / scheme_code / document_type / Path(app_doc.file_path).name)

    found_path = None
    for p in candidate_paths:
        if p.exists() and p.is_file():
            found_path = p
            break

    if not found_path:
        sample_dir = Path(settings.DATASET_PATH) / "documents" / scheme_code / document_type
        if sample_dir.exists():
            files = sorted(list(sample_dir.glob("*.jpg")) + list(sample_dir.glob("*.jpeg")) + list(sample_dir.glob("*.png")) + list(sample_dir.glob("*.pdf")))
            if files:
                found_path = files[0]

    if not found_path:
        raise HTTPException(status_code=404, detail=f"Physical file for '{document_type}' not found on server.")

    ext = found_path.suffix.lower()
    media_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png" if ext == ".png" else "application/pdf" if ext == ".pdf" else "application/octet-stream"

    return FileResponse(str(found_path), media_type=media_type, filename=app_doc.original_filename or found_path.name)
