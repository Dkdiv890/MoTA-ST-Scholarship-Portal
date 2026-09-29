---
title: MoTA ST Scholarship Portal
emoji: 🏛️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Ministry of Tribal Affairs - ST Scholarship & Fellowship Platform

A comprehensive portal prototype for Scheduled Tribes (ST) students applying for higher education scholarships:
1. **National Fellowship for Higher Education of ST Students (NFST)**
2. **National Overseas Scholarship for ST Candidates (NOS)**

Developed for the Smart India Hackathon (SIH Prototype).

---

## Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, student, officer, admin, applications, digilocker)
│   │   ├── core/            # Database engine, security (JWT), configuration
│   │   ├── models/          # SQLAlchemy ORM models (User, StudentProfile, Application, etc.)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── seed/            # Pre-configured scheme criteria and admin accounts
│   │   ├── services/        # AI/OCR inspection, DigiLocker adapter, SMS gateway, Eligibility engine
│   │   └── main.py          # FastAPI application entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (student, officer, admin, digilocker)
│   │   ├── components/      # Reusable UI components & institutional layout headers
│   │   └── lib/             # API client services & TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Core Workflow & Features

- **Student One-Time Registration (S-OTR)**: Unique Student ID generation (`ST-2026-XXXXXX`) with unified profile management.
- **Deterministic Rule Engine**: Transparent, explainable eligibility validation (ST community status, academic score cutoff, family income ceiling).
- **DigiLocker / MeriPehchaan Integration**: Realistic 3-step citizen verification gateway with Aadhaar/Mobile OTP validation and statutory consent selection.
- **AI/OCR Document Verification**: Automatic document layout verification, entity parsing, and cross-consistency checks with adaptive confidence scoring.
- **Nodal Officer Workbench**: High-resolution embedded document previewer with zoom/inspection tools and full audit action recording.
- **Targeted Deficiency Resolution**: Allows students to re-upload only affected documents without invalidating the entire docket.

---

## Getting Started / Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

---

### Method 1: Running with Docker (Recommended)

Run the full stack (Backend + Frontend + Database) with a single command:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs

---

### Method 2: Manual Local Setup

#### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at: **http://127.0.0.1:8000**  
Interactive Swagger API documentation: **http://127.0.0.1:8000/docs**

---

#### 2. Frontend Setup (Next.js)

Open a new terminal window:

```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

Frontend will be accessible at: **http://localhost:3000**

---

## Demo Credentials (Seeded Roles)

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Nodal Officer (Delhi HQ)** | `officer.delhi@tribal.gov.in` | `Officer@MoTA2026` | `/officer/dashboard` |
| **Verification Officer (MP)** | `officer.bhopal@tribal.gov.in` | `Officer@MoTA2026` | `/officer/dashboard` |
| **Senior Scrutiny Officer** | `officer.ranchi@tribal.gov.in` | `Officer@MoTA2026` | `/officer/dashboard` |
| **Portal Administrator** | `admin@tribal.gov.in` | `Admin@MoTA2026` | `/admin/dashboard` |
| **Student** | *Register via `/register` or login* | *Your password* | `/student/dashboard` |

> **Note for DigiLocker OTP Verification**: In sandbox simulation mode, you can enter any 6-digit OTP received via SMS, or enter the universal demo code `123456`.
