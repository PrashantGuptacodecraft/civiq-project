import Link from 'next/link';

const FEATURE_CARDS = [
  {
    title: 'Verified Reporting',
    description:
      'Submit issues with cryptographic proof and device integrity checks to ensure authentic reporting.',
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Smart Triaging',
    description:
      'Automated deduplication and AI-assisted categorization get your reports to the right officials faster.',
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Secure Collaboration',
    description:
      'Connect citizens with official task forces through a strict role-based access pipeline.',
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '12,000+', label: 'Issues Resolved' },
  { value: '98%', label: 'Verification Rate' },
  { value: '47', label: 'Municipalities' },
];

export default function HomePage() {
  return (
    <div className="flex-1 w-full bg-surface-primary overflow-x-hidden">

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative px-4 py-16 md:py-24 lg:py-32 flex flex-col items-center text-center max-w-5xl mx-auto overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[700px] h-[400px] bg-primary/8 blur-[140px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-info/10 text-status-info text-sm font-semibold mb-8 border border-status-info/20">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-info opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-info" />
          </span>
          Platform Early Access
        </div>

        {/* Heading */}
        <h1 className="animate-fade-up anim-delay-50 text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-tight max-w-3xl mb-6">
          Empowering communities through{' '}
          <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            civic intelligence
          </span>
        </h1>

        <p className="animate-fade-up anim-delay-100 text-lg md:text-xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
          Report local issues, track resolutions, and collaborate with officials securely.
          CivIQ bridges the gap between citizens and local government.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up anim-delay-150 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/report"
            className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white rounded-md h-12 px-8 font-semibold shadow-elevation-2 shadow-primary/25 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary hover:bg-primary-hover"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Report an Issue
          </Link>

          <Link
            href="/map"
            className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-primary text-text-primary border border-border-secondary rounded-md h-12 px-8 font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary hover:bg-surface-secondary shadow-elevation-1"
          >
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Operational Map
          </Link>
        </div>

        {/* Stats row */}
        <div className="animate-fade-up anim-delay-200 mt-14 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold text-text-primary tracking-tight">{value}</p>
              <p className="text-xs text-text-tertiary font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature Cards ──────────────────────────────────────── */}
      <section className="px-4 py-16 bg-surface-secondary border-t border-border-primary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Why CivIQ?
            </h2>
            <p className="text-text-secondary mt-3 text-base max-w-xl mx-auto">
              Built on trust, transparency and technology — for every citizen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURE_CARDS.map(({ title, description, icon }, i) => (
              <div
                key={title}
                className={`card-hover animate-fade-up bg-surface-elevated p-6 rounded-xl shadow-elevation-1 border border-border-primary`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA banner ──────────────────────────────────── */}
      <section className="px-4 py-14 bg-surface-primary border-t border-border-primary">
        <div className="max-w-2xl mx-auto text-center animate-fade-up">
          <h2 className="text-2xl font-extrabold text-text-primary mb-4">
            Ready to make your city better?
          </h2>
          <p className="text-text-secondary mb-8 text-sm leading-relaxed">
            Join thousands of citizens already using CivIQ to report and resolve local issues.
          </p>
          <Link
            href="/report"
            className="btn-press inline-flex items-center justify-center gap-2 bg-primary text-white rounded-md h-12 px-10 font-semibold shadow-elevation-2 shadow-primary/25 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary hover:bg-primary-hover"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

    </div>
  );
}
