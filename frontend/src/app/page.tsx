'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function HomePage() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSchemes()
      .then(data => setSchemes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Official Notice Ticker */}
      <div className="bg-amber-50 border-l-4 border-gov-amber p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="bg-gov-amber text-white font-bold px-2 py-0.5 rounded text-[11px] uppercase">
            Official Notice
          </span>
          <span className="text-gov-slate-800 font-medium">
            AY 2026-27 Applications open for National Fellowship (NFST) and National Overseas Scholarship (NOS). Complete S-OTR prior to applying.
          </span>
        </div>
        <Link href="/otr" className="text-gov-navy font-semibold underline hover:text-gov-navy-light whitespace-nowrap">
          Register for S-OTR
        </Link>
      </div>

      {/* Hero / Portal Introduction */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 md:p-8">
        <div className="max-w-3xl">
          <span className="text-xs font-bold text-gov-saffron uppercase tracking-widest">
            Ministry of Tribal Affairs | Government of India
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gov-navy mt-1 mb-3">
            National Scholarship & Fellowship Portal for Scheduled Tribes
          </h2>
          <p className="text-gov-slate-700 leading-relaxed text-sm mb-6">
            A unified, single-window digital governance platform for Scheduled Tribe (ST) students. Featuring Student One-Time Registration (S-OTR), deterministic rule-based eligibility evaluation, DigiLocker / NAD trusted verification, AI-assisted document scrutiny, and statutory human officer workflows.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/otr"
              className="bg-gov-navy hover:bg-gov-navy-light text-white font-medium px-5 py-2.5 rounded transition-colors text-sm"
            >
              Complete Student S-OTR
            </Link>
            <Link
              href="/student/scholarships"
              className="bg-white hover:bg-gov-slate-100 border border-gov-slate-300 text-gov-navy font-medium px-5 py-2.5 rounded transition-colors text-sm"
            >
              Scholarship Finder
            </Link>
            <Link
              href="/login"
              className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-800 font-medium px-5 py-2.5 rounded transition-colors text-sm"
            >
              Officer / Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Core Workflow Architecture Diagram / Pipeline Steps */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <h3 className="text-base font-bold text-gov-navy border-b border-gov-slate-200 pb-2 mb-4">
          Integrated End-to-End Scrutiny Workflow
        </h3>
        <p className="text-xs text-gov-slate-600 mb-6">
          The platform follows an institutional, step-by-step verification pipeline. DigiLocker never bypasses AI/OCR, and AI/OCR remains strictly advisory for the reviewing officer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="border border-gov-slate-300 rounded p-3 bg-gov-slate-50">
            <div className="font-bold text-gov-navy mb-1">1. Student S-OTR</div>
            <p className="text-gov-slate-600 leading-normal">
              One-time student registration issuing a unique Student ID (e.g. ST-2026-000001). Pre-fills future applications.
            </p>
          </div>

          <div className="border border-gov-slate-300 rounded p-3 bg-gov-slate-50">
            <div className="font-bold text-gov-navy mb-1">2. Eligibility Engine</div>
            <p className="text-gov-slate-600 leading-normal">
              Deterministic, explainable rule engine evaluates verified student attributes against scheme criteria.
            </p>
          </div>

          <div className="border border-gov-slate-300 rounded p-3 bg-gov-slate-50">
            <div className="font-bold text-gov-navy mb-1">3. DigiLocker / NAD</div>
            <p className="text-gov-slate-600 leading-normal">
              Direct verification of academic records. Supports Branch A (Record Found) and Branch B (Graceful Fallback).
            </p>
          </div>

          <div className="border border-gov-slate-300 rounded p-3 bg-gov-slate-50">
            <div className="font-bold text-gov-navy mb-1">4. AI Document Check</div>
            <p className="text-gov-slate-600 leading-normal">
              Mandatory post-DigiLocker OCR extraction, entity cross-matching, and advisory anomaly flagging across all 7 document types.
            </p>
          </div>

          <div className="border border-gov-slate-300 rounded p-3 bg-gov-slate-50">
            <div className="font-bold text-gov-navy mb-1">5. Statutory Review</div>
            <p className="text-gov-slate-600 leading-normal">
              Human Nodal Officer conducts final scrutiny, raises targeted deficiencies, or approves applications with full audit logging.
            </p>
          </div>
        </div>
      </div>

      {/* Flagship Scholarship Schemes (NFST & NOS Only) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gov-navy">
            Flagship Ministry of Tribal Affairs Schemes
          </h3>
          <Link href="/student/scholarships" className="text-xs text-gov-navy hover:underline font-semibold">
            View Eligibility & Apply &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NFST Card */}
          <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-mono text-xs bg-gov-slate-100 text-gov-navy px-2 py-0.5 rounded border border-gov-slate-300 font-semibold">
                  SCHEME CODE: NFST
                </span>
                <span className="text-xs text-gov-slate-600 font-medium">
                  Deadline: 31 Dec 2026
                </span>
              </div>
              <h4 className="text-base font-bold text-gov-navy mb-2">
                National Fellowship for Higher Education of ST Students
              </h4>
              <p className="text-xs text-gov-slate-600 leading-relaxed mb-4">
                Financial assistance for ST students pursuing full-time M.Phil and Ph.D. degrees in recognized Indian universities and institutions of national importance.
              </p>

              <div className="border-t border-gov-slate-200 pt-3 text-xs space-y-1.5 mb-4 text-gov-slate-700">
                <div><strong>Qualifying Cutoff:</strong> Minimum 55% at Master's level</div>
                <div><strong>Annual Income Ceiling:</strong> INR 6,00,000 (Configurable Prototype Rule)</div>
                <div><strong>Mandatory Documents:</strong> ST Certificate, Academic Marksheet, Admission Proof, Research Proposal</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gov-slate-200">
              <span className="text-xs text-gov-slate-500">Ministry of Tribal Affairs</span>
              <Link
                href="/student/scholarships/NFST"
                className="bg-gov-navy hover:bg-gov-navy-light text-white text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Check Eligibility & Details
              </Link>
            </div>
          </div>

          {/* NOS Card */}
          <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-mono text-xs bg-gov-slate-100 text-gov-navy px-2 py-0.5 rounded border border-gov-slate-300 font-semibold">
                  SCHEME CODE: NOS
                </span>
                <span className="text-xs text-gov-slate-600 font-medium">
                  Deadline: 30 Nov 2026
                </span>
              </div>
              <h4 className="text-base font-bold text-gov-navy mb-2">
                National Overseas Scholarship for Scheduled Tribe Candidates
              </h4>
              <p className="text-xs text-gov-slate-600 leading-relaxed mb-4">
                Financial assistance for ST candidates selected for pursuing Master level courses, Ph.D., and Post-Doctoral research programmes in globally accredited universities abroad.
              </p>

              <div className="border-t border-gov-slate-200 pt-3 text-xs space-y-1.5 mb-4 text-gov-slate-700">
                <div><strong>Qualifying Cutoff:</strong> Minimum 60% in qualifying examination</div>
                <div><strong>Annual Income Ceiling:</strong> INR 6,00,000 (Configurable Prototype Rule)</div>
                <div><strong>Mandatory Documents:</strong> ST Certificate, Academic Marksheet, Foreign Offer Letter, Income Certificate, Study & Research Plan</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gov-slate-200">
              <span className="text-xs text-gov-slate-500">Overseas Fellowship Cell</span>
              <Link
                href="/student/scholarships/NOS"
                className="bg-gov-navy hover:bg-gov-navy-light text-white text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Check Eligibility & Details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset & Baseline Transparency Panel */}
      <div className="bg-gov-slate-100 border border-gov-slate-300 rounded p-4 text-xs text-gov-slate-700">
        <div className="font-bold text-gov-navy mb-1">
          Synthetic Dataset Ingestion Reference (SIH_ST_NFST_NOS_1000)
        </div>
        <p className="leading-relaxed">
          Integrated baseline of 1,000 synthetic ST applicants (600 NFST, 400 NOS) and 4,400 document records. Document verification uses runtime OCR text extraction, fuzzy entity matching, and advisory deficiency detection without relying on pre-existing ground truth labels as shortcuts.
        </p>
      </div>
    </div>
  );
}
