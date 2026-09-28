'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function SchemeApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const schemeCode = (params?.id as string)?.toUpperCase();

  const [scheme, setScheme] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scheme Specific Inputs
  const [schemeSpecific, setSchemeSpecific] = useState<any>({
    // NFST
    research_topic: 'Sustainable Forest Resource Management and Tribal Livelihoods',
    supervisor_name: 'Dr. Rameshwar Singh, Professor of Environmental Science',
    fellowship_category: 'Ph.D. Full-Time Fellowship',
    // NOS
    target_country: 'United Kingdom',
    foreign_university: 'University of Oxford',
    qs_ranking: '3',
    course_duration_months: '36',
  });

  useEffect(() => {
    if (!schemeCode) return;

    Promise.all([
      api.getSchemes(),
      api.getStudentProfile(),
      api.checkSchemeEligibility(schemeCode)
    ]).then(([schemesList, profData, eligData]) => {
      const s = schemesList.find((x: any) => x.scheme_code === schemeCode);
      setScheme(s);
      setProfile(profData);
      setEligibility(eligData);
    }).catch(err => {
      setError(err.message || 'Failed to load scheme and verified profile data.');
    }).finally(() => {
      setLoading(false);
    });
  }, [schemeCode]);

  const handleSchemeSpecificChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSchemeSpecific({
      ...schemeSpecific,
      [e.target.name]: e.target.value
    });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility?.is_eligible) {
      alert('You cannot submit an application because you do not meet statutory eligibility criteria.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = schemeCode === 'NFST' ? {
        research_topic: schemeSpecific.research_topic,
        supervisor_name: schemeSpecific.supervisor_name,
        fellowship_category: schemeSpecific.fellowship_category,
      } : {
        target_country: schemeSpecific.target_country,
        foreign_university: schemeSpecific.foreign_university,
        qs_ranking: parseInt(schemeSpecific.qs_ranking || '50'),
        course_duration_months: parseInt(schemeSpecific.course_duration_months || '24'),
      };

      const res = await api.createApplication(schemeCode, payload);
      // Fixed sequence: proceed immediately to DigiLocker / NAD Consent
      router.push(`/digilocker/start?application_id=${res.application_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-gov-slate-600">Loading pre-filled scheme application...</div>;
  }

  if (error || !scheme || !profile) {
    return (
      <div className="py-12 text-center text-xs text-gov-red">
        {error || 'Scheme or profile not found.'}
        <div className="mt-4">
          <Link href="/student/scholarships" className="text-gov-navy underline">
            &larr; Return to Scholarship Finder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gov-slate-200 pb-3 mb-4">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Ministry of Tribal Affairs
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              Apply for {scheme.name} ({scheme.scheme_code})
            </h2>
          </div>
          <StatusBadge status={eligibility.is_eligible ? 'Eligible' : 'Not Eligible'} size="md" />
        </div>

        <p className="text-xs text-gov-slate-600 leading-relaxed">
          {scheme.description}
        </p>
      </div>

      {/* Pre-filled S-OTR Master Information (Non-editable guarantee) */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 text-xs space-y-4">
        <div className="border-b border-gov-slate-200 pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gov-navy text-sm">
              1. Verified S-OTR Profile Data (Auto-Populated)
            </h3>
            <span className="text-gov-slate-500 text-[11px]">
              These verified fields are pulled directly from your Student ID ({profile.student_id}) and cannot be edited per-application.
            </span>
          </div>
          <Link href="/student/profile" className="text-gov-navy font-semibold underline text-[11px]">
            Edit in Master S-OTR
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gov-slate-50 border border-gov-slate-200 rounded p-4 text-gov-slate-800">
          <div>
            <span className="text-gov-slate-500 block">Applicant Full Name:</span>
            <span className="font-semibold">{profile.full_name}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">Permanent Student ID:</span>
            <span className="font-mono font-semibold">{profile.student_id}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">Date of Birth:</span>
            <span className="font-semibold">{profile.dob}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">Scheduled Tribe (ST):</span>
            <span className="font-semibold">{profile.tribe}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">State / District:</span>
            <span className="font-semibold">{profile.district}, {profile.state}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">ST Certificate No:</span>
            <span className="font-mono font-semibold">{profile.st_certificate_number || 'ST/REV/2023'}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">Qualifying Institution:</span>
            <span className="font-semibold">{profile.institution_name}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">Course / Qualification:</span>
            <span className="font-semibold">{profile.course}</span>
          </div>
          <div>
            <span className="text-gov-slate-500 block">Qualifying Percentage:</span>
            <span className="font-semibold text-gov-navy">{profile.masters_percentage}%</span>
          </div>
        </div>
      </div>

      {/* Scheme-Specific Input Fields Form */}
      <form onSubmit={handleApply} className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 text-xs space-y-6">
        <div>
          <div className="border-b border-gov-slate-200 pb-2 mb-4">
            <h3 className="font-bold text-gov-navy text-sm">
              2. Scheme-Specific Information
            </h3>
            <span className="text-gov-slate-500 text-[11px]">
              Provide only the supplementary information specific to {scheme.scheme_code}.
            </span>
          </div>

          {schemeCode === 'NFST' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  M.Phil / Ph.D. Research Topic Synopsis Title *
                </label>
                <input
                  type="text"
                  name="research_topic"
                  required
                  value={schemeSpecific.research_topic}
                  onChange={handleSchemeSpecificChange}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Proposed Research Supervisor Name & Designation *
                </label>
                <input
                  type="text"
                  name="supervisor_name"
                  required
                  value={schemeSpecific.supervisor_name}
                  onChange={handleSchemeSpecificChange}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Fellowship Stream / Category *
                </label>
                <select
                  name="fellowship_category"
                  value={schemeSpecific.fellowship_category}
                  onChange={handleSchemeSpecificChange}
                  className="w-full text-xs"
                >
                  <option value="Ph.D. Full-Time Fellowship">Ph.D. Full-Time Fellowship</option>
                  <option value="M.Phil Full-Time Fellowship">M.Phil Full-Time Fellowship</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Destination Country for Overseas Higher Studies *
                </label>
                <select
                  name="target_country"
                  value={schemeSpecific.target_country}
                  onChange={handleSchemeSpecificChange}
                  className="w-full text-xs"
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Foreign University / Institution Name *
                </label>
                <input
                  type="text"
                  name="foreign_university"
                  required
                  value={schemeSpecific.foreign_university}
                  onChange={handleSchemeSpecificChange}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  QS World University Ranking *
                </label>
                <input
                  type="number"
                  name="qs_ranking"
                  required
                  value={schemeSpecific.qs_ranking}
                  onChange={handleSchemeSpecificChange}
                  placeholder="e.g. 25"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Program Duration (Months) *
                </label>
                <input
                  type="number"
                  name="course_duration_months"
                  required
                  value={schemeSpecific.course_duration_months}
                  onChange={handleSchemeSpecificChange}
                  className="w-full text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Required Documents Check List (including study_research_plan) */}
        <div>
          <div className="border-b border-gov-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-gov-navy text-sm">
              3. Document Checklist Confirmation
            </h3>
            <span className="text-gov-slate-500 text-[11px]">
              Required documents automatically attached from your verified vault.
            </span>
          </div>

          <div className="space-y-2">
            {scheme.required_documents?.map((rd: any) => (
              <div key={rd.document_type} className="flex justify-between items-center bg-gov-slate-50 border border-gov-slate-200 rounded p-2.5">
                <div>
                  <span className="font-semibold text-gov-slate-900 block">{rd.document_type}</span>
                  <span className="text-[11px] text-gov-slate-500">Mandatory Scheme Requirement</span>
                </div>
                <StatusBadge status="Verified" />
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Workflow Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-xs text-gov-navy">
          <div className="font-bold mb-1">Notice on Next Verification Stages:</div>
          <p className="leading-relaxed">
            Upon clicking "Submit & Proceed to DigiLocker", you will be redirected to the National Academic Depository (NAD) / DigiLocker verification gateway. Following callback, AI optical verification and human officer scrutiny will be executed in strict sequence.
          </p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gov-slate-200">
          <Link
            href="/student/scholarships"
            className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-medium px-4 py-2 rounded text-xs"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || !eligibility?.is_eligible}
            className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-6 py-2.5 rounded text-xs transition-colors"
          >
            {submitting ? 'Submitting Application...' : 'Submit & Proceed to DigiLocker / NAD \u2192'}
          </button>
        </div>
      </form>
    </div>
  );
}
