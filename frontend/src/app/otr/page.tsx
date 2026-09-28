'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function OTRRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Account
    email: '',
    password: '',
    phone: '',
    // Personal
    full_name: '',
    dob: '1998-05-12',
    gender: 'Female',
    address: 'Sector 4, Tribal Development Block',
    state: 'Madhya Pradesh',
    district: 'Mandla',
    pincode: '481661',
    // ST Details
    tribe: 'Gond',
    st_certificate_number: 'ST/MP/MAN/2022/4910',
    st_issuing_authority: 'Sub-Divisional Magistrate (SDM), Mandla',
    st_issue_date: '2022-07-15',
    // Academic Details
    institution_name: 'Central University of South Bihar',
    institution_type: 'Central University',
    course: 'Master of Science (Biotechnology)',
    program: 'Postgraduate',
    qualification: "Master's Degree",
    academic_year: '2023-2025',
    roll_number: '2023-MS-BIO-041',
    masters_percentage: '74.5',
    // Financial
    annual_income_inr: '380000',
    income_cert_number: 'INC/MP/2024/9912',
    income_cert_validity: '2026-03-31',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Register user
      await api.register(formData.email, formData.password, formData.full_name, formData.phone);
      
      // 2. Update profile with OTR data
      await api.updateStudentProfile({
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        state: formData.state,
        district: formData.district,
        pincode: formData.pincode,
        tribe: formData.tribe,
        st_certificate_number: formData.st_certificate_number,
        st_issuing_authority: formData.st_issuing_authority,
        st_issue_date: formData.st_issue_date,
        institution_name: formData.institution_name,
        institution_type: formData.institution_type,
        course: formData.course,
        program: formData.program,
        qualification: formData.qualification,
        academic_year: formData.academic_year,
        roll_number: formData.roll_number,
        masters_percentage: parseFloat(formData.masters_percentage),
        annual_income_inr: parseFloat(formData.annual_income_inr),
        income_cert_number: formData.income_cert_number,
        income_cert_validity: formData.income_cert_validity,
      });

      router.push('/student/profile');
    } catch (err: any) {
      setError(err.message || 'Failed to complete S-OTR registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-6">
      {/* Official S-OTR Banner */}
      <div className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 mb-6">
        <span className="text-[11px] font-bold text-gov-saffron uppercase tracking-widest">
          National ST Scholarship Portal
        </span>
        <h2 className="text-xl font-bold text-gov-navy mt-1">
          Student One-Time Registration (S-OTR)
        </h2>
        <p className="text-xs text-gov-slate-600 mt-1 leading-relaxed">
          Create a verified, reusable student profile for all Ministry of Tribal Affairs fellowship and scholarship schemes. Complete this registration once to enable one-click pre-filled applications.
        </p>

        {/* Step Progression Tabs */}
        <div className="grid grid-cols-4 gap-2 mt-6 text-xs text-center border-t border-gov-slate-200 pt-4">
          <div className={`p-2 rounded font-semibold ${step === 1 ? 'bg-gov-navy text-white' : 'bg-gov-slate-100 text-gov-slate-600'}`}>
            1. Account & Personal
          </div>
          <div className={`p-2 rounded font-semibold ${step === 2 ? 'bg-gov-navy text-white' : 'bg-gov-slate-100 text-gov-slate-600'}`}>
            2. ST Information
          </div>
          <div className={`p-2 rounded font-semibold ${step === 3 ? 'bg-gov-navy text-white' : 'bg-gov-slate-100 text-gov-slate-600'}`}>
            3. Academic Profile
          </div>
          <div className={`p-2 rounded font-semibold ${step === 4 ? 'bg-gov-navy text-white' : 'bg-gov-slate-100 text-gov-slate-600'}`}>
            4. Financial & Review
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-gov-red text-xs p-3 rounded mb-4 font-medium">
          {error}
        </div>
      )}

      {/* Wizard Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gov-slate-300 rounded shadow-sm p-6 space-y-4 text-xs">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gov-navy text-sm border-b border-gov-slate-200 pb-2">
              Step 1: Account Credentials & Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Full Name (As per ST / High School Certificate) *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Meera Bai Gond"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Gender *
                </label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full text-xs">
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Mobile Number (For Verification OTP & Notices) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student.name@example.edu"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Portal Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-3">
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Permanent Residential Address *
                </label>
                <textarea
                  name="address"
                  rows={2}
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  State / UT *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  District *
                </label>
                <input
                  type="text"
                  name="district"
                  required
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gov-navy text-sm border-b border-gov-slate-200 pb-2">
              Step 2: Scheduled Tribe (ST) Community Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Name of Scheduled Tribe Community *
                </label>
                <input
                  type="text"
                  name="tribe"
                  required
                  value={formData.tribe}
                  onChange={handleChange}
                  placeholder="e.g. Santhal, Oraon, Gond, Bodo, Munda, Khasi"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  ST Certificate Number *
                </label>
                <input
                  type="text"
                  name="st_certificate_number"
                  required
                  value={formData.st_certificate_number}
                  onChange={handleChange}
                  placeholder="e.g. ST/MP/2022/4910"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Issuing Authority / Designation *
                </label>
                <input
                  type="text"
                  name="st_issuing_authority"
                  required
                  value={formData.st_issuing_authority}
                  onChange={handleChange}
                  placeholder="e.g. Sub-Divisional Officer / Tehsildar"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Certificate Issue Date *
                </label>
                <input
                  type="date"
                  name="st_issue_date"
                  required
                  value={formData.st_issue_date}
                  onChange={handleChange}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="bg-gov-slate-50 border border-gov-slate-200 p-3 rounded text-[11px] text-gov-slate-600">
              Note: The ST Community Certificate will undergo automated optical character verification and scrutiny against official state revenue department records.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gov-navy text-sm border-b border-gov-slate-200 pb-2">
              Step 3: Academic Qualifications & Institution Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Current / Qualifying Academic Institution Name *
                </label>
                <input
                  type="text"
                  name="institution_name"
                  required
                  value={formData.institution_name}
                  onChange={handleChange}
                  placeholder="e.g. Central University of South Bihar"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Institution Type *
                </label>
                <select
                  name="institution_type"
                  value={formData.institution_type}
                  onChange={handleChange}
                  className="w-full text-xs"
                >
                  <option value="Central University">Central University</option>
                  <option value="State University">State University</option>
                  <option value="Institute of National Importance">Institute of National Importance (IIT/IIM/NIT)</option>
                  <option value="Deemed University">Deemed University</option>
                </select>
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Degree & Course of Study *
                </label>
                <input
                  type="text"
                  name="course"
                  required
                  value={formData.course}
                  onChange={handleChange}
                  placeholder="e.g. Master of Science (Physics)"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  University Roll / Enrollment Number *
                </label>
                <input
                  type="text"
                  name="roll_number"
                  required
                  value={formData.roll_number}
                  onChange={handleChange}
                  placeholder="e.g. 2023-MS-BIO-041"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Master's / Qualifying Examination Percentage (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="masters_percentage"
                  required
                  value={formData.masters_percentage}
                  onChange={handleChange}
                  placeholder="74.50"
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gov-navy text-sm border-b border-gov-slate-200 pb-2">
              Step 4: Annual Family Income & S-OTR Verification Declaration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Total Annual Family Income (INR) *
                </label>
                <input
                  type="number"
                  name="annual_income_inr"
                  required
                  value={formData.annual_income_inr}
                  onChange={handleChange}
                  placeholder="380000"
                  className="w-full text-xs"
                />
                <span className="text-[11px] text-gov-slate-500">
                  Must be supported by competent authority income certificate.
                </span>
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Income Certificate Number *
                </label>
                <input
                  type="text"
                  name="income_cert_number"
                  required
                  value={formData.income_cert_number}
                  onChange={handleChange}
                  placeholder="e.g. INC/MP/2024/9912"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Certificate Validity Date *
                </label>
                <input
                  type="date"
                  name="income_cert_validity"
                  required
                  value={formData.income_cert_validity}
                  onChange={handleChange}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="border border-gov-slate-200 bg-gov-slate-50 p-4 rounded text-xs space-y-2 text-gov-slate-700">
              <div className="font-bold text-gov-navy">Statutory Declaration:</div>
              <p>
                I hereby declare that all information furnished in this Student One-Time Registration (S-OTR) is true and correct to the best of my knowledge. I understand that misrepresentation of ST community status or income records will lead to immediate cancellation of fellowship and legal prosecution under applicable laws.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-gov-slate-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-800 font-medium px-4 py-2 rounded transition-colors text-xs"
            >
              Previous Step
            </button>
          ) : <div />}

          <button
            type="submit"
            disabled={loading}
            className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-6 py-2 rounded transition-colors text-xs"
          >
            {loading ? 'Submitting S-OTR...' : (step === 4 ? 'Complete S-OTR & Generate Student ID' : 'Save & Continue')}
          </button>
        </div>
      </form>
    </div>
  );
}
