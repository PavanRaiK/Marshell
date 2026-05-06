import React from 'react';

export default function DevTokens() {
  return (
    <div className="p-12 max-w-4xl mx-auto flex flex-col gap-12">
      <div>
        <h1 className="text-display-lg text-fg-primary mb-4">Design System Test</h1>
        <p className="text-body-lg text-fg-secondary">This page exists to verify that fonts, colors, and layout tokens are rendering correctly.</p>
      </div>

      <div className="card">
        <p className="text-label text-fg-tertiary mb-2">COMPONENTS</p>
        <h2 className="text-h2 text-fg-primary mb-6">Interactive Elements</h2>
        
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
          </div>

          <div className="flex gap-4 items-center">
            <span className="inline-flex items-center gap-1 font-semibold text-[12px] font-body tabular-nums bg-success-bg text-success border border-success-border px-2.5 py-1 rounded-full">
              + 1.09% Success
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[12px] font-body tabular-nums bg-danger-bg text-danger border border-danger-border px-2.5 py-1 rounded-full">
              - Absent Pill
            </span>
          </div>

          <div>
            <label className="block text-label text-fg-secondary mb-2">SAMPLE INPUT</label>
            <input 
              type="text" 
              placeholder="Enter something..." 
              className="bg-surface-inset border border-border-default rounded-md px-4 py-3 text-fg-primary text-[14px] w-full max-w-sm focus:border-accent-glow focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25)] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
