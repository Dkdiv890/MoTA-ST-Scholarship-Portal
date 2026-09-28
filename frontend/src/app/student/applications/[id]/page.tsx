'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function ApplicationTrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params?.id as string;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitRemarks, setResubmitRemarks] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchApplication = () => {
    if (!appId) return;
    api.getApplicationDetail(appId)
      .then(data => setApplication(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplication();
  }, [appId]);

  const activeDeficiency = application?.deficiencies?.find((d: any) => d.status === 'Active');

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeficiency || !resubmitFile) return;

    setResubmitting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('document_type', activeDeficiency.document_type);
      formData.append('file', resubmitFile);
      formData.append('remarks', resubmitRemarks);

      await api.resubmitDeficientDocument(appId, formData);
      setMessage(`Replacement document for '${activeDeficiency.document_type}' successfully resubmitted and AI re-verified. Case returned to Officer Review.`);
      setResubmitFile(null);
      setResubmitRemarks('');
      fetchApplication();
    } catch (err: any) {
      setMessage(`Resubmission failed: ${err.message}`);
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-gov-slate-600">Loading application tracking details...</div>;
  }

  if (!application) {
    return <div className="py-12 text-center text-xs text-gov-red">Application not found.</div>;
  }

  // Calculate timeline stage index
  const stages = [
    'Submitted',
    'Eligibility Checked',
    'DigiLocker Verified',
    'AI Verified',
    'Officer Review',
    'Final Decision'
  ];

  let currentStageIdx = 1;
  const stageNorm = (application.current_stage || '').toLowerCase();
  if (stageNorm.includes('submitted')) currentStageIdx = 0;
  else if (stageNorm.includes('eligibility')) currentStageIdx = 1;
  else if (stageNorm.includes('digilocker')) currentStageIdx = 2;
  else if (stageNorm.includes('ai')) currentStageIdx = 3;
  else if (stageNorm.includes('officer') || stageNorm.includes('deficient')) currentStageIdx = 4;
  else if (stageNorm.includes('approved') || stageNorm.includes('rejected')) currentStageIdx = 5;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gov-slate-200 pb-4 mb-4">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Application Scrutiny & Life-Cycle Docket
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              Application ID: <span className="font-mono">{application.application_id}</span>
            </h2>
            <div className="text-xs text-gov-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Scheme:</strong> {application.scheme_name} ({application.scheme_code})</span>
              <span><strong>Student ID:</strong> {application.student_id_code}</span>
              <span><strong>Applicant:</strong> {application.student_name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <StatusBadge status={application.application_status} size="lg" />
          </div>
        </div>

        {/* Sequential Life-Cycle Progress Timeline */}
        <div className="py-2">
          <span className="text-xs font-bold text-gov-navy block mb-3 uppercase tracking-wide">
            Statutory Verification Lifecycle
          </span>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
            {stages.map((stageName, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              let style = 'bg-gov-slate-100 text-gov-slate-500 border-gov-slate-200';
              if (isPast) style = 'bg-green-50 text-gov-green border-green-300 font-semibold';
              if (isCurrent) style = 'bg-gov-navy text-white font-bold border-gov-navy shadow-sm';

              return (
                <div key={stageName} className={`p-2 rounded border ${style} flex flex-col justify-center min-h-[56px]`}>
                  <span className="text-[10px] block opacity-80 uppercase tracking-tighter">
                    Stage {idx + 1}
                  </span>
                  <span className="leading-tight text-[11px]">{stageName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-300 text-gov-green text-xs p-4 rounded font-medium">
          {message}
        </div>
      )}

      {/* ACTION REQUIRED: Targeted Deficiency Resubmission Panel */}
      {activeDeficiency && (
        <div className="bg-amber-50 border-2 border-gov-amber rounded shadow-sm p-6 text-xs space-y-4">
          <div className="border-b border-amber-200 pb-3 flex justify-between items-start">
            <div>
              <span className="bg-gov-amber text-white font-bold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Action Required: Document Deficiency Raised
              </span>
              <h3 className="text-base font-bold text-gov-navy mt-1">
                Deficiency in: <span className="font-mono text-gov-amber">{activeDeficiency.document_type}</span>
              </h3>
            </div>
            <span className="text-[11px] text-gov-slate-600 font-medium">
              Raised: {new Date(activeDeficiency.raised_at).toLocaleDateString('en-IN')}
            </span>
          </div>

          <div className="bg-white border border-amber-300 rounded p-4 text-gov-slate-800">
            <div className="font-semibold text-gov-navy mb-1">Scrutiny Officer Remarks:</div>
            <p className="leading-relaxed">{activeDeficiency.issue_description}</p>
          </div>

          <form onSubmit={handleResubmit} className="bg-white border border-gov-slate-300 rounded p-4 space-y-4">
            <div className="font-bold text-gov-navy text-xs border-b border-gov-slate-200 pb-2">
              Upload Corrected / Renewed Document
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Select Replacement File (JPG, PNG, PDF) *
                </label>
                <input
                  type="file"
                  required
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setResubmitFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Student Correction Clarification / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={resubmitRemarks}
                  onChange={(e) => setResubmitRemarks(e.target.value)}
                  placeholder="e.g. Attached certified copy with valid financial year stamp"
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-gov-slate-500">
                Resubmission will automatically trigger AI re-verification and return the case to the reviewing officer.
              </span>

              <button
                type="submit"
                disabled={resubmitting || !resubmitFile}
                className="bg-gov-amber hover:bg-gov-amber-light text-white font-semibold px-5 py-2 rounded text-xs transition-colors"
              >
                {resubmitting ? 'Submitting & Running AI Scrutiny...' : 'Resubmit Corrected Document \u2192'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* If DigiLocker Pending */}
      {application.current_stage === 'Eligibility Checked' && (
        <div className="bg-blue-50 border border-blue-300 rounded p-6 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="text-sm font-bold text-gov-navy mb-1">
              Next Step: DigiLocker / NAD Academic Record Verification
            </h4>
            <p className="text-gov-slate-700">
              Your application eligibility has been satisfied. Please complete the one-time DigiLocker consent handshake to authenticate your academic marksheet.
            </p>
          </div>
          <Link
            href={`/digilocker/start?application_id=${application.application_id}`}
            className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-5 py-2.5 rounded text-xs whitespace-nowrap"
          >
            Authorize with DigiLocker / NAD &rarr;
          </Link>
        </div>
      )}

      {/* Grid of Verification Layers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Layer 1: DigiLocker / NAD Record */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
            <h3 className="font-bold text-gov-navy text-sm">
              DigiLocker / NAD Verification Layer
            </h3>
            <StatusBadge status={application.digilocker_verification?.status || 'Pending'} />
          </div>

          {application.digilocker_verification ? (
            <div className="space-y-2 text-gov-slate-700">
              <div className="flex justify-between">
                <span className="text-gov-slate-500">Transaction Ref:</span>
                <span className="font-mono">{application.digilocker_verification.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gov-slate-500">Issuer:</span>
                <span>{application.digilocker_verification.issuer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gov-slate-500">Mode:</span>
                <span className="uppercase font-semibold text-[11px]">{application.digilocker_verification.mode} Sandbox</span>
              </div>

              {application.digilocker_verification.status === 'RECORD_FOUND' ? (
                <div className="bg-green-50 border border-green-200 rounded p-3 mt-2 space-y-1 text-gov-slate-800">
                  <div className="font-bold text-gov-green">Authenticated Academic Record:</div>
                  <div><strong>Course:</strong> {application.digilocker_verification.verified_records?.course}</div>
                  <div><strong>Roll Number:</strong> {application.digilocker_verification.verified_records?.roll_number}</div>
                  <div><strong>Percentage / CGPA:</strong> {application.digilocker_verification.verified_records?.percentage_cgpa}%</div>
                  <div><strong>Result:</strong> {application.digilocker_verification.verified_records?.result_status}</div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2 text-yellow-900">
                  <div className="font-bold mb-1">Fallback Mode Active:</div>
                  <p>{application.digilocker_verification.fallback_reason}</p>
                  <p className="text-[11px] text-gov-slate-600 mt-1">
                    Application successfully transitioned to manual document OCR & Officer Scrutiny.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gov-slate-500 py-4 text-center">
              DigiLocker consent pending. Click authorize above to link NAD record.
            </div>
          )}
        </div>

        {/* Layer 2: Mandatory AI/OCR Document Verification Findings */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
            <h3 className="font-bold text-gov-navy text-sm">
              AI / OCR Document Scrutiny Findings
            </h3>
            <span className="text-[11px] text-gov-slate-500">Mandatory Advisory Layer</span>
          </div>

          {application.ai_verifications?.length > 0 ? (
            <div className="space-y-3">
              {application.ai_verifications.map((ai: any, idx: number) => (
                <div key={idx} className="border border-gov-slate-200 rounded p-3 bg-gov-slate-50 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gov-navy uppercase text-[11px] font-mono">
                      {ai.document_type}
                    </span>
                    {ai.overall_confidence < 0.50 ? (
                      <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        Confidence: {Math.round(ai.overall_confidence * 100)}% (Discrepancy)
                      </span>
                    ) : ai.overall_confidence >= 0.80 ? (
                      <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                        Confidence: {Math.round(ai.overall_confidence * 100)}% (Verified)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Confidence: {Math.round(ai.overall_confidence * 100)}% (Advisory Flag)
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-gov-slate-600 grid grid-cols-2 gap-1">
                    <div>Extracted Name: <span className="font-semibold text-gov-slate-800">{ai.parsed_fields?.detected_name || 'N/A'}</span></div>
                    <div>Institution: <span className="font-semibold text-gov-slate-800">{ai.parsed_fields?.detected_institution || 'N/A'}</span></div>
                    <div>Name Match: <span className="font-semibold text-gov-green">{ai.match_scores?.name_similarity_pct}%</span></div>
                    <div>Profile Parity: <span className="font-semibold text-gov-green">{ai.match_scores?.profile_match ? 'Consistent' : 'Discrepancy'}</span></div>
                  </div>

                  {ai.quality_flags && ai.quality_flags.length > 0 && (
                    <div className="pt-1 space-y-1">
                      {ai.quality_flags.map((flag: any, fIdx: number) => (
                        <div key={fIdx} className="bg-amber-100/60 border border-amber-300 text-gov-amber px-2 py-1 rounded text-[11px]">
                          <strong>[{flag.severity}] {flag.code}:</strong> {flag.message}
                          {flag.evidence && <div className="text-[10px] text-gov-slate-600 mt-0.5">Evidence: {flag.evidence}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gov-slate-500 py-4 text-center">
              AI Document scanning runs automatically post-DigiLocker callback.
            </div>
          )}
        </div>
      </div>

      {/* Layer 3: Statutory Human Officer Reviews & Audit History */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 text-xs space-y-4">
        <h3 className="font-bold text-gov-navy text-sm border-b border-gov-slate-200 pb-2">
          Statutory Scrutiny Reviews & Officer Actions
        </h3>

        {application.officer_reviews?.length > 0 ? (
          <div className="space-y-3">
            {application.officer_reviews.map((rev: any, idx: number) => (
              <div key={idx} className="border border-gov-slate-200 rounded p-4 bg-gov-slate-50 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gov-navy">{rev.officer_name}</span>
                    <StatusBadge status={rev.decision} />
                  </div>
                  <p className="text-gov-slate-700 leading-relaxed">{rev.remarks}</p>
                </div>
                <span className="text-[11px] text-gov-slate-500 font-mono">
                  {new Date(rev.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gov-slate-500 py-4 text-center">
            Application pending scrutiny by designated Regional Nodal Officer.
          </div>
        )}
      </div>
    </div>
  );
}
