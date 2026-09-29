'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getStoredUser } from '../../../lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    Promise.all([
      api.getAnalyticsSummary(),
      api.getAdminSchemes(),
      api.getAuditLogs({ limit: 8 })
    ]).then(([analyticsData, schemesData, logsData]) => {
      setStats(analyticsData.kpis);
      setSchemes(schemesData);
      setAuditLogs(logsData);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-gov-slate-600">Loading system governance dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Ministry of Tribal Affairs | Central Administration
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              Portal Administration & Governance Console
            </h2>
            <p className="text-xs text-gov-slate-600 mt-1">
              Configure scheme rules, manage officer access, audit system events, and monitor national performance.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/schemes"
              className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-3 py-1.5 rounded text-xs"
            >
              Scheme Configurator
            </Link>
            <Link
              href="/admin/analytics"
              className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-navy font-semibold px-3 py-1.5 rounded text-xs"
            >
              Policy Analytics
            </Link>
          </div>
        </div>

        {/* Quick KPI Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-4 border-t border-gov-slate-200 text-xs">
            <div className="bg-gov-slate-50 border border-gov-slate-300 rounded p-3">
              <span className="text-gov-slate-500 block text-[11px]">Total Applications</span>
              <span className="text-lg font-bold text-gov-navy font-mono">{stats.total_applications}</span>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-3">
              <span className="text-gov-green block text-[11px] font-semibold">Approved Dockets</span>
              <span className="text-lg font-bold text-gov-green font-mono">{stats.approved_applications}</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <span className="text-gov-amber block text-[11px] font-semibold">Deficiency Rate</span>
              <span className="text-lg font-bold text-gov-amber font-mono">
                {Math.round((stats.deficient_applications / (stats.total_applications || 1)) * 100)}%
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <span className="text-gov-navy block text-[11px] font-semibold">DigiLocker Availability</span>
              <span className="text-lg font-bold text-gov-navy font-mono">{stats.digilocker_availability_pct}%</span>
            </div>

            <div className="bg-gov-slate-50 border border-gov-slate-300 rounded p-3">
              <span className="text-gov-slate-500 block text-[11px]">Avg Processing Time</span>
              <span className="text-lg font-bold text-gov-navy font-mono">{stats.average_verification_days} Days</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Active Schemes Configuration Card */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
            <h3 className="font-bold text-gov-navy text-sm">
              Configured Schemes ({schemes.length})
            </h3>
            <Link href="/admin/schemes" className="text-gov-navy font-semibold hover:underline text-[11px]">
              Manage Rules &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {schemes.map(s => (
              <div key={s.id} className="border border-gov-slate-200 rounded p-3 bg-gov-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-gov-navy text-xs">{s.name} ({s.scheme_code})</div>
                  <div className="text-[11px] text-gov-slate-600 mt-0.5">
                    Cutoff: {s.min_academic_percentage}% | Income Limit: INR {s.income_ceiling_inr ? s.income_ceiling_inr.toLocaleString('en-IN') : 'None'}
                  </div>
                </div>
                <Link
                  href={`/admin/schemes/${s.id}`}
                  className="bg-white hover:bg-gov-slate-100 border border-gov-slate-300 px-2.5 py-1 rounded font-semibold text-gov-navy text-[11px]"
                >
                  Edit Policy
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Live Immutable Audit Feed */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2">
            <h3 className="font-bold text-gov-navy text-sm">
              Recent System Audit Events
            </h3>
            <Link href="/admin/audit" className="text-gov-navy font-semibold hover:underline text-[11px]">
              Full Audit Trail &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {auditLogs.map(l => (
              <div key={l.id} className="border-b border-gov-slate-100 pb-1.5 last:border-0 flex justify-between items-start text-[11px]">
                <div>
                  <span className="font-mono font-bold text-gov-navy block">{l.action}</span>
                  <span className="text-gov-slate-500">
                    {l.actor_email || 'System'} ({l.actor_role})
                  </span>
                </div>
                <span className="text-gov-slate-400 font-mono text-[10px]">
                  {new Date(l.timestamp).toLocaleTimeString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
