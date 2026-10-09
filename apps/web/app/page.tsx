export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-md w-full bg-surface-elevated rounded-lg shadow-elevation-2 border border-border-primary p-6 text-center">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome to CivIQ</h1>
        <p className="text-text-secondary mb-8">
          The civic intelligence platform for reporting and resolving community issues.
        </p>
        
        <div className="space-y-4">
          <button className="w-full bg-primary hover:bg-primary-hover active:bg-primary-active text-white rounded-md py-3 px-4 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed">
            Report an Issue
          </button>
          
          <button className="w-full bg-surface-primary hover:bg-surface-secondary text-text-primary border border-border-primary rounded-md py-3 px-4 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed">
            Official Sign In
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-text-tertiary">
        CivIQ Starter Platform &copy; 2026
      </div>
    </div>
  );
}
