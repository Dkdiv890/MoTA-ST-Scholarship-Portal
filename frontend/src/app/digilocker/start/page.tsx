'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function DigiLockerStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('application_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) {
      setError('Missing application_id parameter.');
      setLoading(false);
      return;
    }

    api.startDigiLockerSession(appId)
      .then(res => {
        // Redirect to authorization URL (demo sandbox or production)
        router.push(res.auth_url);
      })
      .catch(err => {
        setError(err.message || 'Failed to initiate DigiLocker session.');
        setLoading(false);
      });
  }, [appId, router]);

  return (
    <div className="max-w-md mx-auto my-16 bg-white border border-gov-slate-300 rounded shadow-sm p-8 text-center text-xs space-y-4">
      <div className="w-12 h-12 rounded-full border-2 border-gov-navy flex items-center justify-center font-bold text-gov-navy mx-auto text-sm">
        DL
      </div>
      <h2 className="text-base font-bold text-gov-navy">
        Connecting to DigiLocker / NAD Gateway...
      </h2>
      <p className="text-gov-slate-600">
        Initiating secure OAuth2 handshake with National Academic Depository. Please wait...
      </p>
      {error && (
        <div className="bg-red-50 text-gov-red border border-red-300 p-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
