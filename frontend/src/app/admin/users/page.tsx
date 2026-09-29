'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.getAdminUsers(roleFilter || undefined)
      .then(data => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleActive = async (userId: number) => {
    try {
      await api.toggleUserStatus(userId);
      fetchUsers();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Identity & Access Management
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              User Directory & Role Administration
            </h2>
            <p className="text-xs text-gov-slate-600 mt-1">
              Manage accounts for Students, Regional Scrutiny Officers, and Central Administrators.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-gov-slate-700">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs"
            >
              <option value="">All User Roles</option>
              <option value="student">Students (S-OTR)</option>
              <option value="officer">Scrutiny Officers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 text-xs">
        {loading ? (
          <div className="py-12 text-center text-gov-slate-600">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gov-slate-100 text-gov-slate-700 uppercase tracking-wider font-semibold border-b border-gov-slate-300 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Full Name & Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Linked Student ID</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-slate-200">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gov-slate-50">
                    <td className="py-3 px-3 font-mono text-gov-slate-500">#{u.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gov-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-gov-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono uppercase font-semibold text-gov-navy text-[11px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-gov-navy">
                      {u.student_id || 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={u.is_active ? 'Active' : 'Deactivated'} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u.id)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors ${
                          u.is_active
                            ? 'bg-red-50 text-gov-red border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-gov-green border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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
