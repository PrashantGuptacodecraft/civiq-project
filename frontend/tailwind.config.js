const config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './features/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            spacing: {
                '1': '4px',
                '2': '8px',
                '3': '12px',
                '4': '16px',
                '5': '20px',
                '6': '24px',
                '8': '32px',
                '10': '40px',
                '12': '48px',
                '16': '64px',
            },
            borderRadius: {
                'sm': '4px',
                'md': '8px',
                'lg': '12px',
                'xl': '16px',
                '2xl': '20px',
                '3xl': '24px',
                'full': '9999px',
            },
            colors: {
                primary: {
                    DEFAULT: '#2563EB',
                    hover: '#1D4ED8',
                    active: '#1E40AF',
                    subtle: '#EFF6FF',
                },
                secondary: {
                    DEFAULT: '#475569',
                },
                accent: {
                    DEFAULT: '#8B5CF6',
                    hover: '#7C3AED',
                },
                surface: {
                    primary: '#FFFFFF',
                    secondary: '#F8FAFC',
                    tertiary: '#F1F5F9',
                    elevated: '#FFFFFF',
                    overlay: '#00000080',
                    glass: 'rgba(255,255,255,0.75)',
                    'glass-dark': 'rgba(15,23,42,0.85)',
                },
                text: {
                    primary: '#0F172A',
                    secondary: '#475569',
                    tertiary: '#94A3B8',
                    inverse: '#FFFFFF',
                    muted: '#CBD5E1',
                },
                border: {
                    primary: '#E2E8F0',
                    secondary: '#CBD5E1',
                    subtle: '#F1F5F9',
                    strong: '#94A3B8',
                },
                status: {
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                    info: '#3B82F6',
                    neutral: '#64748B',
                },
                // CivIQ-specific workflow colors
                workflow: {
                    pending: '#64748B',
                    'in-review': '#3B82F6',
                    verified: '#10B981',
                    rejected: '#EF4444',
                    suspicious: '#F59E0B',
                    'needs-evidence': '#F97316',
                    duplicate: '#8B5CF6',
                },
                priority: {
                    critical: '#DC2626',
                    high: '#EA580C',
                    medium: '#CA8A04',
                    low: '#65A30D',
                },
                trust: {
                    trusted: '#059669',
                    established: '#0D9488',
                    new: '#64748B',
                    flagged: '#D97706',
                    suspended: '#DC2626',
                },
                ai: {
                    recommendation: '#7C3AED',
                },
                // Deep slate palette for premium dark accents
                slate: {
                    950: '#020617',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'hero-grid': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            },
            boxShadow: {
                'elevation-0': 'none',
                'elevation-1': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
                'elevation-2': '0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
                'elevation-3': '0 12px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.08)',
                'elevation-4': '0 24px 48px -8px rgb(0 0 0 / 0.14), 0 8px 16px -8px rgb(0 0 0 / 0.08)',
                'glow-primary': '0 0 0 3px rgba(37,99,235,0.15), 0 4px 16px rgba(37,99,235,0.12)',
                'glow-success': '0 0 0 3px rgba(16,185,129,0.15), 0 4px 16px rgba(16,185,129,0.1)',
                'glow-error': '0 0 0 3px rgba(239,68,68,0.15), 0 4px 16px rgba(239,68,68,0.1)',
                'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)',
                'card-hover': '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.08), 0 0 0 1px rgb(0 0 0 / 0.06)',
            },
            fontFamily: {
                sans: ['Inter var', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
            },
            keyframes: {
                'shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(6px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-down': {
                    from: { opacity: '0', transform: 'translateY(-8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    from: { opacity: '0', transform: 'scale(0.95)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                'slide-in-right': {
                    from: { opacity: '0', transform: 'translateX(20px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
                'slide-in-bottom': {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'waveform-bar': {
                    '0%, 100%': { transform: 'scaleY(0.35)' },
                    '50%': { transform: 'scaleY(1)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                'count-up': {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'border-spin': {
                    '100%': { transform: 'rotate(360deg)' },
                },
            },
            animation: {
                'shimmer': 'shimmer 1.8s ease-in-out infinite',
                'fade-in': 'fade-in 240ms cubic-bezier(0.16,1,0.3,1) both',
                'fade-up': 'fade-up 280ms cubic-bezier(0.16,1,0.3,1) both',
                'fade-down': 'fade-down 240ms cubic-bezier(0.16,1,0.3,1) both',
                'scale-in': 'scale-in 220ms cubic-bezier(0.16,1,0.3,1) both',
                'slide-in-right': 'slide-in-right 260ms cubic-bezier(0.16,1,0.3,1) both',
                'slide-in-bottom': 'slide-in-bottom 320ms cubic-bezier(0.16,1,0.3,1) both',
                'waveform-bar': 'waveform-bar 1.1s ease-in-out infinite',
                'float': 'float 4s ease-in-out infinite',
                'gradient-shift': 'gradient-shift 6s ease infinite',
                'border-spin': 'border-spin 4s linear infinite',
            },
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
export default config;
