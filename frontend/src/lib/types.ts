export type UserRole = 'student' | 'officer' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type DocumentType =
  | 'st_certificate'
  | 'academic_document'
  | 'income_certificate'
  | 'admission_registration'
  | 'research_proposal'
  | 'foreign_offer_letter'
  | 'study_research_plan';

export interface StudentDocument {
  id: number;
  student_profile_id: number;
  document_type: DocumentType;
  file_path: string;
  original_filename: string;
  verification_status: 'Verified' | 'Pending' | 'Needs Update' | 'Expired' | 'Rejected' | 'Not Available';
  expiry_date?: string;
  rejection_reason?: string;
  uploaded_at: string;
  is_active: boolean;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  student_id: string; // ST-2026-000001
  full_name: string;
  dob?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  district?: string;
  pincode?: string;
  
  tribe?: string;
  st_certificate_number?: string;
  st_issuing_authority?: string;
  st_issue_date?: string;
  st_verification_status: string;

  institution_name?: string;
  institution_type?: string;
  course?: string;
  program?: string;
  qualification?: string;
  academic_year?: string;
  roll_number?: string;
  masters_percentage?: number;
  academic_verification_status: string;

  annual_income_inr?: number;
  income_cert_number?: string;
  income_cert_validity?: string;
  income_verification_status: string;

  profile_completion_pct: number;
  overall_verification_status: string;
  documents: StudentDocument[];
}

export interface SchemeRule {
  id: number;
  rule_code: string;
  criterion_name: string;
  field_to_check: string;
  operator: string;
  expected_value: string;
  is_mandatory: boolean;
  error_message: string;
}

export interface ScholarshipScheme {
  id: number;
  scheme_code: string; // NFST, NOS
  name: string;
  description: string;
  objective?: string;
  income_ceiling_inr?: number;
  min_academic_percentage: number;
  application_deadline?: string;
  is_active: boolean;
  guidelines_url?: string;
  required_documents: { document_type: DocumentType; is_mandatory: boolean }[];
  rules: SchemeRule[];
}

export interface CriterionCheck {
  criterion: string;
  passed: boolean;
  detail: string;
  field?: string;
  expected?: string;
  actual?: any;
}

export interface EligibilityResult {
  scheme_code: string;
  scheme_name: string;
  is_eligible: boolean;
  summary: string;
  criteria: CriterionCheck[];
}

export interface ApplicationDocument {
  id: number;
  document_type: DocumentType;
  file_path: string;
  original_filename: string;
  is_present: boolean;
  verification_status: string;
  uploaded_at: string;
}

export interface Application {
  id: number;
  application_id: string; // APP20260001
  student_profile_id: number;
  scheme_id: number;
  scheme_code?: string;
  scheme_name?: string;
  current_stage: string;
  application_status: string;
  scheme_specific_data?: Record<string, any>;
  academic_institution?: string;
  course?: string;
  annual_family_income_inr?: number;
  masters_percentage?: number;
  submitted_at: string;
  updated_at: string;
  documents: ApplicationDocument[];

  // Detailed fields
  student_name?: string;
  student_id_code?: string;
  tribe?: string;
  state?: string;
  district?: string;
  phone?: string;
  email?: string;
  eligibility_result?: { is_eligible: boolean; criteria: CriterionCheck[] };
  digilocker_verification?: {
    status: string;
    mode: string;
    transaction_id: string;
    issuer_name: string;
    verified_records?: Record<string, any>;
    fallback_reason?: string;
    consent_timestamp: string;
  };
  ai_verifications?: {
    document_type: string;
    parsed_fields?: Record<string, any>;
    match_scores?: Record<string, any>;
    quality_flags?: Array<{ severity: string; code: string; message: string; evidence?: string }>;
    overall_confidence: number;
    processed_at: string;
  }[];
  officer_reviews?: {
    officer_name: string;
    decision: string;
    remarks: string;
    created_at: string;
  }[];
  deficiencies?: {
    id: number;
    document_type: string;
    issue_description: string;
    status: string;
    raised_at: string;
    resolved_at?: string;
    resubmission_remarks?: string;
  }[];
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor_email?: string;
  actor_role: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
}

export interface InAppNotification {
  id: number;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}
