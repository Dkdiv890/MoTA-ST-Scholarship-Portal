import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.student import StudentProfile, StudentDocument
from app.models.scholarship import ScholarshipScheme, SchemeRule, SchemeDocument
from app.services.eligibility_engine import EligibilityEngine

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    # Seed Schemes
    nfst = ScholarshipScheme(
        scheme_code="NFST",
        name="National Fellowship for ST Students",
        description="NFST Desc",
        income_ceiling_inr=600000.0,
        min_academic_percentage=55.0
    )
    db.add(nfst)
    db.commit()
    db.refresh(nfst)

    for dt in ["st_certificate", "academic_document", "admission_registration", "research_proposal"]:
        db.add(SchemeDocument(scheme_id=nfst.id, document_type=dt, is_mandatory=True))

    nos = ScholarshipScheme(
        scheme_code="NOS",
        name="National Overseas Scholarship",
        description="NOS Desc",
        income_ceiling_inr=600000.0,
        min_academic_percentage=60.0
    )
    db.add(nos)
    db.commit()
    db.refresh(nos)

    # Note: Explicit inclusion of study_research_plan for NOS
    for dt in ["st_certificate", "academic_document", "foreign_offer_letter", "income_certificate", "study_research_plan"]:
        db.add(SchemeDocument(scheme_id=nos.id, document_type=dt, is_mandatory=True))

    db.commit()
    yield db
    db.close()

def test_nfst_eligible(test_db):
    nfst = test_db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NFST").first()
    profile = StudentProfile(
        user_id=1,
        student_id="ST-2026-000001",
        full_name="Sakshi Sahu",
        tribe="Oraon",
        masters_percentage=72.5,
        annual_income_inr=450000.0
    )
    docs = ["st_certificate", "academic_document", "admission_registration", "research_proposal"]
    res = EligibilityEngine.evaluate(db=test_db, profile=profile, scheme=nfst, uploaded_doc_types=docs)
    assert res.is_eligible is True
    assert "Eligible for" in res.summary

def test_nos_study_research_plan_required(test_db):
    nos = test_db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NOS").first()
    profile = StudentProfile(
        user_id=2,
        student_id="ST-2026-000002",
        full_name="Riya Uikey",
        tribe="Santhal",
        masters_percentage=81.0,
        annual_income_inr=450000.0
    )
    # Missing 'study_research_plan'
    docs = ["st_certificate", "academic_document", "foreign_offer_letter", "income_certificate"]
    res = EligibilityEngine.evaluate(db=test_db, profile=profile, scheme=nos, uploaded_doc_types=docs)
    assert res.is_eligible is False
    assert any("study_research_plan" in c.detail for c in res.criteria if not c.passed)

def test_income_exceeded_ineligible(test_db):
    nfst = test_db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NFST").first()
    profile = StudentProfile(
        user_id=3,
        student_id="ST-2026-000003",
        full_name="Isha Bhoi",
        tribe="Bodo",
        masters_percentage=75.0,
        annual_income_inr=750000.0  # Exceeds 600,000 threshold
    )
    docs = ["st_certificate", "academic_document", "admission_registration", "research_proposal"]
    res = EligibilityEngine.evaluate(db=test_db, profile=profile, scheme=nfst, uploaded_doc_types=docs)
    assert res.is_eligible is False
    income_criterion = next(c for c in res.criteria if c.field == "annual_income_inr")
    assert income_criterion.passed is False
