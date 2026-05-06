import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch results based on search term
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchResults = async () => {
      const { data } = await supabase
        .from('students')
        .select('name, usn')
        .or(`name.ilike.%${searchTerm}%,usn.ilike.%${searchTerm}%`)
        .limit(5);
        
      if (data && data.length > 0) {
        setResults(data);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelect = (usn) => {
    setSearchTerm('');
    setShowDropdown(false);
    navigate(`/history?usn=${usn}`);
  };
  
  // Quick breadcrumb mockup based on route
  const getBreadcrumbs = (pathname) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return "Overview / Dashboard";
    
    return segments.map(seg => seg.charAt(0).toUpperCase() + seg.slice(1)).join(" / ");
  };

  return (
    <header className="h-[72px] px-6 md:px-8 border-b border-border-subtle flex items-center justify-between shrink-0 bg-canvas/40 backdrop-blur-md relative z-50">
      <div className="flex items-center gap-4">
        <span className="text-caption text-fg-tertiary font-medium tracking-wide">
          {getBreadcrumbs(location.pathname)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block relative" ref={searchRef}>
          <div className="h-9 bg-surface-inset border border-border-default rounded-full px-4 flex items-center gap-2 w-[240px] focus-within:border-accent-glow focus-within:shadow-focus transition-all">
             <Search size={14} className="text-fg-tertiary" />
             <input 
               type="text" 
               placeholder="Search students..." 
               className="bg-transparent border-none outline-none text-caption text-fg-primary w-full placeholder:text-fg-tertiary"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
             />
          </div>
          {showDropdown && results.length > 0 && (
            <div className="absolute top-12 right-0 w-[300px] bg-surface-raised border border-border-default rounded-xl shadow-raised overflow-hidden">
              {results.map((r, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSelect(r.usn)}
                  className="w-full text-left px-4 py-3 hover:bg-surface border-b border-border-subtle last:border-0 flex justify-between items-center transition-colors"
                >
                  <span className="text-fg-primary text-body-sm">{r.name}</span>
                  <span className="text-fg-tertiary text-caption font-mono">{r.usn}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-fg-secondary font-mono text-[12px]">
          ?
        </div>
      </div>
    </header>
  );
}
