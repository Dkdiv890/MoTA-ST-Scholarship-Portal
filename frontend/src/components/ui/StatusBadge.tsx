import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const norm = (status || '').toLowerCase().trim();

  let colorClasses = 'bg-gov-slate-100 text-gov-slate-800 border-gov-slate-300';

  if (
    norm === 'verified' ||
    norm === 'approved' ||
    norm === 'eligible' ||
    norm === 'record_found' ||
    norm === 'success' ||
    norm === 'resolved'
  ) {
    colorClasses = 'bg-green-50 text-gov-green border-green-300 font-semibold';
  } else if (
    norm === 'deficiency raised' ||
    norm === 'deficient' ||
    norm === 'needs update' ||
    norm === 'action required' ||
    norm === 'renewal required'
  ) {
    colorClasses = 'bg-amber-50 text-gov-amber border-amber-300 font-semibold';
  } else if (
    norm === 'rejected' ||
    norm === 'not eligible' ||
    norm === 'expired' ||
    norm === 'failed'
  ) {
    colorClasses = 'bg-red-50 text-gov-red border-red-300 font-semibold';
  } else if (
    norm === 'under verification' ||
    norm === 'pending' ||
    norm === 'submitted' ||
    norm === 'eligibility checked' ||
    norm === 'officer review' ||
    norm === 'ai verified' ||
    norm === 'digilocker verified' ||
    norm === 'digilocker fallback'
  ) {
    colorClasses = 'bg-blue-50 text-gov-navy border-blue-200';
  } else if (
    norm === 'record_not_found' ||
    norm === 'service_unavailable' ||
    norm === 'fallback active'
  ) {
    colorClasses = 'bg-yellow-50 text-yellow-800 border-yellow-300';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wide border rounded ${sizeClasses} ${colorClasses} tabular-nums`}
    >
      {status}
    </span>
  );
}
