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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Hotspots',
    ariaLabel: 'Hotspot analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/field',
    label: 'Field',
    ariaLabel: 'Field worker console',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const INCIDENT_HREF = '/incidents';

// ─── Header (client component — needs usePathname + scroll state) ─────────────
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border-primary bg-surface-primary/95 backdrop-blur supports-[backdrop-filter]:bg-surface-primary/80 transition-shadow duration-200 ${
        scrolled ? 'shadow-elevation-2' : 'shadow-none'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md group"
        >
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">CivIQ</span>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 text-sm font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative px-3 py-2 rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                isActive(href)
                  ? 'text-primary font-semibold bg-primary/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              {label}
              {isActive(href) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" aria-hidden="true" />
              )}
            </Link>
          ))}

          {/* Incidents — always prominent */}
          <Link
            href={INCIDENT_HREF}
            className={`relative px-3 py-2 rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 flex items-center gap-1.5 font-bold ${
              isActive(INCIDENT_HREF)
                ? 'text-red-700 bg-red-50'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
            aria-current={isActive(INCIDENT_HREF) ? 'page' : undefined}
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            Incidents
          </Link>
        </nav>

        {/* Mobile: Report CTA */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/report"
            className="btn-press inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 h-9 rounded-md transition-colors hover:bg-primary-hover active:bg-primary-active outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Report
          </Link>
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
    // Center item is Report (rendered separately)
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-primary/95 backdrop-blur border-t border-border-primary supports-[backdrop-filter]:bg-surface-primary/90"
    >
      <div className="flex items-center justify-around px-1 py-1">
        {[BOTTOM_ITEMS[0], BOTTOM_ITEMS[1]].map(({ href, label, ariaLabel, icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={ariaLabel}
            aria-current={isActive(href) ? 'page' : undefined}
            className="mobile-nav-item"
          >
            <span className={`transition-colors duration-150 ${isActive(href) ? 'text-primary' : 'text-text-tertiary'}`}>
              {icon}
            </span>
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}

        {/* Centre Report FAB */}
        <Link
          href="/report"
          aria-label="Report a civic issue"
          className="btn-press flex flex-col items-center justify-center -mt-5 w-14 h-14 rounded-full bg-primary shadow-elevation-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[9px] font-bold leading-none mt-0.5">Report</span>
        </Link>

        {[BOTTOM_ITEMS[2], BOTTOM_ITEMS[3]].map(({ href, label, ariaLabel, icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={ariaLabel}
            aria-current={isActive(href) ? 'page' : undefined}
            className="mobile-nav-item"
          >
            <span className={`transition-colors duration-150 ${
              href === INCIDENT_HREF
                ? isActive(href) ? 'text-red-700' : 'text-red-500'
                : isActive(href) ? 'text-primary' : 'text-text-tertiary'
            }`}>
              {icon}
            </span>
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
