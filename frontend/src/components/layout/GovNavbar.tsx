'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredUser } from '@/lib/api';

export default function GovNavbar() {
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

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-gov-navy text-white border-b border-gov-navy-dark no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center space-x-1 text-xs md:text-sm font-medium">
        <Link
          href="/"
          className={`px-3 py-2.5 transition-colors ${
            pathname === '/' ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
          }`}
        >
          Home
        </Link>

        {user?.role === 'student' && (
          <>
            <Link
              href="/student/dashboard"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/student/dashboard') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Student Dashboard
            </Link>
            <Link
              href="/student/profile"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/student/profile') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              My Verified Profile (S-OTR)
            </Link>
            <Link
              href="/student/documents"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/student/documents') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Document Vault
            </Link>
            <Link
              href="/student/scholarships"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/student/scholarships') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Scholarship Finder
            </Link>
            <Link
              href="/student/applications"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/student/applications') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              My Applications
            </Link>
          </>
        )}

        {user?.role === 'officer' && (
          <>
            <Link
              href="/officer/dashboard"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/officer') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Officer Verification Workbench
            </Link>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <Link
              href="/admin/dashboard"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/admin/dashboard') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Admin Dashboard
            </Link>
            <Link
              href="/admin/schemes"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/admin/schemes') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Scheme Configurator
            </Link>
            <Link
              href="/admin/users"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/admin/users') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              User Directory
            </Link>
            <Link
              href="/admin/audit"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/admin/audit') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Audit Trail
            </Link>
            <Link
              href="/admin/analytics"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/admin/analytics') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Policy Analytics
            </Link>
          </>
        )}

        {!user && (
          <>
            <Link
              href="/student/scholarships"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/student/scholarships') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Scholarship Schemes
            </Link>
            <Link
              href="/otr"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/otr') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Student One-Time Registration (S-OTR)
            </Link>
            <Link
              href="/login"
              className={`px-3 py-2.5 transition-colors ${
                isActive('/login') ? 'bg-gov-navy-light text-white font-semibold' : 'text-gov-slate-200 hover:bg-gov-navy-light'
              }`}
            >
              Login / Verify
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
