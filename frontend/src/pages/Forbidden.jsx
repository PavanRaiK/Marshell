import React from 'react';

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
      <div className="mb-6 p-6 rounded-full bg-danger-bg ring-1 ring-danger-border flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h1 className="text-display-md text-fg-primary mb-4 font-display">Access Denied</h1>
      <p className="text-body-lg text-fg-secondary max-w-md mx-auto mb-8">
        You do not have permission to view this page. If you believe this is an error, please contact your mentor.
      </p>
      <button 
        onClick={() => window.history.back()}
        className="btn-primary"
      >
        Go Back
      </button>
    </div>
  );
}
