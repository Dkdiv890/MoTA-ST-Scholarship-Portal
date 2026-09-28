'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function DigiLockerCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('application_id') || 'APP20260001';
  const branch = searchParams.get('branch') || 'BRANCH_A';

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Step progression simulation
    const timer1 = setTimeout(() => setCurrentStep(2), 500);
    const timer2 = setTimeout(() => setCurrentStep(3), 1000);

    // Call backend API to process token exchange and trigger AI document verification
    api.processDigiLockerConsent(appId, branch)
      .then(() => {
        setTimeout(() => {
          setCurrentStep(4);
          setTimeout(() => {
            router.push(`/student/applications/${appId}`);
          }, 1000);
        }, 1500);
      })
      .catch(err => {
        setError(err.message || 'Token exchange failed.');
      });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [appId, branch, router]);

  return (
    <div className="max-w-md mx-auto my-16 bg-white border border-gov-slate-300 rounded shadow-sm p-8 text-center text-xs space-y-6">
      <div className="w-12 h-12 rounded-full border-2 border-gov-navy flex items-center justify-center font-bold text-gov-navy mx-auto text-sm">
        GOV
      </div>

      <div>
        <h2 className="text-base font-bold text-gov-navy">
          Processing National Verification Handshake
        </h2>
        <p className="text-gov-slate-600 mt-1">
          Returned from DigiLocker / NAD. Executing mandatory multi-tier verification...
        </p>
      </div>

      {error ? (
        <div className="space-y-3">
          <div className="bg-red-50 text-gov-red border border-red-300 p-3 rounded font-medium">
            {error}
          </div>
          <button
            type="button"
            onClick={() => router.push(`/student/applications/${appId}`)}
            className="bg-gov-navy hover:bg-gov-navy-light text-white px-4 py-2 rounded font-semibold text-xs transition-colors"
          >
            Return to Application Docket &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-3 text-left bg-gov-slate-50 border border-gov-slate-200 rounded p-4">
          <div className="flex items-center space-x-2">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 1 ? 'bg-gov-green text-white' : 'bg-gov-slate-300'}`}>
              ✓
            </span>
            <span className={currentStep >= 1 ? 'font-semibold text-gov-navy' : 'text-gov-slate-500'}>
              1. OAuth2 State & Nonce Authenticated
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 2 ? 'bg-gov-green text-white' : 'bg-gov-slate-300'}`}>
              ✓
            </span>
            <span className={currentStep >= 2 ? 'font-semibold text-gov-navy' : 'text-gov-slate-500'}>
              2. DigiLocker / NAD Status Recorded ({branch === 'BRANCH_A' ? 'Record Found' : 'Fallback Active'})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 3 ? 'bg-gov-green text-white' : 'bg-gov-slate-300'}`}>
              ✓
            </span>
            <span className={currentStep >= 3 ? 'font-semibold text-gov-navy' : 'text-gov-slate-500'}>
              3. Mandatory AI / OCR Document Verification Executed
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 4 ? 'bg-gov-green text-white' : 'bg-gov-slate-300'}`}>
              ✓
            </span>
            <span className={currentStep >= 4 ? 'font-semibold text-gov-navy' : 'text-gov-slate-500'}>
              4. Docket Submitted to Human Officer Review
            </span>
          </div>
        </div>
      )}

      <div className="text-[11px] text-gov-slate-500">
        Redirecting to Application Tracking Workbench...
      </div>
    </div>
  );
}
