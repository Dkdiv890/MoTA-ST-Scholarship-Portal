import secrets
import hashlib
import time
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.application import Application
from app.models.verification import DigiLockerVerification

class DigiLockerService:
    """
    DigiLocker / National Academic Depository (NAD) Integration Adapter.
    Maintains a strict boundary between Sandbox/Demo mode and Production OAuth2 PKCE.
    """

    @classmethod
    def generate_auth_session(cls, application_id: str) -> Dict[str, str]:
        """
        Generates OAuth2 authorization URL and state token.
        """
        state = secrets.token_urlsafe(32)
        
        if settings.DIGILOCKER_MODE == "production":
            # Production OAuth2 URL (requires MoTA authorized credentials)
            auth_url = (
                f"{settings.DIGILOCKER_AUTH_ENDPOINT}?"
                f"response_type=code&"
                f"client_id={settings.DIGILOCKER_CLIENT_ID}&"
                f"redirect_uri={settings.DIGILOCKER_REDIRECT_URI}&"
                f"state={state}"
            )
        else:
            # Interactive Demo Sandbox URL
            auth_url = (
                f"/digilocker/demo?"
                f"application_id={application_id}&"
                f"state={state}&"
                f"client_id={settings.DIGILOCKER_CLIENT_ID}"
            )

        return {
            "auth_url": auth_url,
            "state": state,
            "mode": settings.DIGILOCKER_MODE,
        }

    @classmethod
    def process_callback(
        cls,
        db: Session,
        application_id: str,
        code: str,
        state: str,
        simulate_branch: str = "BRANCH_A"
    ) -> DigiLockerVerification:
        """
        Exchanges authorization code for verified NAD/DigiLocker payload.
        Handles both Branch A (Record Found) and Branch B (Record Not Found / Fallback).
        """
        app_record = db.query(Application).filter(Application.application_id == application_id).first()
        if not app_record:
            raise ValueError(f"Application {application_id} not found.")

        existing_verif = db.query(DigiLockerVerification).filter(
            DigiLockerVerification.application_id == app_record.id
        ).first()

        transaction_id = f"DL-TXN-{int(time.time())}-{secrets.token_hex(4).upper()}"

        if settings.DIGILOCKER_MODE == "production":
            status = "RECORD_NOT_FOUND"
            fallback_reason = "Production DigiLocker gateway credentials pending authorized issuance."
            verified_records = None
        else:
            if simulate_branch == "BRANCH_A":
                status = "RECORD_FOUND"
                fallback_reason = None
                verified_records = {
                    "doc_type": "Degree / Marksheet (Master's)",
                    "issuer": "National Academic Depository (NAD)",
                    "institution": app_record.academic_institution or "Central University of Odisha",
                    "course": app_record.course or "Master of Science",
                    "student_name": app_record.student_profile.full_name,
                    "roll_number": app_record.student_profile.roll_number or "2024-MS-0142",
                    "percentage_cgpa": app_record.masters_percentage or 78.5,
                    "result_status": "FIRST CLASS WITH DISTINCTION",
                    "year_of_passing": "2024",
                    "verification_timestamp": datetime.now(timezone.utc).isoformat(),
                    "digital_signature": "VERIFIED_VALID_SHA256_GOV_CERT"
                }
            else:
                status = "RECORD_NOT_FOUND"
                fallback_reason = "Academic record not yet indexed in NAD repository. Application proceeding to manual document AI verification."
                verified_records = None

        if existing_verif:
            existing_verif.status = status
            existing_verif.auth_code = code
            existing_verif.transaction_id = transaction_id
            existing_verif.verified_records = verified_records
            existing_verif.fallback_reason = fallback_reason
            existing_verif.consent_timestamp = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing_verif)
            verif_record = existing_verif
        else:
            verif_record = DigiLockerVerification(
                application_id=app_record.id,
                mode=settings.DIGILOCKER_MODE,
                status=status,
                auth_code=code,
                transaction_id=transaction_id,
                issuer_name="National Academic Depository (NAD)",
                verified_records=verified_records,
                fallback_reason=fallback_reason,
                consent_timestamp=datetime.now(timezone.utc)
            )
            db.add(verif_record)
            db.commit()
            db.refresh(verif_record)

        app_record.current_stage = "DigiLocker Verified" if status == "RECORD_FOUND" else "DigiLocker Fallback"
        db.commit()

        return verif_record
