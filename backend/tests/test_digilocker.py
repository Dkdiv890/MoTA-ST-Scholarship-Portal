import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.student import StudentProfile
from app.models.scholarship import ScholarshipScheme
from app.models.application import Application
from app.services.digilocker_service import DigiLockerService

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    user = User(email="test.student@example.edu", full_name="Amit Munda", password_hash="hash", role="student")
    db.add(user)
    db.commit()

    profile = StudentProfile(
        user_id=user.id,
        student_id="ST-2026-000099",
        full_name="Amit Munda",
        tribe="Munda",
        institution_name="Central University of Jharkhand",
        course="Master of Science",
        masters_percentage=76.4
    )
    db.add(profile)

    scheme = ScholarshipScheme(scheme_code="NFST", name="NFST Scheme", description="Desc")
    db.add(scheme)
    db.commit()

    app_rec = Application(
        application_id="APP20269999",
        student_profile_id=profile.id,
        scheme_id=scheme.id,
        current_stage="Eligibility Checked",
        application_status="Submitted",
        academic_institution=profile.institution_name,
        course=profile.course,
        masters_percentage=profile.masters_percentage
    )
    db.add(app_rec)
    db.commit()

    yield db
    db.close()

def test_digilocker_branch_a_record_found(test_db):
    res = DigiLockerService.process_callback(
        db=test_db,
        application_id="APP20269999",
        code="TEST_CODE_A",
        state="VALID_STATE",
        simulate_branch="BRANCH_A"
    )
    assert res.status == "RECORD_FOUND"
    assert res.verified_records is not None
    assert res.verified_records["issuer"] == "National Academic Depository (NAD)"
    assert res.fallback_reason is None

    app = test_db.query(Application).filter(Application.application_id == "APP20269999").first()
    assert app.current_stage == "DigiLocker Verified"

def test_digilocker_branch_b_fallback(test_db):
    res = DigiLockerService.process_callback(
        db=test_db,
        application_id="APP20269999",
        code="TEST_CODE_B",
        state="VALID_STATE",
        simulate_branch="BRANCH_B"
    )
    assert res.status == "RECORD_NOT_FOUND"
    assert res.verified_records is None
    assert res.fallback_reason is not None
    assert "NAD repository" in res.fallback_reason

    app = test_db.query(Application).filter(Application.application_id == "APP20269999").first()
    assert app.current_stage == "DigiLocker Fallback"
