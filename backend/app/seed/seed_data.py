from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.scholarship import ScholarshipScheme, SchemeRule, SchemeDocument

def seed_schemes_and_users(db: Session):
    """Seeds initial system roles and scheme configurations."""
    admin = db.query(User).filter(User.email == "admin@tribal.gov.in").first()
    if not admin:
        admin = User(
            email="admin@tribal.gov.in",
            phone="9810011000",
            full_name="National Portal Administrator",
            password_hash=get_password_hash("Admin@MoTA2026"),
            role="admin",
            is_active=True
        )
        db.add(admin)

    officers = [
        {"email": "officer.delhi@tribal.gov.in", "name": "Rajeshwar Meena (Nodal Officer - Delhi HQ)", "phone": "9810022001"},
        {"email": "officer.bhopal@tribal.gov.in", "name": "Sunita Maravi (Verification Officer - MP/Central Zone)", "phone": "9810022002"},
        {"email": "officer.ranchi@tribal.gov.in", "name": "Amit Munda (Senior Scrutiny Officer - Eastern Zone)", "phone": "9810022003"},
    ]
    for off in officers:
        existing_off = db.query(User).filter(User.email == off["email"]).first()
        if not existing_off:
            db.add(User(
                email=off["email"],
                phone=off["phone"],
                full_name=off["name"],
                password_hash=get_password_hash("Officer@MoTA2026"),
                role="officer",
                is_active=True
            ))

    db.commit()

    nfst = db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NFST").first()
    if not nfst:
        nfst = ScholarshipScheme(
            scheme_code="NFST",
            name="National Fellowship for Higher Education of ST Students",
            description="Financial assistance to ST students pursuing regular and full-time M.Phil and Ph.D. degrees in Indian Universities/Institutions.",
            objective="To support meritorious Scheduled Tribe students in obtaining advanced postgraduate research qualifications.",
            income_ceiling_inr=600000.0,
            min_academic_percentage=55.0,
            application_deadline="2026-12-31",
            is_active=True,
            guidelines_url="https://tribal.nic.in/ScholarshiP.aspx"
        )
        db.add(nfst)
        db.commit()
        db.refresh(nfst)

        nfst_docs = [
            "st_certificate",
            "academic_document",
            "admission_registration",
            "research_proposal"
        ]
        for dt in nfst_docs:
            db.add(SchemeDocument(scheme_id=nfst.id, document_type=dt, is_mandatory=True))

        db.add(SchemeRule(
            scheme_id=nfst.id,
            rule_code="ST_COMMUNITY_REQ",
            criterion_name="Scheduled Tribe Community Status",
            field_to_check="tribe",
            operator="is_not_null",
            expected_value="Recognized ST",
            is_mandatory=True,
            error_message="Applicant must belong to a recognized Scheduled Tribe community."
        ))
        db.add(SchemeRule(
            scheme_id=nfst.id,
            rule_code="ACADEMIC_MIN_SCORE",
            criterion_name="Master's Minimum Academic Cutoff",
            field_to_check="masters_percentage",
            operator=">=",
            expected_value="55.0",
            is_mandatory=True,
            error_message="Minimum 55% marks required at Master's level."
        ))
        db.add(SchemeRule(
            scheme_id=nfst.id,
            rule_code="INCOME_CEILING_REQ",
            criterion_name="Annual Family Income Ceiling",
            field_to_check="annual_income_inr",
            operator="<=",
            expected_value="600000.0",
            is_mandatory=True,
            error_message="Annual family income must not exceed INR 6.0 Lakh (Configurable Prototype Rule)."
        ))

    nos = db.query(ScholarshipScheme).filter(ScholarshipScheme.scheme_code == "NOS").first()
    if not nos:
        nos = ScholarshipScheme(
            scheme_code="NOS",
            name="National Overseas Scholarship for ST Candidates",
            description="Financial assistance to selected ST candidates for pursuing Master level courses, Ph.D., and Post-Doctoral research programmes abroad.",
            objective="To facilitate overseas higher education in globally accredited institutions.",
            income_ceiling_inr=600000.0,
            min_academic_percentage=60.0,
            application_deadline="2026-11-30",
            is_active=True,
            guidelines_url="https://overseas.tribal.gov.in"
        )
        db.add(nos)
        db.commit()
        db.refresh(nos)

        nos_docs = [
            "st_certificate",
            "academic_document",
            "foreign_offer_letter",
            "income_certificate",
            "study_research_plan"
        ]
        for dt in nos_docs:
            db.add(SchemeDocument(scheme_id=nos.id, document_type=dt, is_mandatory=True))

        db.add(SchemeRule(
            scheme_id=nos.id,
            rule_code="ST_COMMUNITY_REQ",
            criterion_name="Scheduled Tribe Community Status",
            field_to_check="tribe",
            operator="is_not_null",
            expected_value="Recognized ST",
            is_mandatory=True,
            error_message="Applicant must belong to a recognized Scheduled Tribe community."
        ))
        db.add(SchemeRule(
            scheme_id=nos.id,
            rule_code="ACADEMIC_MIN_SCORE",
            criterion_name="Qualifying Degree Minimum Cutoff",
            field_to_check="masters_percentage",
            operator=">=",
            expected_value="60.0",
            is_mandatory=True,
            error_message="Minimum 60% marks or equivalent grade required in qualifying examination."
        ))
        db.add(SchemeRule(
            scheme_id=nos.id,
            rule_code="INCOME_CEILING_REQ",
            criterion_name="Annual Family Income Ceiling",
            field_to_check="annual_income_inr",
            operator="<=",
            expected_value="600000.0",
            is_mandatory=True,
            error_message="Total family income from all sources must not exceed INR 6.0 Lakh (Configurable Prototype Rule)."
        ))

    db.commit()
