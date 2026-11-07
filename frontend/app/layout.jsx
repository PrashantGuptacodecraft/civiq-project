import Link from 'next/link';
import { SiteHeader, MobileBottomNav } from './_components/site-nav.jsx';
import { AuthProvider } from '../context/auth-context.jsx';
import './globals.css';

export const metadata = {
  title: 'CivIQ — Civic Intelligence Platform',
  description: 'Report civic issues, track resolutions, and hold local government accountable. Verified, AI-powered, and built for India.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-surface-primary text-text-primary min-h-screen flex flex-col">
        <AuthProvider>

          {/* Skip to main content (keyboard / screen-reader accessibility) */}
          <a href="#main-content" className="skip-link">Skip to main content</a>

          {/* ─── Header ───────────────────────────────────────── */}
          <SiteHeader />

          {/* ─── Main Content ─────────────────────────────────── */}
          <main id="main-content" className="flex-1 flex flex-col" tabIndex={-1}>
            {children}
          </main>

          {/* ─── Mobile Bottom Navigation ─────────────────────── */}
          <MobileBottomNav />

          {/* ─── Footer ───────────────────────────────────────── */}
          <footer className="border-t border-border-primary bg-surface-secondary mt-auto mb-16 md:mb-0">
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Brand */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #8B5CF6)' }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-text-primary leading-none block">CivIQ</span>
                    <span className="text-[10px] text-text-tertiary tracking-wide">Civic Intelligence Platform</span>
                  </div>
                </div>

                <p className="text-xs text-text-tertiary text-center">
                  &copy; {new Date().getFullYear()} CivIQ Platform · Pilot: Pune Municipal Corporation
                </p>

                <div className="flex items-center gap-5 text-xs">
                  <Link href="/report" className="text-text-tertiary hover:text-text-primary transition-colors duration-150 font-medium">
                    Report Issue
                  </Link>
                  <Link href="/dashboard" className="text-text-tertiary hover:text-text-primary transition-colors duration-150 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/map" className="text-text-tertiary hover:text-text-primary transition-colors duration-150 font-medium">
                    Live Map
                  </Link>
                  <Link href="/verification" className="text-text-tertiary hover:text-text-primary transition-colors duration-150 font-medium">
                    Verify
                  </Link>
                </div>
              </div>
            </div>
          </footer>

        </AuthProvider>
      </body>
    </html>
  );
}
