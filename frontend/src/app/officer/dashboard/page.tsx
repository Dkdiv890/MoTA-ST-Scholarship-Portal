'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getStoredUser } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function OfficerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [schemeCode, setSchemeCode] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchApplications = () => {
    setLoading(true);
    api.getOfficerApplications({
      filter_status: filterStatus || undefined,
      scheme_code: schemeCode || undefined,
      search: search || undefined,
      page,
      limit: 25,
    }).then(res => {
      setApplications(res.items);
      setTotalCount(res.total);
    }).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== 'officer' && user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    api.getOfficerDashboardStats().then(data => setStats(data.metrics)).catch(() => {});
    fetchApplications();
  }, [filterStatus, schemeCode, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Ministry of Tribal Affairs | Scrutiny Division
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              Officer Verification & Scrutiny Workbench
            </h2>
            <p className="text-xs text-gov-slate-600 mt-1">
              Statutory verification of fellowship applications with side-by-side document scrutiny and advisory AI evidence.
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-gov-slate-500 block">Designated Nodal Officer</span>
            <span className="font-bold text-gov-navy font-mono">MoTA Scrutiny Cell</span>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6 pt-4 border-t border-gov-slate-200 text-xs">
            <div className="bg-gov-slate-50 border border-gov-slate-300 rounded p-3">
              <span className="text-gov-slate-500 block text-[11px]">Total Applications</span>
              <span className="text-lg font-bold text-gov-navy font-mono">{stats.total_applications}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <span className="text-gov-slate-500 block text-[11px]">Pending Scrutiny</span>
              <span className="text-lg font-bold text-gov-navy font-mono">{stats.pending_scrutiny}</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <span className="text-gov-amber block text-[11px] font-semibold">Deficient Cases</span>
              <span className="text-lg font-bold text-gov-amber font-mono">{stats.deficient_cases}</span>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-3">
              <span className="text-gov-green block text-[11px] font-semibold">Approved</span>
              <span className="text-lg font-bold text-gov-green font-mono">{stats.approved_applications}</span>
            </div>

            <div className="bg-gov-slate-50 border border-gov-slate-300 rounded p-3">
              <span className="text-gov-slate-500 block text-[11px]">NFST Fellowship</span>
              <span className="text-lg font-bold text-gov-navy font-mono">{stats.nfst_count}</span>
            </div>

            <div className="bg-gov-slate-50 border border-gov-slate-300 rounded p-3">
              <span className="text-gov-slate-500 block text-[11px]">NOS Overseas</span>
              <span className="text-lg font-bold text-gov-navy font-mono">{stats.nos_count}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-4 text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { label: 'All Dockets', val: '' },
              { label: 'Under Verification', val: 'Under Verification' },
              { label: 'Deficiency Raised', val: 'Deficiency Raised' },
              { label: 'Submitted', val: 'Submitted' },
              { label: 'Verified / Approved', val: 'Approved' },
              { label: 'Rejected', val: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.label}
                type="button"
                onClick={() => { setFilterStatus(tab.val); setPage(1); }}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  filterStatus === tab.val
                    ? 'bg-gov-navy text-white font-semibold'
                    : 'bg-gov-slate-100 hover:bg-gov-slate-200 text-gov-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scheme Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-gov-slate-600 font-semibold">Scheme:</span>
            <select
              value={schemeCode}
              onChange={(e) => { setSchemeCode(e.target.value); setPage(1); }}
              className="text-xs"
            >
              <option value="">All Schemes (NFST & NOS)</option>
              <option value="NFST">NFST Only</option>
              <option value="NOS">NOS Only</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2 border-t border-gov-slate-200">
          <input
            type="text"
            placeholder="Search by Application ID (e.g. APP20260001), Student ID (ST-2026-000001), Name, or Tribe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs"
          />
          <button
            type="submit"
            className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-4 py-2 rounded text-xs"
          >
            Search Docket
          </button>
        </form>
      </div>

      {/* Scrutiny Queue Table */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 text-xs">
        <div className="flex justify-between items-center border-b border-gov-slate-200 pb-3 mb-4">
          <h3 className="font-bold text-gov-navy text-sm">
            Scrutiny Docket Queue ({totalCount} Applications Found)
          </h3>
          <span className="text-gov-slate-500 text-[11px]">
            Showing Page {page} (25 records per page)
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gov-slate-600">Loading scrutiny docket records...</div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-gov-slate-500">No applications matched the filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gov-slate-100 text-gov-slate-700 uppercase tracking-wider font-semibold border-b border-gov-slate-300 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Student Name & ID</th>
                  <th className="py-2.5 px-3">Tribe / State</th>
                  <th className="py-2.5 px-3">Scheme</th>
                  <th className="py-2.5 px-3">DigiLocker / NAD</th>
                  <th className="py-2.5 px-3">AI Flags</th>
                  <th className="py-2.5 px-3">Statutory Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-slate-200">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-gov-slate-50">
                    <td className="py-3 px-3 font-mono font-semibold text-gov-navy">
                      {app.application_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gov-slate-900">{app.student_name}</div>
                      <div className="font-mono text-[11px] text-gov-slate-500">{app.student_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-gov-slate-800">{app.tribe}</div>
                      <div className="text-[11px] text-gov-slate-500">{app.state}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-gov-navy px-1.5 py-0.5 bg-gov-slate-100 border border-gov-slate-300 rounded text-[11px]">
                        {app.scheme_code}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={app.digilocker_status} />
                    </td>
                    <td className="py-3 px-3">
                      {app.ai_flags_count > 0 ? (
                        <span className="bg-amber-100 text-gov-amber font-semibold px-2 py-0.5 rounded text-[11px] border border-amber-300">
                          {app.ai_flags_count} Flags
                        </span>
                      ) : (
                        <span className="text-gov-green font-medium text-[11px]">0 Flags</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/officer/applications/${app.application_id}`}
                        className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-3 py-1.5 rounded transition-colors text-xs inline-block"
                      >
                        Scrutinize &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gov-slate-200 text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 px-3 py-1.5 rounded disabled:opacity-50"
          >
            &larr; Previous Page
          </button>

          <span className="text-gov-slate-600 font-medium">Page {page}</span>

          <button
            type="button"
            disabled={page * 25 >= totalCount}
            onClick={() => setPage(p => p + 1)}
            className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 px-3 py-1.5 rounded disabled:opacity-50"
          >
            Next Page &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
