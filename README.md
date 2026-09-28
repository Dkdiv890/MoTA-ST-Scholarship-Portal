# Ministry of Tribal Affairs - AI-Enabled Scholarship & Fellowship Management System

A national-level, production-style portal prototype for Scheduled Tribes (ST) students applying for:
1. **National Fellowship for Scheduled Tribes (NFST)**
2. **National Overseas Scholarship (NOS)**

Developed for the Smart India Hackathon (SIH).

## Key Architecture & Features
- **Student One-Time Registration (S-OTR)**: Unique Student ID (`ST-2026-000001`), reusable verified profile.
- **Deterministic Rule-Based Eligibility Engine**: Explainable criteria checks (ST category, academic cutoff, income ceiling) without LLM hallucinations.
- **One-Click Pre-filled Application**: Auto-populates verified student profile data.
- **DigiLocker / NAD Consent & Verification**:
  - **Branch A**: Record verified in NAD -> Token exchange -> AI/OCR Verification -> Officer Review.
  - **Branch B**: Record unavailable/not found -> Fallback recorded -> AI/OCR Verification -> Officer Review.
- **AI Document Verification & Extraction**: OCR, structured field extraction, cross-document entity matching, and advisory deficiency flagging.
- **Mandatory Human Officer Review**: Interactive side-by-side evidence workbench with deficiency resolution loop.
- **Public Audit Trail & Operational Analytics**: Full event provenance and institutional metric dashboards.
- **Strict Public-Service Standards**: Clean institutional interface, accessible typography, zero emojis.
