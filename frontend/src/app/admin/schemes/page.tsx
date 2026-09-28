'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AdminSchemesListPage() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminSchemes()
      .then(data => setSchemes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Scheme Policy Administration
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              Scholarship Scheme Configurator
            </h2>
            <p className="text-xs text-gov-slate-600 mt-1">
              Configure scheme rules, income ceilings, cutoff percentages, and mandatory document requirements without application redeployment.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {schemes.map(s => (
          <div key={s.id} className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-gov-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold bg-gov-slate-100 text-gov-navy px-2 py-0.5 rounded border border-gov-slate-300">
                  {s.scheme_code}
                </span>
                <h3 className="text-base font-bold text-gov-navy mt-1">{s.name}</h3>
              </div>
              <StatusBadge status={s.is_active ? 'Active' : 'Inactive'} />
            </div>

            <p className="text-gov-slate-600 leading-relaxed">
              {s.description}
            </p>

            <div className="bg-gov-slate-50 border border-gov-slate-200 rounded p-3 space-y-1.5 text-gov-slate-800">
              <div><strong>Income Ceiling:</strong> INR {s.income_ceiling_inr ? s.income_ceiling_inr.toLocaleString('en-IN') : 'None'} (Configurable Prototype Rule)</div>
              <div><strong>Min Academic Cutoff:</strong> {s.min_academic_percentage}%</div>
              <div><strong>Deadline:</strong> {s.application_deadline || '31 Dec 2026'}</div>
              <div>
                <strong>Mandatory Documents ({s.required_documents?.length || 0}):</strong>
                <div className="text-[11px] text-gov-slate-600 font-mono mt-0.5">
                  {s.required_documents?.map((d: any) => d.document_type).join(', ')}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gov-slate-200">
              <Link
                href={`/admin/schemes/${s.id}`}
                className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-4 py-2 rounded text-xs transition-colors"
              >
                Configure Scheme Parameters &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
