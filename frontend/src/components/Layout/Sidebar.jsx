import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BookOpen,
  Upload,
  UserCheck,
  Calendar,
  Settings,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from('users')
          .select('role, display_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setRole(data.role);
              setUser(data);
            }
          });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 mt-1 -mx-4 rounded-lg text-body transition-colors ${
      isActive 
        ? 'bg-surface-raised text-fg-primary border-l-2 border-l-accent-glow -ml-[1px]' 
        : 'text-fg-secondary hover:bg-surface'
    }`;

  return (
    <aside className="w-[260px] flex flex-col bg-canvas border-r border-border-subtle h-full px-6 py-8 select-none">
      <div className="font-display text-h1 text-fg-primary mb-6 tracking-tight flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-accent-glow flex items-center justify-center shadow-focus">
          <span className="text-[14px] font-bold text-white">F</span>
        </div>
        ForgeTrack
      </div>
      
      {user && (
        <div className="mb-8">
          <p className="text-body-sm text-fg-secondary">Welcome Back,</p>
          <p className="text-h3 text-fg-primary truncate">{user.display_name}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
        {/* MENTOR NAVIGATION */}
        {role === 'mentor' && (
          <>
            <div>
              <p className="text-label text-fg-tertiary mb-2">OVERVIEW</p>
              <NavLink to="/dashboard" className={navClass}>
                <LayoutDashboard size={20} strokeWidth={1.75} /> Dashboard
              </NavLink>
            </div>
            
            <div>
              <p className="text-label text-fg-tertiary mb-2">ACTIVITY</p>
              <NavLink to="/attendance" className={navClass}>
                <CheckSquare size={20} strokeWidth={1.75} /> Mark Attendance
              </NavLink>
              <NavLink to="/history" className={navClass}>
                <Users size={20} strokeWidth={1.75} /> Student History
              </NavLink>
              <NavLink to="/materials" className={navClass}>
                <BookOpen size={20} strokeWidth={1.75} /> Materials
              </NavLink>
            </div>

            <div>
              <p className="text-label text-fg-tertiary mb-2">DATA</p>
              <NavLink to="/upload" className={navClass}>
                <Upload size={20} strokeWidth={1.75} /> Upload CSV
              </NavLink>
            </div>
          </>
        )}

        {/* STUDENT NAVIGATION */}
        {role === 'student' && (
          <>
            <div>
              <p className="text-label text-fg-tertiary mb-2">ACADEMICS</p>
              <NavLink to="/me/attendance" className={navClass}>
                <UserCheck size={20} strokeWidth={1.75} /> My Attendance
              </NavLink>
              <NavLink to="/me/upcoming" className={navClass}>
                <Calendar size={20} strokeWidth={1.75} /> Upcoming
              </NavLink>
            </div>
            
            <div>
              <p className="text-label text-fg-tertiary mb-2">RESOURCES</p>
              <NavLink to="/me/materials" className={navClass}>
                <BookOpen size={20} strokeWidth={1.75} /> Materials
              </NavLink>
            </div>
          </>
        )}
      </div>

      <div className="pt-6 border-t border-border-subtle mt-auto">
        <p className="text-label text-fg-tertiary mb-2">ACCOUNT</p>
        <button onClick={handleLogout} className="flex gap-3 px-4 py-2 mt-1 -mx-4 rounded-lg text-body text-fg-secondary hover:bg-surface w-full text-left transition-colors">
          <LogOut size={20} strokeWidth={1.75} /> Logout
        </button>
      </div>
    </aside>
  );
}
