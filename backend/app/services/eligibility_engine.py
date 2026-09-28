from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.student import StudentProfile
from app.models.scholarship import ScholarshipScheme, SchemeRule, SchemeDocument
from app.schemas.application import CriterionCheck, EligibilityCheckResponse

class EligibilityEngine:
    """
    Deterministic, rule-based explainable eligibility engine.
    Evaluates verified profile data and uploaded documents against scheme rules.
    Does NOT use an LLM for eligibility determination.
    """

    @classmethod
    def evaluate(
        cls,
        db: Session,
        profile: StudentProfile,
        scheme: ScholarshipScheme,
        uploaded_doc_types: List[str] = None
    ) -> EligibilityCheckResponse:
        criteria: List[CriterionCheck] = []
        is_eligible = True
        uploaded_doc_types = uploaded_doc_types or [
            doc.document_type for doc in profile.documents if doc.is_active
        ]

        st_passed = bool(profile.tribe and len(profile.tribe.strip()) > 0)
        criteria.append(CriterionCheck(
            criterion="Scheduled Tribe (ST) Category Requirement",
            passed=st_passed,
            detail=f"Applicant belongs to '{profile.tribe}' ST community." if st_passed else "Valid ST tribe identification is missing.",
            field="tribe",
            expected="Recognized ST Community",
            actual=profile.tribe or "None"
        ))
        if not st_passed:
            is_eligible = False

        min_academic = scheme.min_academic_percentage
        academic_score = profile.masters_percentage or 0.0
        academic_passed = academic_score >= min_academic
        criteria.append(CriterionCheck(
            criterion=f"Minimum Academic Qualifying Score ({min_academic:.1f}%)",
            passed=academic_passed,
            detail=f"Qualifying score is {academic_score:.2f}% (Minimum required: {min_academic:.1f}%)." if academic_passed 
                   else f"Qualifying score {academic_score:.2f}% is below required {min_academic:.1f}%.",
            field="masters_percentage",
            expected=f">= {min_academic:.1f}%",
            actual=f"{academic_score:.2f}%"
        ))
        if not academic_passed:
            is_eligible = False

        income_ceiling = scheme.income_ceiling_inr
        annual_income = profile.annual_income_inr or 0.0
        if income_ceiling is not None:
            income_passed = annual_income <= income_ceiling
            criteria.append(CriterionCheck(
                criterion="Annual Family Income Ceiling",
                passed=income_passed,
                detail=f"Family income INR {annual_income:,.0f} is within threshold INR {income_ceiling:,.0f} (Configured Prototype Rule)." if income_passed
                       else f"Family income INR {annual_income:,.0f} exceeds threshold INR {income_ceiling:,.0f}.",
                field="annual_income_inr",
                expected=f"<= INR {income_ceiling:,.0f}",
                actual=f"INR {annual_income:,.0f}"
            ))
            if not income_passed:
                is_eligible = False
        else:
            criteria.append(CriterionCheck(
                criterion="Annual Family Income Ceiling",
                passed=True,
                detail="No strict income ceiling configured for this fellowship.",
                field="annual_income_inr",
                expected="N/A",
                actual=f"INR {annual_income:,.0f}"
            ))

        required_docs = db.query(SchemeDocument).filter(
            SchemeDocument.scheme_id == scheme.id,
            SchemeDocument.is_mandatory == True
        ).all()

        missing_docs = []
        for req_doc in required_docs:
            if req_doc.document_type not in uploaded_doc_types:
                missing_docs.append(req_doc.document_type)

        docs_passed = len(missing_docs) == 0
        doc_detail = "All required scheme documents are present." if docs_passed else f"Missing required document(s): {', '.join(missing_docs)}."
        criteria.append(CriterionCheck(
            criterion="Required Document Compliance",
            passed=docs_passed,
            detail=doc_detail,
            field="documents",
            expected=f"{len(required_docs)} mandatory documents",
            actual=f"{len(uploaded_doc_types)} uploaded (Missing: {', '.join(missing_docs) if missing_docs else 'None'})"
        ))
        if not docs_passed:
            is_eligible = False

        # Summary Generation
        if is_eligible:
            summary = f"Eligible for {scheme.name} ({scheme.scheme_code}). All statutory criteria satisfied."
        else:
            failed_count = sum(1 for c in criteria if not c.passed)
            summary = f"Not Eligible for {scheme.name}. {failed_count} statutory criterion/criteria not satisfied."

        return EligibilityCheckResponse(
            scheme_code=scheme.scheme_code,
            scheme_name=scheme.name,
            is_eligible=is_eligible,
            summary=summary,
            criteria=criteria
        )
