'use client';

/**
 * CivIQ Citizen Registration Page
 *
 * Flow: Phone → OTP → Name + Terms → Account Created → Login
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep]       = useState('phone'); // 'phone' | 'otp' | 'profile'
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [name, setName]       = useState('');
  const [agreed, setAgreed]   = useState(false);
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
      // Store token temporarily for profile update
      sessionStorage.setItem('civiq_reg_token', data.token);
      setStep('profile');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function completeProfile(e) {
    e.preventDefault();
    if (!agreed) return setError('Please accept the terms to continue.');
    setError('');
    setLoading(true);
    try {
      const token = sessionStorage.getItem('civiq_reg_token');
      if (name.trim()) {
        await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Store the actual session in localStorage
        localStorage.setItem('civiq_session_token', token);
      }
      sessionStorage.removeItem('civiq_reg_token');
      router.push('/');
    } catch {
      setError('Could not complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const stepLabels = { phone: 'Mobile', otp: 'Verify', profile: 'Profile' };
  const steps = ['phone', 'otp', 'profile'];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-elevation-2 border border-border-primary/60 overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-7 pb-5 border-b border-border-primary/50">
            <h1 className="text-lg font-bold text-text-primary mb-1">Create CivIQ Account</h1>
            <p className="text-xs text-text-tertiary">Report issues, track resolutions, hold officials accountable.</p>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mt-4">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    i <= currentIdx ? 'bg-primary text-white' : 'bg-surface-tertiary text-text-tertiary'
                  }`}>
                    {i < currentIdx ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold ${i <= currentIdx ? 'text-primary' : 'text-text-tertiary'}`}>
                    {stepLabels[s]}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`h-px w-6 ${i < currentIdx ? 'bg-primary' : 'bg-border-primary'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="px-6 py-5">

            {step === 'phone' && (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="reg-phone">
                    Mobile Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 h-11 bg-surface-tertiary border border-r-0 border-border-primary rounded-l-xl text-sm text-text-secondary font-medium">
                      +91
                    </span>
                    <input
                      id="reg-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone.replace('+91', '')}
                      onChange={(e) => setPhone('+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 h-11 px-3 bg-white border border-border-primary rounded-r-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || phone.replace('+91', '').length < 10}
                  className="btn-press w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-sm text-text-secondary">
                  OTP sent to <span className="font-semibold text-text-primary">{phone}</span>.{' '}
                  <button type="button" onClick={() => setStep('phone')} className="text-primary hover:underline">Change</button>
                </p>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="reg-otp">
                    6-digit OTP
                  </label>
                  <input
                    id="reg-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full h-11 px-3 bg-white border border-border-primary rounded-xl text-sm text-center tracking-[0.5em] font-mono text-text-primary outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-press w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
              </form>
            )}

            {step === 'profile' && (
              <form onSubmit={completeProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="reg-name">
                    Your Name <span className="text-text-tertiary font-normal">(optional)</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-border-primary rounded-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border-primary text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-text-secondary leading-relaxed">
                    I agree to CivIQ&apos;s terms of service and consent to civic data being used for issue resolution by relevant municipal authorities.
                  </span>
                </label>

                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !agreed}
                  className="btn-press w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {loading ? 'Setting up…' : 'Complete Registration'}
                </button>
              </form>
            )}
          </div>

          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-text-tertiary">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
