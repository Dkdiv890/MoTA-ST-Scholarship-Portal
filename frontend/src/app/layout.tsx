import type { Metadata } from 'next';
import './globals.css';
import GovHeader from '@/components/layout/GovHeader';
import GovNavbar from '@/components/layout/GovNavbar';
import GovFooter from '@/components/layout/GovFooter';

export const metadata: Metadata = {
  title: 'Ministry of Tribal Affairs - National ST Scholarship & Fellowship Portal',
  description: 'AI-Enabled Scholarship and Fellowship Management System for Scheduled Tribes (NFST & NOS). Official SIH Prototype.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gov-slate-50 text-gov-slate-900">
        <GovHeader />
        <GovNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <GovFooter />
      </body>
    </html>
  );
}
