export default function HomePage() {
  return (
    <div className="flex-1 w-full bg-surface-primary">
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 lg:py-32 flex flex-col items-center text-center max-w-5xl mx-auto overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 -translate-y-12 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-info/10 text-status-info text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-info opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-info"></span>
          </span>
          Platform Early Access
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-tight max-w-3xl mb-6">
          Empowering communities through <span className="text-primary">civic intelligence</span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
          Report local issues, track resolutions, and collaborate with officials securely. 
          CivIQ bridges the gap between citizens and local government.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Primary Action (Placeholder for Future Phase) */}
          <button 
            disabled
            title="Feature in development"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white rounded-md h-12 px-8 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:bg-primary-active"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Report an Issue
          </button>
          
          {/* Secondary Action (Placeholder for Future Phase) */}
          <button 
            disabled
            title="Feature in development"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-primary text-text-primary border border-border-primary rounded-md h-12 px-8 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
          >
            Official Sign In
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="px-4 py-16 bg-surface-secondary border-t border-border-primary">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-surface-elevated p-6 rounded-xl shadow-elevation-1 border border-border-primary">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Verified Reporting</h3>
            <p className="text-text-secondary leading-relaxed">
              Submit issues with cryptographic proof and device integrity checks to ensure authentic reporting.
            </p>
          </div>

          <div className="bg-surface-elevated p-6 rounded-xl shadow-elevation-1 border border-border-primary">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Smart Triaging</h3>
            <p className="text-text-secondary leading-relaxed">
              Automated deduplication and AI-assisted categorization get your reports to the right officials faster.
            </p>
          </div>

          <div className="bg-surface-elevated p-6 rounded-xl shadow-elevation-1 border border-border-primary">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Secure Collaboration</h3>
            <p className="text-text-secondary leading-relaxed">
              Connect citizens with official task forces through a strict role-based access pipeline.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
