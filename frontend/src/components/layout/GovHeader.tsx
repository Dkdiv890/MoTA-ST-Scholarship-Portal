'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredUser, clearAuthToken } from '@/lib/api';

export default function GovHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const update = () => setUser(getStoredUser());
    update();
    window.addEventListener('storage', update);
    window.addEventListener('auth-changed', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('auth-changed', update);
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="border-b border-gov-slate-300 bg-white no-print">
      {/* Top National Ribbon */}
      <div className="h-1 bg-gradient-to-r from-gov-saffron via-white to-gov-green" />

      {/* Official Government Metadata Bar */}
      <div className="bg-gov-slate-100 border-b border-gov-slate-200 px-4 py-1 text-xs text-gov-slate-600 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gov-slate-800">GOVERNMENT OF INDIA</span>
          <span>|</span>
          <span>MINISTRY OF TRIBAL AFFAIRS</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Smart India Hackathon Prototype</span>
          <span>|</span>
          <span className="text-gov-slate-700">Official Portal Version 1.0</span>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center space-x-3">
          {/* Emblem Placeholder / Seal */}
          <div className="w-12 h-12 rounded border-2 border-gov-navy flex items-center justify-center bg-gov-navy text-white font-bold text-xs tracking-wider text-center p-1 leading-tight">
            MOTA GOV
          </div>
          <div>
            <Link href="/" className="hover:opacity-95">
              <h1 className="text-lg md:text-xl font-bold text-gov-navy tracking-tight leading-tight">
                National ST Scholarship & Fellowship Management System
              </h1>
              <p className="text-xs text-gov-slate-600 font-medium">
                Ministry of Tribal Affairs | National Fellowship (NFST) & Overseas Scholarship (NOS)
              </p>
            </Link>
          </div>
        </div>

        {/* User Account / Navigation Action */}
        <div className="flex items-center space-x-3 text-xs">
          {user ? (
            <div className="flex items-center space-x-3 bg-gov-slate-100 border border-gov-slate-300 rounded px-3 py-1.5">
              <div className="text-right">
                <div className="font-bold text-gov-navy">{user.full_name}</div>
                <div className="text-gov-slate-600 capitalize">Role: {user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-800 font-medium px-2.5 py-1 rounded transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="bg-gov-navy hover:bg-gov-navy-light text-white font-medium px-3.5 py-1.5 rounded transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-white hover:bg-gov-slate-100 border border-gov-slate-300 text-gov-navy font-medium px-3.5 py-1.5 rounded transition-colors"
              >
                S-OTR Registration
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
