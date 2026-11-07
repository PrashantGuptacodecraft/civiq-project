'use client';

/**
 * CivIQ Login Page
 *
 * Two tabs:
 *   1. Citizen — Phone OTP flow
 *   2. Official — Email + Password flow
 *
 * On success: stores token → redirects to role-appropriate route
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context.jsx';

// Role → landing route mapping
function roleDashboard(role) {
  const map = {
    PLATFORM_SUPER_ADMIN: '/dashboard',
    NATIONAL_ADMIN:        '/dashboard',
    STATE_ADMIN:           '/dashboard',
    DISTRICT_ULB_ADMIN:    '/dashboard',
    DEPARTMENT_OFFICER:    '/dashboard',
    VERIFICATION_OFFICER:  '/verification',
    FIELD_SUPERVISOR:      '/field',
    FIELD_WORKER:          '/field',
    DISASTER_COORDINATOR:  '/situation-room',
    AUDITOR:               '/analytics',
    CITIZEN:               '/',
  };
  return map[role] ?? '/';
}

// ─── OTP Flow ─────────────────────────────────────────────────────────────────
function CitizenLoginTab() {
  const { login } = useAuth();
  const router    = useRouter();

  const [step, setStep]       = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function sendOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed to send OTP.');
      setStep('otp');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Invalid OTP.');
      login(data.token, data.user);
      router.push(roleDashboard(data.user.role));
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="phone">
              Mobile Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 h-11 bg-surface-tertiary border border-r-0 border-border-primary rounded-l-xl text-sm text-text-secondary font-medium">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone.replace('+91', '')}
                onChange={(e) => setPhone('+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 h-11 px-3 bg-white border border-border-primary rounded-r-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                required
                autoFocus
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || phone.replace('+91', '').length < 10}
            className="btn-press w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-sm"
          >
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-sm text-text-secondary">
            OTP sent to <span className="font-semibold text-text-primary">{phone}</span>.{' '}
            <button type="button" onClick={() => setStep('phone')} className="text-primary hover:underline">
              Change
            </button>
          </p>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="otp">
              Enter 6-digit OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full h-11 px-3 bg-white border border-border-primary rounded-xl text-sm text-center tracking-[0.5em] font-mono text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="btn-press w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-sm"
          >
            {loading ? 'Verifying…' : 'Verify & Login'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Email+Password Flow ───────────────────────────────────────────────────────
function OfficialLoginTab() {
  const { login } = useAuth();
  const router    = useRouter();

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');
  const [showPw, setShowPw]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Login failed.');
      login(data.token, data.user);
      router.push(roleDashboard(data.user.role));
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="email">
          Official Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="officer@pune.gov.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-11 px-3 bg-white border border-border-primary rounded-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3 pr-10 bg-white border border-border-primary rounded-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn-press w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-sm"
      >
        {loading ? 'Logging in…' : 'Login to CivIQ'}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState('citizen');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-elevation-2 border border-border-primary/60 overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-7 pb-5 border-b border-border-primary/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #8B5CF6)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary leading-tight">Sign in to CivIQ</h1>
                <p className="text-xs text-text-tertiary">Civic Intelligence Platform</p>
              </div>
            </div>

            {/* Tab selector */}
            <div className="flex bg-surface-tertiary rounded-xl p-1 gap-1" role="tablist">
              {[
                { id: 'citizen', label: 'Citizen (OTP)' },
                { id: 'official', label: 'Official Login' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    tab === id
                      ? 'bg-white text-text-primary shadow-elevation-1'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-6 py-5">
            {tab === 'citizen' ? <CitizenLoginTab /> : <OfficialLoginTab />}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center space-y-2">
            {tab === 'citizen' && (
              <p className="text-xs text-text-tertiary">
                New to CivIQ?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Create account
                </Link>
              </p>
            )}
            <p className="text-[10px] text-text-tertiary">
              By continuing, you agree to CivIQ&apos;s terms of service and privacy policy.
            </p>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-text-tertiary mt-5">
          Government officials: use your official department email to login.
        </p>
      </div>
    </div>
  );
}
