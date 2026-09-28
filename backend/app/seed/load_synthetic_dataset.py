import csv
import os
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.student import StudentProfile, StudentDocument
from app.models.scholarship import ScholarshipScheme
from app.models.application import Application, ApplicationDocument

logger = logging.getLogger("scholarship.dataset_loader")

def find_dataset_dir() -> Path:
    candidates = [
        Path(settings.DATASET_PATH),
        Path(__file__).resolve().parent.parent.parent.parent / "SIH_ST_NFST_NOS_1000",
        Path("/Users/divyank/Desktop/sih final prtotype/SIH_ST_NFST_NOS_1000"),
        Path("../SIH_ST_NFST_NOS_1000"),
    ]
    for c in candidates:
        if c.exists() and (c / "data" / "applicants.csv").exists():
            return c
    raise FileNotFoundError(f"SIH_ST_NFST_NOS_1000 dataset directory not found in candidates: {candidates}")

def load_dataset_into_db(db: Session, max_applicants: int = 100):
    """Ingests the pre-existing synthetic dataset into normalized database tables."""
    dataset_dir = find_dataset_dir()
    logger.info(f"Loading synthetic dataset from: {dataset_dir}")

    applicants_file = dataset_dir / "data" / "applicants.csv"
    applications_file = dataset_dir / "data" / "applications.csv"
    manifest_file = dataset_dir / "data" / "document_manifest.csv"

    nfst = db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NFST").first()
    nos = db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NOS").first()

    schemes_map = {
        "NFST": nfst,
        "NOS": nos
    }

    applicant_map = {}
    with open(applicants_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            if count >= max_applicants:
                break
            app_id = row["applicant_id"]
            student_code = f"ST-2026-{app_id.replace('ST', '').zfill(6)}"
            email = row["email"]

            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    phone=row["phone"],
                    full_name=row["name"],
                    password_hash=get_password_hash("Student@123"),
                    role="student",
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
            if not profile:
                profile = StudentProfile(
                    user_id=user.id,
                    student_id=student_code,
                    full_name=row["name"],
                    dob=row["dob"],
                    gender=row["gender"],
                    phone=row["phone"],
                    email=email,
                    state=row["state"],
                    district="District Center",
                    pincode="462001",
                    tribe=row["tribe"],
                    st_certificate_number=f"ST/{row['state'][:2].upper()}/{app_id}/2023",
                    st_issuing_authority="Competent Revenue Authority",
                    st_issue_date="2023-08-15",
                    st_verification_status="Verified",
                    profile_completion_pct=100,
                    overall_verification_status="Verified"
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)

            applicant_map[app_id] = profile
            count += 1

    application_map = {}
    with open(applications_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            orig_app_id = row["applicant_id"]
            if orig_app_id not in applicant_map:
                continue

            profile = applicant_map[orig_app_id]
            scheme_code = row["scheme"]
            scheme_obj = schemes_map.get(scheme_code)
            if not scheme_obj:
                continue

            app_num = row["application_id"]
            existing_app = db.query(Application).filter(Application.application_id == app_num).first()
            if not existing_app:
                income = float(row["annual_family_income_inr"])
                score = float(row["masters_percentage"])

                profile.institution_name = row["academic_institution"]
                profile.course = row["course"]
                profile.annual_income_inr = income
                profile.masters_percentage = score

                scheme_specific = {}
                if scheme_code == "NFST":
                    scheme_specific = {
                        "research_topic": f"Empirical Study on ST Socio-Economic Development in {profile.state}",
                        "supervisor_name": "Prof. S. K. Narayan",
                        "admission_status": "Confirmed"
                    }
                else:
                    scheme_specific = {
                        "target_country": "United Kingdom",
                        "foreign_university": "University of Manchester",
                        "qs_ranking": 32,
                        "course_duration_months": 24
                    }

                status = row["application_status"]
                stage = "Officer Review"
                if status == "Deficiency Raised":
                    stage = "Deficient"
                elif status == "Verified":
                    stage = "Approved"
                elif status == "Under Verification":
                    stage = "AI Verified"

                new_app = Application(
                    application_id=app_num,
                    student_profile_id=profile.id,
                    scheme_id=scheme_obj.id,
                    current_stage=stage,
                    application_status=status,
                    scheme_specific_data=scheme_specific,
                    academic_institution=row["academic_institution"],
                    course=row["course"],
                    annual_family_income_inr=income,
                    masters_percentage=score
                )
                db.add(new_app)
                db.commit()
                db.refresh(new_app)
                application_map[app_num] = new_app

    with open(manifest_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            app_num = row["application_id"]
            if app_num not in application_map:
                continue

            app_obj = application_map[app_num]
            doc_type = row["document_type"]
            rel_file = row["file_path"]
            full_path = str(dataset_dir / rel_file)

            existing_doc = db.query(ApplicationDocument).filter(
                ApplicationDocument.application_id == app_obj.id,
                ApplicationDocument.document_type == doc_type
            ).first()

            if not existing_doc:
                db.add(ApplicationDocument(
                    application_id=app_obj.id,
                    document_type=doc_type,
                    file_path=full_path,
                    original_filename=Path(rel_file).name,
                    is_present=row["present"].lower() == "true",
                    verification_status="Verified" if app_obj.application_status == "Verified" else "Pending"
                ))

                prof = app_obj.student_profile
                db.add(StudentDocument(
                    student_profile_id=prof.id,
                    document_type=doc_type,
                    file_path=full_path,
                    original_filename=Path(rel_file).name,
                    verification_status="Verified" if app_obj.application_status == "Verified" else "Pending"
                ))

    db.commit()
    logger.info("Synthetic dataset ingestion completed successfully.")
