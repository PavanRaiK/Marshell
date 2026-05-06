import React from 'react';
import { useLocation } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();
  
  // Quick breadcrumb mockup based on route
  const getBreadcrumbs = (pathname) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return "Overview / Dashboard";
    
    return segments.map(seg => seg.charAt(0).toUpperCase() + seg.slice(1)).join(" / ");
  };

  return (
    <header className="h-[72px] px-6 md:px-8 border-b border-border-subtle flex items-center justify-between shrink-0 bg-canvas/40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <span className="text-caption text-fg-tertiary font-medium tracking-wide">
          {getBreadcrumbs(location.pathname)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for Search/Avatar per spec */}
        <div className="hidden md:flex h-9 bg-surface-inset border border-border-default rounded-full px-4 items-center gap-2 max-w-[200px]">
           <span className="text-fg-tertiary text-caption whitespace-nowrap">Search...</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-fg-secondary font-mono text-[12px]">
          ?
        </div>
      </div>
    </header>
  );
}
