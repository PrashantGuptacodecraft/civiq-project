import Link from 'next/link';
import './globals.css';
export const metadata = {
    title: 'CivIQ - Civic Intelligence Platform',
    description: 'Report and resolve community issues effectively.',
};
export default function RootLayout({ children, }) {
    return (<html lang="en" className="antialiased">
      <body className="bg-surface-primary text-text-primary min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-border-primary bg-surface-primary/95 backdrop-blur supports-[backdrop-filter]:bg-surface-primary/80">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">CivIQ</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
              <Link href="/map" className="hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                Operational Map
              </Link>
              <Link href="/verification" className="hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                Verification
              </Link>
              <Link href="/field" className="hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                Field Work
              </Link>
            </nav>
            {/* Mobile nav toggle — visible on small screens */}
            <div className="md:hidden flex items-center gap-1">
              <Link href="/map" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors p-2 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md" aria-label="Operational map">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </Link>
              <Link href="/field" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors p-2 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md" aria-label="Field worker console">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </Link>
              <Link href="/verification" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors p-2 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md" aria-label="Verification console">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
    </html>);
}
