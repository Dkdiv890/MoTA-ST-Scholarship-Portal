import secrets
import time
from typing import Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.user import User
from app.models.application import Application
from app.schemas.verification import DigiLockerConsentRequest, DigiLockerVerificationResponse
from app.services.digilocker_service import DigiLockerService
from app.services.sms_service import SMSService
from app.services.ai_verification_service import AIVerificationService
from app.services.audit_service import log_audit_event
from app.services.notification_service import send_notification

router = APIRouter(prefix="/digilocker", tags=["DigiLocker / NAD Verification"])

class SendOtpRequest(BaseModel):
    phone_number: str
    application_id: str

class VerifyOtpRequest(BaseModel):
    phone_number: str
    otp: str
    application_id: str

# In-memory store for active verification OTPs: clean_phone -> metadata
_ACTIVE_OTPS: Dict[str, Dict[str, Any]] = {}

@router.post("/send-otp")
def send_digilocker_otp(req: SendOtpRequest):
    phone = SMSService.clean_indian_phone(req.phone_number)
    if len(phone) != 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit Indian mobile number.")

    otp = str(secrets.randbelow(900000) + 100000)
    _ACTIVE_OTPS[phone] = {
        "otp": otp,
        "expires_at": time.time() + 600,
        "application_id": req.application_id
    }

    sms_res = SMSService.send_otp_sms(phone_number=phone, otp=otp)
    return {
        "status": "SENT" if sms_res.get("success") else "DISPATCHED",
        "message": sms_res.get("message") or f"OTP generated for +91 ******{phone[-4:]}.",
        "masked_phone": f"+91 ******{phone[-4:]}",
        "carrier_sms_sent": sms_res.get("success", False),
        "sms_provider": sms_res.get("provider"),
        "demo_otp": otp if not sms_res.get("success") else None,
        "error_hint": sms_res.get("error") if not sms_res.get("success") else None
    }

@router.post("/verify-otp")
def verify_digilocker_otp(req: VerifyOtpRequest):
    phone = SMSService.clean_indian_phone(req.phone_number)
    entry = _ACTIVE_OTPS.get(phone)

    # Universal demo bypass
    if req.otp == "123456":
        return {"verified": True, "message": "OTP verified successfully (Demo Bypass)."}

    if not entry:
        raise HTTPException(status_code=400, detail="No active OTP request found for this mobile number. Please click 'Resend OTP'.")

    if time.time() > entry["expires_at"]:
        _ACTIVE_OTPS.pop(phone, None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")

    if entry["otp"] != req.otp.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please enter the OTP sent to your phone.")

    _ACTIVE_OTPS.pop(phone, None)
    return {"verified": True, "message": "Aadhaar OTP authenticated successfully."}

@router.get("/start")
def start_digilocker_session(
    application_id: str,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """
    Initializes DigiLocker / NAD authorization flow.
    Returns session auth_url and state token.
    """
    app_record = db.query(Application).filter(Application.application_id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    if app_record.student_profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this application.")

    session_info = DigiLockerService.generate_auth_session(application_id=application_id)

    log_audit_event(
        db=db,
        action="DIGILOCKER_SESSION_INITIATED",
        actor_role="student",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="Application",
        entity_id=application_id,
        details={"mode": session_info["mode"]}
    )

    return session_info

@router.post("/process-consent", response_model=DigiLockerVerificationResponse)
def process_digilocker_consent_and_callback(
    consent_req: DigiLockerConsentRequest,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """
    Handles DigiLocker / NAD consent and callback processing.
    Executes mandatory post-callback AI/OCR document verification in ALL cases:
    - Branch A (Record Found) -> AI/OCR -> Officer Review
    - Branch B (Record Not Found / Fallback) -> AI/OCR -> Officer Review
    """
    app_record = db.query(Application).filter(
        Application.application_id == consent_req.application_id
    ).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    if app_record.student_profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access.")

    code = f"AUTH_CODE_{consent_req.simulate_branch}"
    state = "VERIFIED_STATE_TOKEN"

    verif_record = DigiLockerService.process_callback(
        db=db,
        application_id=consent_req.application_id,
        code=code,
        state=state,
        simulate_branch=consent_req.simulate_branch
    )

    log_audit_event(
        db=db,
        action="DIGILOCKER_VERIFICATION_COMPLETED",
        actor_role="student",
        actor_id=current_user.id,
        actor_email=current_user.email,
        entity_type="DigiLockerVerification",
        entity_id=str(verif_record.id),
        details={
            "application_id": consent_req.application_id,
            "status": verif_record.status,
            "simulate_branch": consent_req.simulate_branch
        }
    )

    AIVerificationService.verify_application_documents(
        db=db,
        application_id=consent_req.application_id
    )

    log_audit_event(
        db=db,
        action="AI_DOCUMENT_VERIFICATION_PROCESSED",
        actor_role="system",
        entity_type="Application",
        entity_id=consent_req.application_id,
        details={"post_digilocker_status": verif_record.status}
    )

    msg = (
        f"DigiLocker verification succeeded and AI document scanning completed. Case forwarded to Officer Review."
        if verif_record.status == "RECORD_FOUND" else
        f"DigiLocker record unavailable (Fallback active). AI document scanning completed. Case forwarded to Officer Review."
    )
    send_notification(
        db=db,
        user_id=current_user.id,
        title="Verification Progress Update",
        message=msg,
        category="verification",
        link=f"/student/applications/{consent_req.application_id}"
    )

    return DigiLockerVerificationResponse.model_validate(verif_record)
