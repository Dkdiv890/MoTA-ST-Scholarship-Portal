'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getStudentDashboard()
      .then(data => setDashboard(data))
      .catch(err => {
        setError(err.message || 'Please log in as a student.');
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-gov-slate-600">
        Loading student dashboard...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="py-12 text-center text-xs text-gov-red">
        {error || 'Unable to load dashboard.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Official S-OTR Identity Header Card */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gov-slate-200 pb-4 mb-4">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Student One-Time Registration Profile
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              {dashboard.full_name}
            </h2>
            <div className="text-xs text-gov-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Email:</strong> {dashboard.email}</span>
              <span><strong>Community:</strong> {dashboard.tribe || 'ST Community'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-gov-slate-500 block">Permanent Student ID</span>
            <span className="text-lg font-mono font-bold text-gov-navy tabular-nums bg-gov-slate-100 border border-gov-slate-300 px-3 py-1 rounded inline-block">
              {dashboard.student_id}
            </span>
          </div>
        </div>

        {/* Profile Completion & Verification Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div>
            <span className="text-gov-slate-500 block mb-1">S-OTR Profile Completion</span>
            <div className="w-full bg-gov-slate-200 rounded-full h-2.5 mb-1">
              <div
                className="bg-gov-navy h-2.5 rounded-full"
                style={{ width: `${dashboard.profile_completion_pct}%` }}
              />
            </div>
            <span className="font-semibold text-gov-navy">{dashboard.profile_completion_pct}% Completed</span>
          </div>

          <div>
            <span className="text-gov-slate-500 block mb-1">Overall Profile Status</span>
            <StatusBadge status={dashboard.overall_verification_status} size="md" />
          </div>

          <div className="flex items-center md:justify-end gap-2">
            <Link
              href="/student/profile"
              className="bg-gov-navy hover:bg-gov-navy-light text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-colors"
            >
              My Verified Profile
            </Link>
            <Link
              href="/student/scholarships"
              className="bg-white hover:bg-gov-slate-100 border border-gov-slate-300 text-gov-navy text-xs font-semibold px-3.5 py-1.5 rounded transition-colors"
            >
              Apply for Scholarship
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications Notice Banner if any */}
      {dashboard.notifications && dashboard.notifications.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-gov-navy p-3 text-xs space-y-1">
          <div className="font-bold text-gov-navy">Recent In-Portal Notices</div>
          {dashboard.notifications.map((n: any) => (
            <div key={n.id} className="text-gov-slate-700">
              <span className="font-semibold">{n.title}:</span> {n.message}
            </div>
          ))}
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex justify-between items-center border-b border-gov-slate-200 pb-3 mb-4">
          <h3 className="font-bold text-gov-navy text-sm">
            My Fellowship & Scholarship Applications
          </h3>
          <Link
            href="/student/scholarships"
            className="text-xs text-gov-navy font-semibold hover:underline"
          >
            Discover Schemes &rarr;
          </Link>
        </div>

        {dashboard.applications.length === 0 ? (
          <div className="text-center py-8 text-xs text-gov-slate-500">
            No applications submitted yet. Visit the <Link href="/student/scholarships" className="text-gov-navy font-semibold underline">Scholarship Finder</Link> to check your eligibility and apply.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gov-slate-100 text-gov-slate-700 uppercase tracking-wider font-semibold border-b border-gov-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Scheme Name</th>
                  <th className="py-2.5 px-3">Current Verification Stage</th>
                  <th className="py-2.5 px-3">Statutory Status</th>
                  <th className="py-2.5 px-3">Submitted On</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-slate-200">
                {dashboard.applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-gov-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-gov-navy">
                      {app.application_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gov-slate-800">{app.scheme_name}</div>
                      <div className="text-[11px] text-gov-slate-500 font-mono">{app.scheme_code}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-gov-slate-700">{app.current_stage}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="py-2.5 px-3 text-gov-slate-600">
                      {new Date(app.submitted_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/student/applications/${app.application_id}`}
                        className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-navy font-semibold px-2.5 py-1 rounded transition-colors text-[11px]"
                      >
                        Track / View
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
