import Link from 'next/link';

const FEATURE_CARDS = [
  {
    title: 'Cryptographic Verification',
    description:
      'Every report is device-fingerprinted and hash-chained. AI deduplication catches duplicates instantly — no paperwork, no ambiguity.',
    badge: 'Trust Layer',
    badgeColor: 'text-status-info bg-status-info/10 border-status-info/20',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-500/10',
  },
  {
    title: 'Smart AI Triaging',
    description:
      'Automated categorization, severity scoring, and intelligent routing deliver each issue to the right department in under 30 seconds.',
    badge: 'AI-Powered',
    badgeColor: 'text-accent bg-accent/10 border-accent/20',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-500/10',
  },
  {
    title: 'Real-time Resolution',
    description:
      'Field workers close the loop with before/after photo proof. SLA timers, ward breakdowns, and department KPIs at your fingertips.',
    badge: 'Live Updates',
    badgeColor: 'text-status-success bg-status-success/10 border-status-success/20',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-500/10',
  },
];

const STATS = [
  { value: '12,000+', label: 'Issues Resolved', sub: 'since launch' },
  { value: '98%', label: 'Verification Rate', sub: 'AI + human review' },
  { value: '47', label: 'Municipalities', sub: 'across Maharashtra' },
  { value: '<30s', label: 'Avg. Triage Time', sub: 'per submission' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Snap & Submit',
    desc: 'Report a pothole, broken streetlight, or drainage issue in under 60 seconds. Voice reporting available in Hindi and Marathi.',
  },
  {
    step: '02',
    title: 'Verify & Route',
    desc: 'AI deduplicates, categorizes, and routes to the right department. Human officers verify high-priority and disputed reports.',
  },
  {
    step: '03',
    title: 'Resolve & Close',
    desc: 'Field workers complete the task and upload before/after proof. You get notified when your issue is officially resolved.',
  },
];

export default function HomePage() {
  return (
    <div className="flex-1 w-full bg-surface-primary overflow-x-hidden">

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-20 pb-24 md:pt-28 md:pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 line-grid" aria-hidden="true" />

        {/* Large ambient glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.1) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          }}
        />
        {/* Secondary accent glow */}
        <div
          className="absolute top-40 right-0 w-[400px] h-[400px] pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-8">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Now live across Pune — PMC &amp; PCMC
          </div>

          {/* Main heading */}
          <h1 className="animate-fade-up anim-delay-50 text-4xl md:text-6xl lg:text-7xl font-black text-text-primary tracking-tight leading-[1.08] mb-6">
            Civic issues, reported{' '}
            <span
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #8B5CF6 50%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              intelligently.
            </span>
          </h1>

          <p className="animate-fade-up anim-delay-100 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            CivIQ connects citizens directly to officials. Report a problem, track its resolution, and hold your municipality accountable — all in one verified platform.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up anim-delay-150 flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/report"
              className="btn-press group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl h-13 px-8 font-bold text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <svg className="w-4 h-4 transition-transform duration-150 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Report an Issue
            </Link>

            <Link
              href="/dashboard"
              className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-primary text-text-primary border border-border-secondary rounded-2xl h-13 px-8 font-semibold text-sm transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary hover:bg-surface-secondary hover:border-border-strong hover:shadow-elevation-2"
            >
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Dashboard
            </Link>
          </div>

          {/* Stats strip */}
          <div className="animate-fade-up anim-delay-200">
            <div
              className="inline-flex flex-col sm:flex-row items-center gap-0 sm:gap-0 rounded-2xl border border-border-primary overflow-hidden shadow-elevation-1"
              role="list"
              aria-label="Platform statistics"
            >
              {STATS.map(({ value, label, sub }, i) => (
                <div
                  key={label}
                  role="listitem"
                  className={`flex-1 px-6 py-4 text-center bg-surface-primary hover:bg-surface-secondary transition-colors duration-150 ${
                    i < STATS.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-border-primary' : ''
                  }`}
                >
                  <p className="text-2xl font-black text-text-primary tracking-tight">{value}</p>
                  <p className="text-xs font-semibold text-text-secondary mt-0.5">{label}</p>
                  <p className="text-[10px] text-text-tertiary">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────── */}
      <section className="px-4 py-20 bg-surface-secondary border-y border-border-primary">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
              The Process
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight">
              Three steps to resolution
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div
              className="hidden md:block absolute top-10 left-[calc(33.3%+2rem)] right-[calc(33.3%+2rem)] h-px border-t-2 border-dashed border-border-secondary"
              aria-hidden="true"
            />

            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center p-6 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 text-2xl font-black text-primary border border-primary/20 shadow-elevation-1"
                  style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(139,92,246,0.06) 100%)' }}
                  aria-hidden="true"
                >
                  {step}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Cards ───────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Why CivIQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight">
              Built for trust, designed for speed
            </h2>
            <p className="text-text-secondary mt-3 text-base max-w-xl mx-auto leading-relaxed">
              Every layer of CivIQ is engineered to prevent misuse, accelerate response, and create accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURE_CARDS.map(({ title, description, icon, badge, badgeColor, gradient, iconColor, iconBg }, i) => (
              <article
                key={title}
                className="group relative p-6 rounded-2xl border border-border-primary bg-surface-elevated shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Subtle bg gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} aria-hidden="true" />

                <div className="relative">
                  {/* Badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border mb-4 ${badgeColor}`}>
                    {badge}
                  </span>

                  {/* Icon */}
                  <div className={`w-11 h-11 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center mb-4`}>
                    {icon}
                  </div>

                  <h3 className="text-base font-bold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden px-8 py-14 text-center"
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
            }}
          >
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-20"
              aria-hidden="true"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            {/* Glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
              aria-hidden="true"
              style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.3) 0%, transparent 70%)' }}
            />

            <div className="relative">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Platform is live
              </span>

              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                Your city, your voice.
              </h2>
              <p className="text-white/60 mb-8 text-base max-w-lg mx-auto leading-relaxed">
                Join thousands of citizens already using CivIQ to hold local government accountable and get real results.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/report"
                  className="btn-press group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-text-primary font-bold text-sm rounded-2xl h-12 px-8 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 hover:bg-white/90 transition-colors"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Report an Issue — It&apos;s Free
                </Link>
                <Link
                  href="/map"
                  className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-2xl h-12 px-8 border border-white/20 outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Explore Live Map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
