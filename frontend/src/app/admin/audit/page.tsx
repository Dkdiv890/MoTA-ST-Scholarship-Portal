'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    api.getAuditLogs({
      action: actionFilter || undefined,
      role: roleFilter || undefined,
      limit: 100,
    }).then(data => setLogs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, roleFilter]);

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Statutory Provenance & Security Compliance
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              Immutable System Audit Trail
            </h2>
            <p className="text-xs text-gov-slate-600 mt-1">
              Complete, tamper-evident chronological event log tracking authentications, S-OTR updates, DigiLocker handshakes, AI runs, and officer decisions.
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs"
            >
              <option value="">All Actor Roles</option>
              <option value="student">Student Events</option>
              <option value="officer">Officer Events</option>
              <option value="admin">Admin Events</option>
              <option value="system">System Engine Events</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs"
            >
              <option value="">All Actions</option>
              <option value="USER_LOGIN">User Logins</option>
              <option value="APPLICATION_SUBMITTED">Applications Submitted</option>
              <option value="DIGILOCKER_VERIFICATION_COMPLETED">DigiLocker Events</option>
              <option value="AI_DOCUMENT_VERIFICATION_PROCESSED">AI Verifications</option>
              <option value="OFFICER_REVIEW_DECISION">Officer Actions</option>
              <option value="DEFICIENT_DOCUMENT_RESUBMITTED">Deficiency Resubmissions</option>
              <option value="SCHEME_CONFIG_UPDATED">Scheme Changes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        {loading ? (
          <div className="py-12 text-center text-gov-slate-600">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gov-slate-500">No audit events matched the filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gov-slate-100 text-gov-slate-700 uppercase tracking-wider font-semibold border-b border-gov-slate-300 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (IST)</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Entity Target</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Event Payload Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-slate-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gov-slate-50">
                    <td className="py-3 px-3 font-mono text-gov-slate-600 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gov-slate-900">{log.actor_email || 'System Daemon'}</div>
                      <span className="font-mono text-[10px] uppercase font-bold text-gov-navy px-1 py-0.2 bg-gov-slate-100 rounded">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-gov-navy text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-3 px-3 font-mono text-gov-slate-700">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>
                    <td className="py-3 px-3 font-mono text-gov-slate-500 text-[11px]">
                      {log.ip_address}
                    </td>
                    <td className="py-3 px-3">
                      <pre className="font-mono text-[10px] bg-gov-slate-50 border border-gov-slate-200 rounded p-1.5 max-w-xs truncate text-gov-slate-700">
                        {JSON.stringify(log.details)}
                      </pre>
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
