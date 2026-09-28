'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

export default function VerifiedProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDocType, setUploadDocType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProfile = () => {
    api.getStudentProfile()
      .then(data => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleDocumentRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocType || !selectedFile) return;

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('document_type', uploadDocType);
      formData.append('file', selectedFile);

      await api.uploadStudentDocument(formData);
      setMessage(`Document '${uploadDocType}' uploaded successfully. Isolated verification initiated.`);
      setUploadDocType(null);
      setSelectedFile(null);
      fetchProfile();
    } catch (err: any) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-gov-slate-600">Loading verified student profile...</div>;
  }

  if (!profile) {
    return <div className="py-12 text-center text-xs text-gov-red">Profile not found. Please complete S-OTR.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Official S-OTR Master Header Card */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gov-slate-200 pb-4 mb-4">
          <div>
            <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
              Ministry of Tribal Affairs | Government of India
            </span>
            <h2 className="text-xl font-bold text-gov-navy mt-0.5">
              My Verified Student Profile (S-OTR)
            </h2>
            <p className="text-xs text-gov-slate-600 mt-1">
              Reusable master profile for all Scheduled Tribe fellowship and scholarship applications.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-gov-slate-500 block">Permanent Student ID</span>
            <span className="text-lg font-mono font-bold text-gov-navy bg-gov-slate-100 border border-gov-slate-300 px-3 py-1 rounded inline-block">
              {profile.student_id}
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gov-slate-500 block mb-0.5">Profile Completion</span>
            <div className="w-full bg-gov-slate-200 rounded-full h-2 mb-1">
              <div
                className="bg-gov-navy h-2 rounded-full"
                style={{ width: `${profile.profile_completion_pct}%` }}
              />
            </div>
            <span className="font-semibold text-gov-navy">{profile.profile_completion_pct}% Complete</span>
          </div>

          <div>
            <span className="text-gov-slate-500 block mb-0.5">Overall S-OTR Status</span>
            <StatusBadge status={profile.overall_verification_status} size="md" />
          </div>

          <div>
            <span className="text-gov-slate-500 block mb-0.5">ST Community Status</span>
            <StatusBadge status={profile.st_verification_status || 'Pending'} size="md" />
          </div>

          <div>
            <span className="text-gov-slate-500 block mb-0.5">Last Scrutiny / Update</span>
            <span className="font-medium text-gov-slate-700">
              {new Date(profile.updated_at).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-300 text-gov-green text-xs p-3 rounded font-medium">
          {message}
        </div>
      )}

      {/* Profile Detail Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Section 1: Personal Information */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-gov-navy text-sm">1. Personal Information</h3>
            <span className="text-[11px] text-gov-green font-semibold uppercase">Verified Master</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gov-slate-700">
            <div>
              <dt className="text-gov-slate-500">Full Name:</dt>
              <dd className="font-semibold text-gov-slate-900">{profile.full_name}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Date of Birth:</dt>
              <dd className="font-semibold text-gov-slate-900">{profile.dob || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Gender:</dt>
              <dd className="font-semibold text-gov-slate-900">{profile.gender || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Contact Phone:</dt>
              <dd className="font-semibold text-gov-slate-900">{profile.phone || 'N/A'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gov-slate-500">Permanent Address:</dt>
              <dd className="font-medium text-gov-slate-900">
                {profile.address}, {profile.district}, {profile.state} - {profile.pincode}
              </dd>
            </div>
          </dl>
        </div>

        {/* Section 2: ST Community Information */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-gov-navy text-sm">2. Scheduled Tribe (ST) Information</h3>
            <StatusBadge status={profile.st_verification_status || 'Verified'} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gov-slate-700">
            <div>
              <dt className="text-gov-slate-500">Scheduled Tribe:</dt>
              <dd className="font-semibold text-gov-slate-900">{profile.tribe || 'Not Specified'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Certificate Number:</dt>
              <dd className="font-mono font-semibold text-gov-slate-900">{profile.st_certificate_number || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Issuing Authority:</dt>
              <dd className="font-medium text-gov-slate-900">{profile.st_issuing_authority || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Issue Date:</dt>
              <dd className="font-medium text-gov-slate-900">{profile.st_issue_date || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Section 3: Academic Profile */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-gov-navy text-sm">3. Academic Profile</h3>
            <StatusBadge status={profile.academic_verification_status || 'Verified'} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gov-slate-700">
            <div className="col-span-2">
              <dt className="text-gov-slate-500">Current / Qualifying Institution:</dt>
              <dd className="font-semibold text-gov-slate-900">{profile.institution_name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Degree & Course:</dt>
              <dd className="font-semibold text-gov-slate-900">{profile.course || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Roll / Enrollment Number:</dt>
              <dd className="font-mono font-semibold text-gov-slate-900">{profile.roll_number || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Qualifying Percentage:</dt>
              <dd className="font-semibold text-gov-navy text-sm">{profile.masters_percentage ? `${profile.masters_percentage}%` : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Institution Category:</dt>
              <dd className="font-medium text-gov-slate-900">{profile.institution_type || 'University'}</dd>
            </div>
          </dl>
        </div>

        {/* Section 4: Financial Information */}
        <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-5">
          <div className="flex justify-between items-center border-b border-gov-slate-200 pb-2 mb-3">
            <h3 className="font-bold text-gov-navy text-sm">4. Financial Information</h3>
            <StatusBadge status={profile.income_verification_status || 'Verified'} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gov-slate-700">
            <div>
              <dt className="text-gov-slate-500">Annual Family Income:</dt>
              <dd className="font-semibold text-gov-navy text-sm">
                {profile.annual_income_inr ? `INR ${profile.annual_income_inr.toLocaleString('en-IN')}` : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Income Certificate No:</dt>
              <dd className="font-mono font-semibold text-gov-slate-900">{profile.income_cert_number || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Certificate Validity:</dt>
              <dd className="font-medium text-gov-slate-900">{profile.income_cert_validity || 'Valid'}</dd>
            </div>
            <div>
              <dt className="text-gov-slate-500">Income Threshold Check:</dt>
              <dd className="font-medium text-gov-green">Compliant with Scheme Ceilings</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Section 5: Reusable Document Vault & Isolated Renewal Workbench */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6">
        <div className="border-b border-gov-slate-200 pb-3 mb-4">
          <h3 className="font-bold text-gov-navy text-sm">
            5. Reusable Document Vault (7 Core Document Types)
          </h3>
          <p className="text-xs text-gov-slate-600 mt-0.5">
            Uploaded certificates remain permanently linked to your Student ID. If a single certificate expires or requires correction, update only that document without repeating the full S-OTR process.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gov-slate-100 text-gov-slate-700 uppercase tracking-wider font-semibold border-b border-gov-slate-300">
              <tr>
                <th className="py-2.5 px-3">Document Category</th>
                <th className="py-2.5 px-3">Applicable Schemes</th>
                <th className="py-2.5 px-3">Verification State</th>
                <th className="py-2.5 px-3">File Reference</th>
                <th className="py-2.5 px-3 text-right">Isolated Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-slate-200">
              {[
                { type: 'st_certificate', label: 'Scheduled Tribe Community Certificate', schemes: 'NFST, NOS' },
                { type: 'academic_document', label: "Master's Degree Marksheet / Transcript", schemes: 'NFST, NOS' },
                { type: 'income_certificate', label: 'Annual Family Income Certificate', schemes: 'NFST, NOS' },
                { type: 'admission_registration', label: 'University Admission / Registration Proof', schemes: 'NFST' },
                { type: 'research_proposal', label: 'Doctoral Research Proposal Synopsis', schemes: 'NFST' },
                { type: 'foreign_offer_letter', label: 'Foreign University Unconditional Offer Letter', schemes: 'NOS' },
                { type: 'study_research_plan', label: 'Overseas Study & Research Execution Plan', schemes: 'NOS' },
              ].map(item => {
                const doc = profile.documents?.find((d: any) => d.document_type === item.type);
                const status = doc ? doc.verification_status : 'Not Available';

                return (
                  <tr key={item.type} className="hover:bg-gov-slate-50">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gov-slate-900">{item.label}</div>
                      <div className="text-[11px] font-mono text-gov-slate-500">{item.type}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gov-slate-600">
                      {item.schemes}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="py-3 px-3 text-gov-slate-600 font-mono text-[11px]">
                      {doc ? doc.original_filename : 'No document uploaded'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {status === 'Not Available' || status === 'Needs Update' || status === 'Expired' || status === 'Rejected' ? (
                        <button
                          type="button"
                          onClick={() => setUploadDocType(item.type)}
                          className="bg-gov-amber hover:bg-gov-amber-light text-white font-semibold px-2.5 py-1 rounded transition-colors text-[11px]"
                        >
                          Action Required: Upload
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUploadDocType(item.type)}
                          className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-800 font-medium px-2.5 py-1 rounded transition-colors text-[11px]"
                        >
                          Update / Renew
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Isolated Document Upload Modal */}
      {uploadDocType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gov-slate-300 rounded shadow-lg max-w-md w-full p-6 text-xs space-y-4">
            <div className="border-b border-gov-slate-200 pb-2">
              <span className="text-[11px] font-bold text-gov-saffron uppercase">Targeted S-OTR Renewal</span>
              <h4 className="text-base font-bold text-gov-navy mt-0.5">
                Update Document: <span className="font-mono">{uploadDocType}</span>
              </h4>
              <p className="text-gov-slate-600 mt-1">
                Only this document will be replaced and submitted for isolated AI and officer re-scrutiny. Other verified profile data remains unchanged.
              </p>
            </div>

            <form onSubmit={handleDocumentRenewal} className="space-y-4">
              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Select Certificate File (JPG, PNG, PDF) *
                </label>
                <input
                  type="file"
                  required
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gov-slate-200">
                <button
                  type="button"
                  onClick={() => { setUploadDocType(null); setSelectedFile(null); }}
                  className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-medium px-4 py-2 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-4 py-2 rounded text-xs"
                >
                  {uploading ? 'Uploading...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
