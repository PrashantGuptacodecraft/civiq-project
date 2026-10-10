import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'CivIQ - Civic Intelligence Platform',
  description: 'Report and resolve community issues effectively.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="bg-surface-primary text-text-primary min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-border-primary bg-surface-primary/95 backdrop-blur supports-[backdrop-filter]:bg-surface-primary/80">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">CivIQ</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
              <span className="cursor-not-allowed opacity-50" title="Coming soon">Reports</span>
              <Link
                href="/verification"
                className="hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                Verification
              </Link>
            </nav>
            {/* Mobile nav toggle — visible on small screens */}
            <div className="md:hidden flex items-center">
              <Link
                href="/verification"
                className="text-sm font-medium text-text-secondary hover:text-primary transition-colors p-2 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                aria-label="Verification console"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <footer className="border-t border-border-primary py-8 bg-surface-secondary mt-auto">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 text-center text-sm text-text-tertiary">
            <p>&copy; {new Date().getFullYear()} CivIQ Platform. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
