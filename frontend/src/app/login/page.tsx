'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.user.role === 'officer') {
        router.push('/officer/dashboard');
      } else if (res.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto my-8">
      {/* Official Form Container */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="border-b border-gov-slate-200 pb-3 mb-5">
          <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
            Ministry of Tribal Affairs
          </span>
          <h2 className="text-xl font-bold text-gov-navy mt-0.5">
            Single-Window Portal Sign In
          </h2>
          <p className="text-xs text-gov-slate-600 mt-1">
            Access your verified profile, application status, or scrutiny workbench.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-gov-red text-xs p-3 rounded mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gov-slate-700 font-semibold mb-1">
              Registered Email ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student0001@example.edu"
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-gov-slate-700 font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gov-navy hover:bg-gov-navy-light text-white font-semibold py-2.5 rounded transition-colors text-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gov-slate-200 text-center text-xs text-gov-slate-600">
          First-time student?{' '}
          <Link href="/otr" className="text-gov-navy font-semibold underline hover:text-gov-navy-light">
            Complete Student S-OTR
          </Link>
        </div>
      </div>

      {/* Quick Access Sandbox Account Switcher */}
      <div className="mt-6 bg-gov-slate-100 border border-gov-slate-300 rounded p-4 text-xs">
        <div className="font-bold text-gov-navy mb-2">
          Demo Persona Switcher (For Evaluation & Scrutiny Testing)
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('student0001@example.edu', 'Student@123')}
            className="w-full text-left bg-white hover:bg-gov-slate-200 border border-gov-slate-300 rounded p-2 text-xs flex justify-between items-center transition-colors"
          >
            <div>
              <div className="font-semibold text-gov-navy">Student: Sakshi Sahu (ST00001)</div>
              <div className="text-gov-slate-500 text-[11px]">student0001@example.edu | Tribe: Oraon</div>
            </div>
            <span className="text-[11px] font-semibold text-gov-navy underline">Load</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('officer.delhi@tribal.gov.in', 'Officer@MoTA2026')}
            className="w-full text-left bg-white hover:bg-gov-slate-200 border border-gov-slate-300 rounded p-2 text-xs flex justify-between items-center transition-colors"
          >
            <div>
              <div className="font-semibold text-gov-navy">Nodal Officer: Rajeshwar Meena</div>
              <div className="text-gov-slate-500 text-[11px]">officer.delhi@tribal.gov.in | Scrutiny Officer</div>
            </div>
            <span className="text-[11px] font-semibold text-gov-navy underline">Load</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('admin@tribal.gov.in', 'Admin@MoTA2026')}
            className="w-full text-left bg-white hover:bg-gov-slate-200 border border-gov-slate-300 rounded p-2 text-xs flex justify-between items-center transition-colors"
          >
            <div>
              <div className="font-semibold text-gov-navy">Administrator: MoTA Central Admin</div>
              <div className="text-gov-slate-500 text-[11px]">admin@tribal.gov.in | System Governance</div>
            </div>
            <span className="text-[11px] font-semibold text-gov-navy underline">Load</span>
          </button>
        </div>
      </div>
    </div>
  );
}
