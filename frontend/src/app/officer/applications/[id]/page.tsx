'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getStoredUser } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function OfficerApplicationWorkbenchPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params?.id as string;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  // Review Form Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [decision, setDecision] = useState<'Verify' | 'Mark Deficient' | 'Recommend Approval' | 'Reject'>('Recommend Approval');
  const [remarks, setRemarks] = useState('');
  const [deficiencyDoc, setDeficiencyDoc] = useState('academic_document');
  const [deficiencyDesc, setDeficiencyDesc] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchApplication = () => {
    if (!appId) return;
    api.getApplicationDetail(appId)
      .then(data => setApplication(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== 'officer' && user.role !== 'admin')) {
      router.push('/login');
      return;
    }
    fetchApplication();
  }, [appId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    setActionSuccess(null);
    try {
      await api.recordOfficerReview(
        appId,
        decision,
        remarks,
        decision === 'Mark Deficient' ? deficiencyDoc : undefined,
        decision === 'Mark Deficient' ? deficiencyDesc : undefined
      );

      setActionSuccess(`Statutory decision '${decision}' successfully recorded in audit trail.`);
      setActionModalOpen(false);
      setRemarks('');
      setDeficiencyDesc('');
      fetchApplication();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-gov-slate-600">Loading officer scrutiny workbench...</div>;
  }

  if (!application) {
    return <div className="py-12 text-center text-xs text-gov-red">Application not found.</div>;
  }

  const activeDoc = application.documents?.[selectedDocIndex];
  const activeAiVerif = application.ai_verifications?.find(
    (v: any) => v.document_type === activeDoc?.document_type
  );

  return (
    <div className="space-y-4">
      {/* Officer Top Bar */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-4 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/officer/dashboard"
            className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 px-3 py-1.5 rounded font-semibold text-gov-navy text-xs"
          >
            &larr; Return to Docket Queue
          </Link>
          <div>
            <h2 className="text-base font-bold text-gov-navy">
              Application Scrutiny Docket: <span className="font-mono">{application.application_id}</span>
            </h2>
            <div className="text-gov-slate-600 flex gap-3 text-[11px] mt-0.5">
              <span><strong>Scheme:</strong> {application.scheme_name}</span>
              <span><strong>Student:</strong> {application.student_name} ({application.student_id_code})</span>
              <span><strong>Tribe:</strong> {application.tribe}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge status={application.application_status} size="md" />
          <button
            type="button"
            onClick={() => setActionModalOpen(true)}
            className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-4 py-2 rounded text-xs transition-colors"
          >
            Record Statutory Action &rarr;
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-green-50 border border-green-300 text-gov-green text-xs p-3 rounded font-medium">
          {actionSuccess}
        </div>
      )}

      {/* Main Dual-Pane Scrutiny Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        {/* LEFT PANE: Document Viewer & Selector (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gov-slate-300 rounded shadow-sm p-4 flex flex-col space-y-3">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
            <div>
              <span className="font-bold text-gov-navy text-xs uppercase tracking-wide">
                Attached Documents ({application.documents?.length || 0})
              </span>
              <span className="text-[11px] text-gov-slate-500 block">
                Select document tab to inspect image and OCR evidence.
              </span>
            </div>
            <StatusBadge status={activeDoc?.verification_status || 'Pending'} />
          </div>

          {/* Document Tab Switcher (Supporting all 7 document types) */}
          <div className="flex flex-wrap gap-1">
            {application.documents?.map((doc: any, idx: number) => (
              <button
                key={doc.document_type}
                type="button"
                onClick={() => setSelectedDocIndex(idx)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition-colors border ${
                  selectedDocIndex === idx
                    ? 'bg-gov-navy text-white border-gov-navy font-semibold'
                    : 'bg-gov-slate-100 hover:bg-gov-slate-200 text-gov-slate-700 border-gov-slate-300'
                }`}
              >
                {doc.document_type}
              </button>
            ))}
          </div>

          {/* High Resolution Document Display Container */}
          <div className="border border-gov-slate-300 rounded bg-gov-slate-100 min-h-[460px] flex flex-col p-3 relative overflow-hidden">
            {activeDoc ? (
              <div className="w-full flex flex-col space-y-2">
                <div className="flex justify-between items-center bg-white border border-gov-slate-300 rounded px-3 py-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gov-navy">{activeDoc.document_type}</span>
                    <span className="text-gov-slate-500 font-mono text-[11px]">({activeDoc.original_filename || 'document.jpg'})</span>
                  </div>
                  <a
                    href={`/api/v1/applications/${application.application_id}/documents/${activeDoc.document_type}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gov-navy hover:underline text-[11px] font-medium bg-gov-slate-50 border border-gov-slate-300 px-2.5 py-1 rounded"
                  >
                    Open Full Image &nearr;
                  </a>
                </div>

                <div className="bg-white border border-gov-slate-300 rounded p-2 flex justify-center items-center overflow-auto max-h-[600px]">
                  {activeDoc.original_filename?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={`/api/v1/applications/${application.application_id}/documents/${activeDoc.document_type}/file`}
                      className="w-full h-[550px] border-0"
                      title={activeDoc.document_type}
                    />
                  ) : (
                    <img
                      src={`/api/v1/applications/${application.application_id}/documents/${activeDoc.document_type}/file`}
                      alt={activeDoc.document_type}
                      className="max-h-[550px] w-auto max-w-full object-contain rounded shadow-sm"
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent && !parent.querySelector('.doc-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'doc-fallback p-6 text-center text-xs text-gov-slate-600';
                          fallback.innerHTML = `<div class="font-bold text-gov-navy mb-1">Document File Reference</div><div class="font-mono text-[11px]">${activeDoc.file_path}</div><div class="text-[11px] text-gov-slate-500 mt-2">File preview unavailable. Click "Open Full Image" above to inspect.</div>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-gov-slate-500 px-1 font-mono">
                  <span>Path: {activeDoc.file_path}</span>
                  <span>Physical File Scrutiny Active</span>
                </div>
              </div>
            ) : (
              <span className="text-gov-slate-500 text-center m-auto">No document selected.</span>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Verification Evidence & Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section A: DigiLocker / NAD Evidence Layer */}
          <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
              <span className="font-bold text-gov-navy text-xs uppercase tracking-wide">
                1. DigiLocker / NAD Verification
              </span>
              <StatusBadge status={application.digilocker_verification?.status || 'Not_Attempted'} />
            </div>

            {application.digilocker_verification ? (
              <div className="text-[11px] space-y-1.5 text-gov-slate-700">
                <div className="flex justify-between">
                  <span className="text-gov-slate-500">Issuer Repository:</span>
                  <span className="font-semibold">{application.digilocker_verification.issuer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gov-slate-500">Transaction ID:</span>
                  <span className="font-mono">{application.digilocker_verification.transaction_id}</span>
                </div>

                {application.digilocker_verification.status === 'RECORD_FOUND' ? (
                  <div className="bg-green-50 border border-green-200 rounded p-2.5 mt-2 space-y-1 text-gov-slate-800">
                    <div className="font-bold text-gov-green">Authenticated Academic Record:</div>
                    <div>Course: {application.digilocker_verification.verified_records?.course}</div>
                    <div>Roll No: {application.digilocker_verification.verified_records?.roll_number}</div>
                    <div>Score: {application.digilocker_verification.verified_records?.percentage_cgpa}% ({application.digilocker_verification.verified_records?.result_status})</div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2.5 mt-2 text-yellow-900">
                    <div className="font-bold">Fallback Active:</div>
                    <p>{application.digilocker_verification.fallback_reason}</p>
                    <p className="text-[10px] text-gov-slate-600 mt-1">
                      Proceeded through manual document OCR & Officer Scrutiny.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gov-slate-500 text-[11px] py-2">
                DigiLocker consent not yet granted by student.
              </div>
            )}
          </div>

          {/* Section B: AI / OCR Document Findings */}
          <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
              <div>
                <span className="font-bold text-gov-navy text-xs uppercase tracking-wide">
                  2. AI / OCR Document Analysis
                </span>
                <span className="text-[10px] text-gov-slate-500 block">
                  Target: {activeDoc?.document_type}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                {activeAiVerif && (
                  activeAiVerif.overall_confidence < 0.50 ? (
                    <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      Confidence: {Math.round(activeAiVerif.overall_confidence * 100)}% (Discrepancy)
                    </span>
                  ) : activeAiVerif.overall_confidence >= 0.80 ? (
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                      Confidence: {Math.round(activeAiVerif.overall_confidence * 100)}% (Verified)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Confidence: {Math.round(activeAiVerif.overall_confidence * 100)}% (Advisory)
                    </span>
                  )
                )}
                <span className="text-[10px] text-gov-slate-600 bg-gov-slate-100 border px-1.5 py-0.5 rounded">
                  Advisory Only
                </span>
              </div>
            </div>

            {activeAiVerif ? (
              <div className="text-[11px] space-y-2 text-gov-slate-700">
                <div className="bg-gov-slate-50 border border-gov-slate-200 rounded p-2 space-y-1">
                  <div className="font-semibold text-gov-navy text-[11px]">Extracted Structured Entities:</div>
                  {activeAiVerif.parsed_fields && Object.entries(activeAiVerif.parsed_fields).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-gov-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                      <span className="font-medium text-gov-slate-900 truncate max-w-[180px]">{String(v)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="border rounded p-1.5 bg-gov-slate-50">
                    <span className="text-gov-slate-500 block">Name Similarity</span>
                    <span className="font-bold text-gov-green text-xs">
                      {activeAiVerif.match_scores?.name_similarity_pct}%
                    </span>
                  </div>
                  <div className="border rounded p-1.5 bg-gov-slate-50">
                    <span className="text-gov-slate-500 block">Profile Consistency</span>
                    <span className="font-bold text-gov-green text-xs">
                      {activeAiVerif.match_scores?.profile_match ? 'Consistent' : 'Discrepancy'}
                    </span>
                  </div>
                </div>

                {/* Advisory Quality / Anomaly Flags */}
                {activeAiVerif.quality_flags && activeAiVerif.quality_flags.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-gov-navy text-[11px] block">
                      Advisory Flags for Officer Attention:
                    </span>
                    {activeAiVerif.quality_flags.map((flag: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-amber-50 border border-amber-300 text-gov-amber p-2 rounded text-[11px]"
                      >
                        <div className="font-bold">[{flag.severity}] {flag.code}</div>
                        <div>{flag.message}</div>
                        {flag.evidence && (
                          <div className="text-[10px] text-gov-slate-600 mt-0.5 font-mono">
                            Evidence: {flag.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 text-gov-green p-2 rounded text-[11px] font-medium">
                    No discrepancies detected in this document.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gov-slate-500 text-[11px] py-2">
                No AI verification data available for this document slot.
              </div>
            )}
          </div>

          {/* Section C: Rule Engine Eligibility Snapshot */}
          <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
              <span className="font-bold text-gov-navy text-xs uppercase tracking-wide">
                3. Deterministic Eligibility Check
              </span>
              <StatusBadge status={application.eligibility_result?.is_eligible ? 'Eligible' : 'Not Eligible'} />
            </div>

            <div className="space-y-1 text-[11px] text-gov-slate-700">
              {application.eligibility_result?.criteria?.map((c: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-0.5">
                  <span className="truncate max-w-[200px]">{c.criterion}</span>
                  <span className={c.passed ? 'text-gov-green font-semibold' : 'text-gov-red font-semibold'}>
                    {c.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Action Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gov-slate-300 rounded shadow-xl max-w-lg w-full p-6 text-xs space-y-4">
            <div className="border-b border-gov-slate-200 pb-2">
              <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
                Statutory Human Scrutiny
              </span>
              <h3 className="text-base font-bold text-gov-navy mt-0.5">
                Record Scrutiny Action on Docket: {appId}
              </h3>
              <p className="text-gov-slate-600 mt-1">
                AI and DigiLocker evidence are advisory. You have statutory authority to verify, mark deficient, approve, or reject this application.
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Select Statutory Action *
                </label>
                <select
                  value={decision}
                  onChange={(e: any) => setDecision(e.target.value)}
                  className="w-full text-xs font-medium"
                >
                  <option value="Recommend Approval">Recommend Approval (All Criteria & Documents Verified)</option>
                  <option value="Mark Deficient">Mark Deficient (Request Targeted Student Correction)</option>
                  <option value="Verify">Verify Documents (Intermediate Stage)</option>
                  <option value="Reject">Reject Application (Ineligible / Disqualified)</option>
                </select>
              </div>

              {/* If Deficiency Raised: Specific Document Selection */}
              {decision === 'Mark Deficient' && (
                <div className="bg-amber-50 border border-amber-300 p-3 rounded space-y-3">
                  <div className="font-bold text-gov-amber text-[11px] uppercase">
                    Targeted Document Deficiency Specification:
                  </div>

                  <div>
                    <label className="block text-gov-slate-700 font-semibold mb-1">
                      Deficient Document Category *
                    </label>
                    <select
                      value={deficiencyDoc}
                      onChange={(e) => setDeficiencyDoc(e.target.value)}
                      className="w-full text-xs"
                    >
                      <option value="academic_document">academic_document (Master's Degree Marksheet)</option>
                      <option value="st_certificate">st_certificate (ST Community Certificate)</option>
                      <option value="income_certificate">income_certificate (Annual Family Income Certificate)</option>
                      <option value="admission_registration">admission_registration (University Admission Proof)</option>
                      <option value="research_proposal">research_proposal (Ph.D. Proposal Synopsis)</option>
                      <option value="foreign_offer_letter">foreign_offer_letter (Foreign Offer Letter)</option>
                      <option value="study_research_plan">study_research_plan (Study & Research Execution Plan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gov-slate-700 font-semibold mb-1">
                      Precise Deficiency Reason & Instructions for Student *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={deficiencyDesc}
                      onChange={(e) => setDeficiencyDesc(e.target.value)}
                      placeholder="e.g. Income certificate validity expired on 31 March 2024. Please upload certified renewal from Tehsildar."
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Official Statutory Remarks / Audit Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter detailed statutory reasons and verification findings for official audit trail..."
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gov-slate-200">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-medium px-4 py-2 rounded text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingAction}
                  className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-5 py-2 rounded text-xs transition-colors"
                >
                  {submittingAction ? 'Recording Action...' : 'Confirm & Commit Action \u2192'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
