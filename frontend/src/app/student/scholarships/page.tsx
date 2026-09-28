'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function ScholarshipDiscoveryPage() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchemeForEligibility, setSelectedSchemeForEligibility] = useState<any | null>(null);
  const [eligibilityModalData, setEligibilityModalData] = useState<any | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    api.discoverSchemes()
      .then(data => setSchemes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpenEligibilityDetails = async (schemeCode: string) => {
    setCheckingEligibility(true);
    try {
      const res = await api.checkSchemeEligibility(schemeCode);
      setEligibilityModalData(res);
      setSelectedSchemeForEligibility(schemeCode);
    } catch (err: any) {
      alert(`Eligibility Check Failed: ${err.message}. Please ensure S-OTR profile is registered.`);
    } finally {
      setCheckingEligibility(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Finder Header */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
          Ministry of Tribal Affairs | Higher Education Cell
        </span>
        <h2 className="text-xl font-bold text-gov-navy mt-1">
          Central Scholarship Discovery & Scheme Finder
        </h2>
        <p className="text-xs text-gov-slate-600 mt-1 leading-relaxed max-w-3xl">
          Schemes available for Scheduled Tribe students pursuing doctoral research in India (NFST) or master/doctoral studies abroad (NOS). The deterministic rule engine continuously evaluates your verified S-OTR profile against statutory eligibility criteria.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gov-slate-600">
          Evaluating statutory eligibility across schemes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map(scheme => (
            <div
              key={scheme.scheme_code}
              className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-mono text-xs font-bold bg-gov-slate-100 text-gov-navy px-2.5 py-0.5 rounded border border-gov-slate-300">
                    {scheme.scheme_code}
                  </span>
                  <StatusBadge status={scheme.eligibility_status || 'Eligible'} size="md" />
                </div>

                <h3 className="text-base font-bold text-gov-navy mb-2">
                  {scheme.name}
                </h3>
                <p className="text-xs text-gov-slate-600 leading-relaxed mb-4">
                  {scheme.description}
                </p>

                <div className="bg-gov-slate-50 border border-gov-slate-200 rounded p-3 text-xs space-y-1.5 mb-4 text-gov-slate-700">
                  <div><strong>Application Deadline:</strong> {scheme.application_deadline || '31 Dec 2026'}</div>
                  <div><strong>Min Academic Cutoff:</strong> {scheme.min_academic_percentage}% at Master's level</div>
                  <div>
                    <strong>Annual Income Ceiling:</strong> {scheme.income_ceiling_inr ? `INR ${scheme.income_ceiling_inr.toLocaleString('en-IN')} (Configurable Prototype Rule)` : 'None'}
                  </div>
                  <div>
                    <strong>Required Documents:</strong> {scheme.required_documents.join(', ')}
                  </div>
                </div>

                <div className="text-xs text-gov-slate-500 mb-4 italic">
                  Rule Engine Evaluation: {scheme.eligibility_summary}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gov-slate-200 gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenEligibilityDetails(scheme.scheme_code)}
                  disabled={checkingEligibility}
                  className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-navy font-semibold px-3 py-2 rounded text-xs transition-colors"
                >
                  View Eligibility Details
                </button>

                <Link
                  href={`/student/scholarships/${scheme.scheme_code}`}
                  className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-4 py-2 rounded text-xs transition-colors"
                >
                  Apply Now &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explainable Eligibility Result Modal */}
      {eligibilityModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gov-slate-300 rounded shadow-lg max-w-xl w-full p-6 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gov-slate-200 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-gov-saffron uppercase">
                  Explainable Rule-Based Verification
                </span>
                <h4 className="text-base font-bold text-gov-navy mt-0.5">
                  Eligibility Evaluation: {eligibilityModalData.scheme_code}
                </h4>
                <p className="text-gov-slate-600 mt-1">
                  Evaluated using deterministic statutory rules against your verified S-OTR profile.
                </p>
              </div>
              <StatusBadge status={eligibilityModalData.is_eligible ? 'Eligible' : 'Not Eligible'} size="md" />
            </div>

            <div className="bg-gov-slate-50 border border-gov-slate-200 p-3 rounded text-xs font-medium text-gov-slate-800">
              {eligibilityModalData.summary}
            </div>

            <div className="space-y-3">
              <div className="font-bold text-gov-navy text-xs uppercase tracking-wide">
                Statutory Criteria Evaluation Breakdown:
              </div>

              {eligibilityModalData.criteria.map((crit: any, idx: number) => (
                <div
                  key={idx}
                  className={`border rounded p-3 text-xs ${
                    crit.passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gov-slate-900">{crit.criterion}</span>
                    <span className={`font-bold uppercase text-[11px] ${crit.passed ? 'text-gov-green' : 'text-gov-red'}`}>
                      {crit.passed ? 'Satisfied' : 'Not Satisfied'}
                    </span>
                  </div>
                  <div className="text-gov-slate-600 mb-1">{crit.detail}</div>
                  <div className="text-[11px] font-mono text-gov-slate-500 flex gap-4">
                    <span>Expected: {crit.expected}</span>
                    <span>Actual: {crit.actual}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gov-slate-200">
              <button
                type="button"
                onClick={() => setEligibilityModalData(null)}
                className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-medium px-4 py-2 rounded text-xs"
              >
                Close
              </button>

              {eligibilityModalData.is_eligible ? (
                <Link
                  href={`/student/scholarships/${selectedSchemeForEligibility}`}
                  className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-4 py-2 rounded text-xs"
                >
                  Proceed to Application &rarr;
                </Link>
              ) : (
                <Link
                  href="/student/profile"
                  className="bg-gov-amber hover:bg-gov-amber-light text-white font-semibold px-4 py-2 rounded text-xs"
                >
                  Update Profile / Documents
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
