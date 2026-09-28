import pytest
from app.services.ai_verification_service import AIVerificationService

class MockProfile:
    full_name = "Sakshi Sahu"
    tribe = "Oraon"
    institution_name = "University of Lucknow"
    course = "Master of Science"
    roll_number = "2024-MS-0142"
    masters_percentage = 78.5
    annual_income_inr = 450000.0
    state = "Madhya Pradesh"
    st_certificate_number = "ST/MP/0001/2023"
    st_issuing_authority = "District Magistrate"
    income_cert_validity = "2026-03-31"

class MockApplication:
    academic_institution = "University of Lucknow"
    course = "Master of Science"
    masters_percentage = 78.5
    annual_family_income_inr = 450000.0
    scheme_specific_data = {"research_topic": "Forest Governance in Central India"}

def test_ai_extraction_all_seven_types():
    profile = MockProfile()
    app = MockApplication()

    all_types = [
        "st_certificate",
        "academic_document",
        "income_certificate",
        "admission_registration",
        "research_proposal",
        "foreign_offer_letter",
        "study_research_plan"
    ]

    for dt in all_types:
        extracted = AIVerificationService._extract_entities(
            doc_type=dt,
            text="SYNTHETIC EXTRACTED SAMPLE",
            profile=profile,
            application=app
        )
        assert extracted["document_type"] == dt
        assert extracted["detected_name"] == "Sakshi Sahu"
        if dt == "study_research_plan":
            assert "plan_title" in extracted
            assert extracted["duration_months"] == 36

def test_ai_name_mismatch_flag():
    profile = MockProfile()
    app = MockApplication()

    extracted = {
        "detected_name": "Rohan Verma",  # Completely different name
        "detected_institution": "University of Lucknow"
    }

    match_scores = AIVerificationService._calculate_match_scores(
        extracted=extracted,
        profile=profile,
        application=app,
        digilocker=None
    )
    assert match_scores["name_similarity_pct"] < 50.0

    flags = AIVerificationService._detect_flags(
        doc_type="academic_document",
        quality="GOOD",
        extracted=extracted,
        match_scores=match_scores,
        digilocker=None
    )

    mismatch_flag = next((f for f in flags if f["code"] == "NAME_MISMATCH"), None)
    assert mismatch_flag is not None
    assert mismatch_flag["severity"] == "HIGH"
