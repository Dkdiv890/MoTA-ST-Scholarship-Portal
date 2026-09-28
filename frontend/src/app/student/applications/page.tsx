'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function MyApplicationsListPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyApplications()
      .then(data => setApps(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Ministry of Tribal Affairs
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              My Scholarship & Fellowship Applications
            </h2>
            <p className="text-xs text-gov-slate-600 mt-1">
              Track the live multi-tier verification lifecycle of your submitted applications.
            </p>
          </div>

          <Link
            href="/student/scholarships"
            className="bg-gov-navy hover:bg-gov-navy-light text-white text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            Apply for New Scheme
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-gov-slate-600">Loading submitted applications...</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12 text-xs text-gov-slate-500">
            No applications found. Explore schemes in the{' '}
            <Link href="/student/scholarships" className="text-gov-navy font-semibold underline">
              Scholarship Finder
            </Link>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gov-slate-100 text-gov-slate-700 uppercase tracking-wider font-semibold border-b border-gov-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Scheme</th>
                  <th className="py-2.5 px-3">Verification Stage</th>
                  <th className="py-2.5 px-3">Statutory Status</th>
                  <th className="py-2.5 px-3">Submitted On</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-slate-200">
                {apps.map(app => (
                  <tr key={app.id} className="hover:bg-gov-slate-50">
                    <td className="py-3 px-3 font-mono font-semibold text-gov-navy">
                      {app.application_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gov-slate-900">{app.scheme_name}</div>
                      <div className="text-[11px] text-gov-slate-500 font-mono">{app.scheme_code}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gov-slate-700">
                      {app.current_stage}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="py-3 px-3 text-gov-slate-600">
                      {new Date(app.submitted_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/student/applications/${app.application_id}`}
                        className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-navy font-semibold px-3 py-1.5 rounded transition-colors text-xs"
                      >
                        Track Progress &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
