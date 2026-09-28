import React from 'react';
import Link from 'next/link';

export default function GovFooter() {
  return (
    <footer className="bg-gov-slate-900 text-gov-slate-300 border-t-2 border-gov-saffron text-xs no-print mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <div className="font-bold text-white mb-2 text-sm">
            Ministry of Tribal Affairs
          </div>
          <p className="text-gov-slate-400 leading-relaxed mb-3">
            Government of India, Shastri Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001.
          </p>
          <p className="text-gov-slate-400">
            Dedicated online fellowship & scholarship scrutiny portal for Scheduled Tribe students.
          </p>
        </div>

        <div>
          <div className="font-bold text-white mb-2 text-sm">
            Core Fellowship Schemes
          </div>
          <ul className="space-y-1.5 text-gov-slate-400">
            <li>
              <Link href="/student/scholarships" className="hover:text-white transition-colors">
                National Fellowship for ST Students (NFST)
              </Link>
            </li>
            <li>
              <Link href="/student/scholarships" className="hover:text-white transition-colors">
                National Overseas Scholarship (NOS)
              </Link>
            </li>
            <li>
              <Link href="/otr" className="hover:text-white transition-colors">
                Student One-Time Registration (S-OTR)
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition-colors">
                Officer Scrutiny Workbench
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-white mb-2 text-sm">
            Public-Service Standards
          </div>
          <ul className="space-y-1.5 text-gov-slate-400">
            <li>National Academic Depository (NAD) / DigiLocker</li>
            <li>Deterministic Rule-Based Eligibility Engine</li>
            <li>Mandatory Statutory Human Scrutiny</li>
            <li>Immutable Event Audit Logging</li>
            <li>Targeted Single-Document Deficiency Resolution</li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-white mb-2 text-sm">
            SIH Prototype Notice
          </div>
          <p className="text-gov-slate-400 leading-relaxed mb-2">
            Developed for the Smart India Hackathon problem statement. Built with synthetic applicant profiles (SIH_ST_NFST_NOS_1000) for research and technical evaluation.
          </p>
          <div className="text-gov-slate-500 text-[11px]">
            Portal hosted locally for SIH technical demonstration.
          </div>
        </div>
      </div>

      <div className="bg-black py-3 px-4 border-t border-gov-slate-800 text-center text-gov-slate-500 text-[11px]">
        Designed in compliance with Guidelines for Indian Government Websites (GIGW). All Rights Reserved.
      </div>
    </footer>
  );
}
