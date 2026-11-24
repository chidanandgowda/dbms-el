import type { Metadata } from 'next';
import './globals.css';
import { AcademicProvider } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ToastContainer } from '@/components/ToastContainer';

export const metadata: Metadata = {
  title: 'Academic Peer-Review & Publication System',
  description: 'Database-Enforced Academic Integrity with PostgreSQL, RLS, and Hash-Chained Publications',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex antialiased">
        <AcademicProvider>
          {/* Fixed Left Sidebar (240px) */}
          <Sidebar />

          {/* Main App Area */}
          <div className="flex-1 flex flex-col min-w-0 pl-[240px]">
            <Header />
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>

          {/* Database & Trigger Toast Alerts */}
          <ToastContainer />
        </AcademicProvider>
      </body>
    </html>
  );
}
