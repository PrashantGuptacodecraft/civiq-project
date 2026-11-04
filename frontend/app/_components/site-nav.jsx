'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// ─── Nav link definitions ────────────────────────────────────────────────────
const NAV_LINKS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    ariaLabel: 'Command dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/assets',
    label: 'Assets',
    ariaLabel: 'Asset intelligence',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    ariaLabel: 'Hotspot analytics',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'Map',
    ariaLabel: 'Operational map',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    href: '/verification',
    label: 'Verify',
    ariaLabel: 'Verification console',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/field',
    label: 'Field',
    ariaLabel: 'Field worker console',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const INCIDENT_HREF = '/incidents';

// ─── CivIQ Logo Mark ─────────────────────────────────────────────────────────
function LogoMark({ size = 32 }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-xl overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
      {/* Subtle inner shine */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
      <svg
        className="relative w-4/6 h-4/6 text-white drop-shadow-sm"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-elevation-2 border-b border-border-primary/60'
          : 'bg-white/80 backdrop-blur-md border-b border-border-primary/40'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl group shrink-0"
          aria-label="CivIQ home"
        >
          <div className="transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
            <LogoMark size={34} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-base tracking-tight text-text-primary">CivIQ</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary hidden sm:block">
              Civic Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-0.5 text-sm font-medium">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                  active
                    ? 'text-primary bg-primary/8 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className={`transition-colors duration-150 ${active ? 'text-primary' : 'text-text-tertiary group-hover:text-text-secondary'}`}>
                  {icon}
                </span>
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}

          {/* Incidents — always prominent */}
          <Link
            href={INCIDENT_HREF}
            className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 font-semibold ${
              isActive(INCIDENT_HREF)
                ? 'text-red-700 bg-red-50'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50/80'
            }`}
            aria-current={isActive(INCIDENT_HREF) ? 'page' : undefined}
          >
            {/* Live pulse dot */}
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Incidents
          </Link>
        </nav>

        {/* Right side — CTA */}
        <div className="flex items-center gap-2">
          {/* Report button — desktop */}
          <Link
            href="/report"
            className="hidden md:inline-flex btn-press items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 h-9 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-elevation-1 shadow-primary/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Report Issue
          </Link>

          {/* Mobile: Report CTA only */}
          <div className="md:hidden">
            <Link
              href="/report"
              className="btn-press inline-flex items-center gap-1 bg-primary text-white text-xs font-bold px-3 h-9 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Report
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
export function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

  const BOTTOM_ITEMS = [
    NAV_LINKS[0], // Dashboard
    NAV_LINKS[3], // Map
    // Centre = Report FAB
    NAV_LINKS[4], // Verify
    {
      href: INCIDENT_HREF,
      label: 'Incidents',
      ariaLabel: 'Incident emergency response',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-border-primary/50 shadow-elevation-3"
    >
      <div className="flex items-center justify-around px-2 py-1 pb-safe-bottom">
        {[BOTTOM_ITEMS[0], BOTTOM_ITEMS[1]].map(({ href, label, ariaLabel, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={ariaLabel}
              aria-current={active ? 'page' : undefined}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
            >
              <span className={`transition-all duration-200 ${active ? 'text-primary scale-110' : 'text-text-tertiary'}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold leading-none mt-0.5 ${active ? 'text-primary' : 'text-text-tertiary'}`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Centre Report FAB */}
        <Link
          href="/report"
          aria-label="Report a civic issue"
          className="btn-press flex flex-col items-center justify-center -mt-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-elevation-3 shadow-primary/30 text-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[8px] font-bold leading-none mt-0.5 tracking-wide">REPORT</span>
        </Link>

        {[BOTTOM_ITEMS[2], BOTTOM_ITEMS[3]].map(({ href, label, ariaLabel, icon }) => {
          const active = isActive(href);
          const isIncident = href === INCIDENT_HREF;
          return (
            <Link
              key={href}
              href={href}
              aria-label={ariaLabel}
              aria-current={active ? 'page' : undefined}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
            >
              <span className={`transition-all duration-200 ${
                isIncident
                  ? active ? 'text-red-600 scale-110' : 'text-red-400'
                  : active ? 'text-primary scale-110' : 'text-text-tertiary'
              }`}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold leading-none mt-0.5 ${
                isIncident
                  ? active ? 'text-red-600' : 'text-red-400'
                  : active ? 'text-primary' : 'text-text-tertiary'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
