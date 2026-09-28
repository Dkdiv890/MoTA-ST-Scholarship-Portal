'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DigiLockerDemoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('application_id') || 'APP20260001';
  const stateToken = searchParams.get('state') || 'DEMO_STATE_NONCE';

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [idType, setIdType] = useState<'aadhaar' | 'mobile'>('aadhaar');
  const [identifier, setIdentifier] = useState('7845 9210 3481');
  const [securityPin, setSecurityPin] = useState('123456');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpInfo, setOtpInfo] = useState<any>(null);

  const [selectedBranch, setSelectedBranch] = useState<'BRANCH_A' | 'BRANCH_B'>('BRANCH_A');
  const [consentCheck, setConsentCheck] = useState(true);

  const handleInitiateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.replace(/\s+/g, '');
    let phoneToUse = idType === 'mobile' ? cleanId : '9810023456';
    if (idType === 'aadhaar') {
      if (cleanId.length !== 12) {
        alert('Please enter a valid 12-digit Aadhaar number.');
        return;
      }
    } else {
      if (cleanId.length !== 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/v1/digilocker/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneToUse, application_id: appId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to dispatch OTP.');
      setOtpInfo(data);
      setOtp('');
      setStep(2);
    } catch (err: any) {
      alert(err.message || 'Error sending OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2 -> Step 3
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }

    const cleanId = identifier.replace(/\s+/g, '');
    let phoneToUse = idType === 'mobile' ? cleanId : '9810023456';

    setVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/v1/digilocker/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneToUse, otp, application_id: appId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'OTP verification failed.');
      setStep(3);
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3 -> Callback
  const handleAuthorize = () => {
    if (!consentCheck) {
      alert('Consent is mandatory to share your DigiLocker and NAD records.');
      return;
    }

    const code = `DL_AUTH_CODE_${selectedBranch}_${Date.now()}`;
    router.push(
      `/digilocker/callback?application_id=${appId}&code=${code}&state=${stateToken}&branch=${selectedBranch}`
    );
  };

  return (
    <div className="max-w-xl mx-auto my-8 px-4 text-xs font-sans">
      {/* Official Government Gateway Simulation Banner */}
      <div className="bg-white border-t-4 border-gov-navy border-x border-b border-gov-slate-300 rounded shadow-md overflow-hidden">
        {/* DigiLocker & MeriPehchaan Header */}
        <div className="bg-gov-slate-50 border-b border-gov-slate-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gov-navy text-white font-bold rounded flex items-center justify-center text-sm tracking-wider shadow-sm">
              DL
            </div>
            <div>
              <div className="text-base font-bold text-gov-navy">DigiLocker | MeriPehchaan</div>
              <div className="text-gov-slate-500 text-[11px]">
                National Single Sign-On (NSSO) Gateway | MeitY, Govt. of India
              </div>
            </div>
          </div>
          <span className="font-mono bg-white border border-gov-slate-300 text-gov-navy font-semibold px-2.5 py-1 rounded text-[11px]">
            App Ref: {appId}
          </span>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-gov-slate-100 border-b border-gov-slate-200 px-6 py-2.5 flex justify-between text-[11px] font-semibold text-gov-slate-600">
          <span className={step === 1 ? 'text-gov-navy font-bold' : step > 1 ? 'text-gov-green' : ''}>
            1. Identity Verification {step > 1 && '✓'}
          </span>
          <span>&rarr;</span>
          <span className={step === 2 ? 'text-gov-navy font-bold' : step > 2 ? 'text-gov-green' : ''}>
            2. Aadhaar OTP Authentication {step > 2 && '✓'}
          </span>
          <span>&rarr;</span>
          <span className={step === 3 ? 'text-gov-navy font-bold' : ''}>
            3. Data Sharing Consent
          </span>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* STEP 1: ENTER AADHAAR / MOBILE & PIN */}
          {step === 1 && (
            <form onSubmit={handleInitiateOtp} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gov-navy">Sign in to your DigiLocker Account</h3>
                <p className="text-gov-slate-600 text-[11px] mt-0.5">
                  Authenticate your identity to link verified academic documents and certificates.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="flex border border-gov-slate-300 rounded overflow-hidden p-0.5 bg-gov-slate-100 text-[11px]">
                <button
                  type="button"
                  onClick={() => { setIdType('aadhaar'); setIdentifier('7845 9210 3481'); }}
                  className={`flex-1 py-1.5 font-semibold rounded transition-colors ${
                    idType === 'aadhaar' ? 'bg-white text-gov-navy shadow-sm' : 'text-gov-slate-600 hover:text-gov-navy'
                  }`}
                >
                  Aadhaar Number (12 Digits)
                </button>
                <button
                  type="button"
                  onClick={() => { setIdType('mobile'); setIdentifier('9810023456'); }}
                  className={`flex-1 py-1.5 font-semibold rounded transition-colors ${
                    idType === 'mobile' ? 'bg-white text-gov-navy shadow-sm' : 'text-gov-slate-600 hover:text-gov-navy'
                  }`}
                >
                  Registered Mobile Number
                </button>
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  {idType === 'aadhaar' ? '12-Digit Aadhaar Number *' : '10-Digit Mobile Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={idType === 'aadhaar' ? 'XXXX XXXX XXXX' : '98XXXXXXXX'}
                  className="w-full text-xs font-mono px-3 py-2 border border-gov-slate-300 rounded focus:border-gov-navy focus:outline-none"
                />
                <span className="text-[10px] text-gov-slate-500 mt-1 block">
                  Aadhaar details are validated via UIDAI e-KYC standards.
                </span>
              </div>

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  6-Digit DigiLocker Security PIN *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="******"
                  className="w-full text-xs font-mono px-3 py-2 border border-gov-slate-300 rounded focus:border-gov-navy focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full bg-gov-navy hover:bg-gov-navy-light disabled:opacity-50 text-white font-semibold py-2.5 rounded text-xs transition-colors shadow-sm"
                >
                  {sendingOtp ? 'Dispatching OTP to Mobile Carrier...' : 'Request OTP & Verify \u2192'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gov-navy">Verify Aadhaar One-Time Password (OTP)</h3>
                <p className="text-gov-slate-600 text-[11px] mt-0.5">
                  An authentication OTP has been dispatched to {otpInfo?.masked_phone || 'your registered mobile number'}.
                </p>
              </div>

              {otpInfo?.carrier_sms_sent ? (
                <div className="bg-green-50 border border-green-300 text-green-900 p-3 rounded text-[11px] font-medium space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-gov-green">
                    <span>&#x2713; Real Carrier SMS Dispatched</span>
                  </div>
                  <p>
                    A real SMS containing your 6-digit verification code has been transmitted to your phone. Please check your SMS inbox.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded text-[11px] space-y-1">
                  <div className="font-bold text-gov-navy">
                    Aadhaar OTP Dispatch Notice:
                  </div>
                  <div>
                    Generated OTP for this session:{' '}
                    <code className="bg-white border border-blue-300 px-2 py-0.5 rounded font-mono font-bold text-gov-navy text-xs">
                      {otpInfo?.demo_otp || '123456'}
                    </code>{' '}
                    (or enter <code className="bg-white border border-blue-300 px-1 py-0.5 rounded font-mono font-bold">123456</code>).
                  </div>
                  <p className="text-[10px] text-gov-slate-600 pt-0.5">
                    To receive live SMS on your physical phone, paste your Fast2SMS API key in <code className="font-mono bg-white px-1">backend/.env</code> as <code className="font-mono bg-white px-1">FAST2SMS_API_KEY=...</code>.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gov-slate-700 font-semibold mb-1">
                  Enter 6-Digit Verification OTP *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value); setOtpError(''); }}
                  placeholder="------"
                  className="w-full text-center tracking-widest text-base font-mono px-3 py-2 border border-gov-slate-300 rounded focus:border-gov-navy focus:outline-none"
                />
                {otpError && (
                  <span className="text-gov-red text-[11px] font-semibold mt-1 block">{otpError}</span>
                )}
              </div>

              <div className="flex justify-between items-center text-[11px] text-gov-slate-500">
                <span>Resend OTP in <strong className="text-gov-navy">00:45</strong></span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-gov-navy hover:underline font-medium"
                >
                  Change Aadhaar / Mobile
                </button>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-semibold py-2.5 rounded text-xs"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="flex-1 bg-gov-navy hover:bg-gov-navy-light disabled:opacity-50 text-white font-semibold py-2.5 rounded text-xs transition-colors shadow-sm"
                >
                  {verifyingOtp ? 'Validating...' : 'Validate OTP \u2192'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OFFICIAL CONSENT DIALOGUE */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gov-navy">Data Sharing Consent & NAD Authorization</h3>
                <p className="text-gov-slate-600 text-[11px] mt-0.5">
                  Identity successfully verified via Aadhaar OTP. The <strong>Ministry of Tribal Affairs</strong> requests your authorization to fetch verified educational and category records.
                </p>
              </div>

              {/* Data Scope Box */}
              <div className="bg-gov-slate-50 border border-gov-slate-200 rounded p-4 space-y-2 text-gov-slate-700">
                <div className="font-semibold text-gov-navy text-[11px]">Requested Document Scope:</div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Aadhaar Demographic Profile (Name, Gender, DOB)</li>
                  <li>National Academic Depository (NAD) - Master&apos;s Degree / Qualifying Transcript</li>
                  <li>State Revenue Authority - Scheduled Tribe (ST) Certificate</li>
                  <li>State Revenue Authority - Annual Income Certificate</li>
                </ul>
              </div>

              {/* Evaluation Scrutiny Branch Selector */}
              <div className="border border-gov-navy/30 bg-blue-50/50 rounded p-4 space-y-2.5">
                <div className="font-bold text-gov-navy text-[11px] uppercase tracking-wide">
                  NAD Simulation Response Mode:
                </div>

                <div className="space-y-2">
                  <label className="flex items-start space-x-3 p-2.5 border rounded bg-white cursor-pointer hover:bg-gov-slate-50">
                    <input
                      type="radio"
                      name="branch"
                      value="BRANCH_A"
                      checked={selectedBranch === 'BRANCH_A'}
                      onChange={() => setSelectedBranch('BRANCH_A')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-gov-navy block text-[11px]">
                        Branch A: Academic Record Found in NAD (Normal Verified Path)
                      </span>
                      <span className="text-gov-slate-600 text-[10px]">
                        NAD returns digitally signed transcript. Application proceeds through AI scrutiny to Officer review.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-2.5 border rounded bg-white cursor-pointer hover:bg-gov-slate-50">
                    <input
                      type="radio"
                      name="branch"
                      value="BRANCH_B"
                      checked={selectedBranch === 'BRANCH_B'}
                      onChange={() => setSelectedBranch('BRANCH_B')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-gov-amber block text-[11px]">
                        Branch B: Record Not Indexed in NAD (Graceful Fallback Path)
                      </span>
                      <span className="text-gov-slate-600 text-[10px]">
                        Simulates older university records not yet seeded in NAD. Automatically routes to manual OCR & Officer Scrutiny without failing.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentCheck}
                  onChange={(e) => setConsentCheck(e.target.checked)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-gov-slate-700 leading-normal text-[11px] cursor-pointer">
                  I hereby give my explicit consent under the Information Technology Act 2000 to DigiLocker to share my educational records with the Ministry of Tribal Affairs for scholarship verification.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-gov-slate-200">
                <button
                  type="button"
                  onClick={() => router.push(`/student/applications/${appId}`)}
                  className="bg-gov-slate-100 hover:bg-gov-slate-200 border border-gov-slate-300 text-gov-slate-700 font-medium px-4 py-2 rounded text-xs"
                >
                  Deny & Return to Portal
                </button>

                <button
                  type="button"
                  onClick={handleAuthorize}
                  className="bg-gov-navy hover:bg-gov-navy-light text-white font-semibold px-6 py-2 rounded text-xs transition-colors shadow-sm"
                >
                  Authorize & Fetch Records &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
