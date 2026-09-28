'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalyticsSummary()
      .then(res => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-gov-slate-600">Aggregating policy analytics...</div>;
  }

  if (!data) {
    return <div className="py-12 text-center text-xs text-gov-red">Failed to load analytics data.</div>;
  }

  const kpis = data.kpis;

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
          Ministry of Tribal Affairs | Policy Monitoring Division
        </span>
        <h2 className="text-xl font-bold text-gov-navy mt-0.5">
          Operational & Fellowship Scheme Analytics
        </h2>
        <p className="text-xs text-gov-slate-600 mt-1">
          Evidence-based telemetry across NFST and NOS fellowship cycles, verification efficiency, DigiLocker availability, and geographic distribution.
        </p>
      </div>

      {/* KPI Numerical Grid (Useful Metrics, No Fake Charts) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gov-slate-300 rounded p-4 shadow-sm">
          <span className="text-gov-slate-500 block text-[11px]">Total Applications</span>
          <span className="text-2xl font-bold text-gov-navy font-mono">{kpis.total_applications}</span>
          <span className="text-[11px] text-gov-slate-600 block mt-1">
            NFST: {kpis.nfst_applications} | NOS: {kpis.nos_applications}
          </span>
        </div>

        <div className="bg-white border border-gov-slate-300 rounded p-4 shadow-sm">
          <span className="text-gov-slate-500 block text-[11px]">Approved Fellowships</span>
          <span className="text-2xl font-bold text-gov-green font-mono">{kpis.approved_applications}</span>
          <span className="text-[11px] text-gov-slate-600 block mt-1">
            Rejection Count: {kpis.rejected_applications}
          </span>
        </div>

        <div className="bg-white border border-gov-slate-300 rounded p-4 shadow-sm">
          <span className="text-gov-slate-500 block text-[11px]">Deficient Dockets</span>
          <span className="text-2xl font-bold text-gov-amber font-mono">{kpis.deficient_applications}</span>
          <span className="text-[11px] text-gov-slate-600 block mt-1">
            Under Scrutiny: {kpis.pending_applications}
          </span>
        </div>

        <div className="bg-white border border-gov-slate-300 rounded p-4 shadow-sm">
          <span className="text-gov-slate-500 block text-[11px]">Avg Scrutiny Turnaround</span>
          <span className="text-2xl font-bold text-gov-navy font-mono">{kpis.average_verification_days} Days</span>
          <span className="text-[11px] text-gov-green font-semibold block mt-1">
            Target SLA: &lt; 7.0 Days
          </span>
        </div>
      </div>

      {/* Secondary Efficiency & Gateway Health Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gov-slate-300 rounded p-4 shadow-sm">
          <span className="font-bold text-gov-navy block mb-1">DigiLocker / NAD Availability</span>
          <div className="text-xl font-bold text-gov-navy font-mono">{kpis.digilocker_availability_pct}%</div>
          <div className="w-full bg-gov-slate-200 rounded-full h-2 mt-2">
            <div className="bg-gov-navy h-2 rounded-full" style={{ width: `${kpis.digilocker_availability_pct}%` }} />
          </div>
          <span className="text-[11px] text-gov-slate-500 mt-2 block">
            Share of applicants with verified electronic academic transcripts.
          </span>
        </div>

        <div className="bg-white border border-gov-slate-300 rounded p-4 shadow-sm">
          <span className="font-bold text-gov-navy block mb-1">AI Discrepancy Detection Rate</span>
          <div className="text-xl font-bold text-gov-amber font-mono">{kpis.document_mismatch_rate_pct}%</div>
          <div className="w-full bg-gov-slate-200 rounded-full h-2 mt-2">
            <div className="bg-gov-amber h-2 rounded-full" style={{ width: `${kpis.document_mismatch_rate_pct * 3}%` }} />
          </div>
          <span className="text-[11px] text-gov-slate-500 mt-2 block">
            Advisory mismatch flags flagged by OCR and entity cross-checking.
          </span>
        </div>

        <div className="bg-white border border-gov-slate-300 rounded p-4 shadow-sm">
          <span className="font-bold text-gov-navy block mb-1">OCR Processing Success Rate</span>
          <div className="text-xl font-bold text-gov-green font-mono">{100 - kpis.ocr_failure_rate_pct}%</div>
          <div className="w-full bg-gov-slate-200 rounded-full h-2 mt-2">
            <div className="bg-gov-green h-2 rounded-full" style={{ width: `${100 - kpis.ocr_failure_rate_pct}%` }} />
          </div>
          <span className="text-[11px] text-gov-slate-500 mt-2 block">
            Unreadable / blurred document rate: {kpis.ocr_failure_rate_pct}%.
          </span>
        </div>
      </div>

      {/* Institutional Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top States */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 space-y-3">
          <div className="border-b border-gov-slate-200 pb-2">
            <h3 className="font-bold text-gov-navy text-sm">
              State-Wise Applicant Distribution
            </h3>
            <span className="text-[11px] text-gov-slate-500">Distribution across Scheduled Tribe population hubs</span>
          </div>

          <table className="w-full text-left">
            <thead className="bg-gov-slate-100 text-gov-slate-700 font-semibold border-b text-[11px]">
              <tr>
                <th className="py-2 px-3">State / UT</th>
                <th className="py-2 px-3 text-right">Application Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-slate-200">
              {data.state_distribution?.map((st: any) => (
                <tr key={st.state} className="hover:bg-gov-slate-50">
                  <td className="py-2 px-3 font-medium text-gov-slate-800">{st.state}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-gov-navy">{st.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Institutions */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 space-y-3">
          <div className="border-b border-gov-slate-200 pb-2">
            <h3 className="font-bold text-gov-navy text-sm">
              Higher Education Institutions
            </h3>
            <span className="text-[11px] text-gov-slate-500">Host universities of qualifying applicants</span>
          </div>

          <table className="w-full text-left">
            <thead className="bg-gov-slate-100 text-gov-slate-700 font-semibold border-b text-[11px]">
              <tr>
                <th className="py-2 px-3">Academic Institution</th>
                <th className="py-2 px-3 text-right">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-slate-200">
              {data.institution_distribution?.map((inst: any) => (
                <tr key={inst.institution} className="hover:bg-gov-slate-50">
                  <td className="py-2 px-3 font-medium text-gov-slate-800 truncate max-w-[220px]">
                    {inst.institution}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-gov-navy">{inst.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
