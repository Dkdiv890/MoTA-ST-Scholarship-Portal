'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';

export default function AdminEditSchemePage() {
  const params = useParams();
  const router = useRouter();
  const schemeId = parseInt(params?.id as string);

  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    income_ceiling_inr: '',
    min_academic_percentage: '',
    application_deadline: '',
    is_active: true,
  });

  useEffect(() => {
    if (!schemeId) return;
    api.getAdminSchemes()
      .then(schemes => {
        const s = schemes.find((x: any) => x.id === schemeId);
        if (s) {
          setScheme(s);
          setFormData({
            name: s.name,
            description: s.description,
            income_ceiling_inr: s.income_ceiling_inr ? String(s.income_ceiling_inr) : '',
            min_academic_percentage: String(s.min_academic_percentage),
            application_deadline: s.application_deadline || '',
            is_active: s.is_active,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [schemeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    try {
      await api.updateSchemeConfig(schemeId, {
        name: formData.name,
        description: formData.description,
        income_ceiling_inr: formData.income_ceiling_inr ? parseFloat(formData.income_ceiling_inr) : null,
        min_academic_percentage: parseFloat(formData.min_academic_percentage),
        application_deadline: formData.application_deadline,
        is_active: formData.is_active,
      });
      setSuccess('Scheme configuration and deterministic rule engine thresholds updated successfully.');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-gov-slate-600">Loading scheme policy details...</div>;
  }

  if (!scheme) {
    return <div className="py-12 text-center text-xs text-gov-red">Scheme not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-xs">
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex justify-between items-center border-b border-gov-slate-200 pb-3 mb-4">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Scheme Rule Configuration
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              Edit Policy Parameters: <span className="font-mono">{scheme.scheme_code}</span>
            </h2>
          </div>
          <Link
            href="/admin/schemes"
            className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-semibold px-3 py-1.5 rounded"
          >
            &larr; Back to Schemes
          </Link>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-300 text-gov-green p-3 rounded mb-4 font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gov-slate-700 font-semibold mb-1">
              Official Scheme Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-gov-slate-700 font-semibold mb-1">
              Scheme Description *
            </label>
            <textarea
              name="description"
              rows={3}
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gov-slate-700 font-semibold mb-1">
                Annual Family Income Ceiling (INR)
              </label>
              <input
                type="number"
                name="income_ceiling_inr"
                value={formData.income_ceiling_inr}
                onChange={handleChange}
                placeholder="e.g. 600000"
                className="w-full text-xs"
              />
              <span className="text-[11px] text-gov-slate-500">
                Rule engine automatically rejects profiles with income exceeding this ceiling.
              </span>
            </div>

            <div>
              <label className="block text-gov-slate-700 font-semibold mb-1">
                Minimum Qualifying Academic Cutoff (%) *
              </label>
              <input
                type="number"
                step="0.1"
                name="min_academic_percentage"
                required
                value={formData.min_academic_percentage}
                onChange={handleChange}
                className="w-full text-xs"
              />
              <span className="text-[11px] text-gov-slate-500">
                Qualifying degree Master's score requirement.
              </span>
            </div>

            <div>
              <label className="block text-gov-slate-700 font-semibold mb-1">
                Application Deadline (YYYY-MM-DD) *
              </label>
              <input
                type="text"
                name="application_deadline"
                value={formData.application_deadline}
                onChange={handleChange}
                placeholder="2026-12-31"
                className="w-full text-xs"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 cursor-pointer font-semibold text-gov-navy">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span>Scheme Active for New Applications</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gov-slate-200 gap-2">
            <Link
              href="/admin/schemes"
              className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-medium px-4 py-2 rounded text-xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-5 py-2 rounded text-xs transition-colors"
            >
              {saving ? 'Updating Rule Engine...' : 'Save & Sync Rule Engine \u2192'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
