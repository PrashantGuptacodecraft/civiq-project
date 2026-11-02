import Link from 'next/link';
import { SiteHeader, MobileBottomNav } from './_components/site-nav.jsx';
import './globals.css';

export const metadata = {
  title: 'CivIQ - Civic Intelligence Platform',
  description: 'Report and resolve community issues effectively.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <body className="bg-surface-primary text-text-primary min-h-screen flex flex-col">

        {/* Skip to main content (keyboard / screen-reader accessibility) */}
        <a href="#main-content" className="skip-link">Skip to main content</a>

        {/* ─── Header (client — uses usePathname + scroll) ─────── */}
        <SiteHeader />

        {/* ─── Main Content ───────────────────────────────────────── */}
        <main id="main-content" className="flex-1 flex flex-col" tabIndex={-1}>
          {children}
        </main>

        {/* ─── Mobile Bottom Navigation ───────────────────────────── */}
        <MobileBottomNav />

        {/* ─── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-border-primary py-8 bg-surface-secondary mt-auto mb-16 md:mb-0">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-text-primary">CivIQ</span>
              </div>
              <p className="text-xs text-text-tertiary text-center">
                &copy; {new Date().getFullYear()} CivIQ Platform. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <Link href="/report" className="hover:text-text-secondary transition-colors duration-150">Report Issue</Link>
                <span aria-hidden="true">·</span>
                <Link href="/dashboard" className="hover:text-text-secondary transition-colors duration-150">Dashboard</Link>
                <span aria-hidden="true">·</span>
                <Link href="/map" className="hover:text-text-secondary transition-colors duration-150">Map</Link>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
