import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search } from 'lucide-react';

export default function StudentHistory() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStudent, setActiveStudent] = useState(null);
  
  // Analytics blocks
  const [history, setHistory] = useState([]); // Raw attendance join sessions array
  const [stats, setStats] = useState({ pct: 0, attended: 0, total: 0, streak: 0, maxStreak: 0 });

  useEffect(() => {
    // Load student directory
    supabase.from('students').select('id, name, usn, branch_code, batch').order('name')
       .then(({data}) => {
          if (data) setStudents(data);
       });
  }, []);

  const loadHistory = (studentId) => {
    supabase.from('attendance')
       .select('present, sessions(date, topic, duration_hours, session_type)')
       .eq('student_id', studentId)
       .order('sessions(date)', { ascending: false })
       .then(({ data }) => {
          if (!data) return;
          setHistory(data);

          // Calculate stats
          const total = data.length;
          const attended = data.filter(r => r.present).length;
          const pct = Math.round((attended / (total || 1)) * 100);

          // Streaks - array is ordered descending by date because of 'order()' usually, 
          // but we must be careful. Let's explicitly sort by date to be safe.
          const sorted = [...data].sort((a,b) => new Date(b.sessions.date) - new Date(a.sessions.date));
          
          let curStreak = 0;
          for(let i=0; i<sorted.length; i++) {
             if (sorted[i].present) curStreak++; else break;
          }

          let maxStreak = 0, temp = 0;
          for(let i=0; i<sorted.length; i++) {
             if (sorted[i].present) { temp++; maxStreak = Math.max(maxStreak, temp); }
             else { temp = 0; }
          }

          setStats({ pct, attended, total, streak: curStreak, maxStreak });
       });
  };

  const selectStudent = (student) => {
    setActiveStudent(student);
    setSearchTerm('');
    loadHistory(student.id);
  };

  const filteredList = students.filter(s => 
     s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.usn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto animate-in fade-in">
       <h1 className="text-h1 font-display mb-2">Student History Mapping</h1>

       {/* Search Combobox Mock */}
       <div className="relative z-30">
         <div className="relative">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" />
           <input 
              type="text" 
              placeholder="Search by Name or USN..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input w-full pl-11 bg-surface-inset shadow-card focus:shadow-focus transition-all"
           />
         </div>
         {searchTerm.length > 0 && (
           <div className="absolute top-14 left-0 w-full bg-surface-raised border border-border-default rounded-xl shadow-raised overflow-hidden">
             {filteredList.slice(0, 5).map(s => (
               <button key={s.id} onClick={() => selectStudent(s)} className="w-full text-left px-6 py-3 hover:bg-surface border-b border-border-subtle last:border-0 flex justify-between items-center transition-colors">
                  <span className="text-fg-primary text-body">{s.name}</span>
                  <span className="text-fg-tertiary text-caption font-mono">{s.usn}</span>
               </button>
             ))}
             {filteredList.length === 0 && <p className="px-6 py-4 text-caption text-fg-tertiary">No student matching term.</p>}
           </div>
         )}
       </div>

       {!activeStudent ? (
          <div className="card min-h-[400px] flex items-center justify-center flex-col mt-4 border-dashed bg-transparent shadow-none">
             <Users size={48} className="text-fg-tertiary opacity-30 mb-4" />
             <p className="text-body text-fg-secondary">Search and select a student above to view their attendance profile.</p>
          </div>
       ) : (
          <div className="flex flex-col animate-in slide-in-from-bottom-2 fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Profile Card */}
                <div className="card col-span-1 flex flex-col justify-between">
                   <div>
                      <p className="text-label text-fg-tertiary mb-2">STUDENT PROFILE</p>
                      <h2 className="text-display-sm text-fg-primary leading-none mb-4">{activeStudent.name}</h2>
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1 bg-surface-inset border border-border-default rounded-md text-caption font-mono text-fg-secondary">{activeStudent.usn}</span>
                        <span className="px-3 py-1 bg-surface-inset border border-border-default rounded-md text-caption text-fg-secondary">{activeStudent.branch_code}</span>
                      </div>
                   </div>
                   <div className="border-t border-border-subtle pt-6 flex items-end justify-between">
                      <div>
                        <p className="text-caption text-fg-tertiary mb-1">Overall Attendance</p>
                        <p className={`text-display-md tabular-nums leading-none ${stats.pct > 75 ? 'text-success' : stats.pct > 60 ? 'text-warning' : 'text-danger'}`}>
                           {stats.pct}%
                        </p>
                      </div>
                      <div className="text-right text-caption text-fg-secondary">
                        <p>{stats.attended} of {stats.total}</p>
                        <p>Sessions</p>
                      </div>
                   </div>
                </div>

                {/* Heatmap Grid Mock */}
                <div className="card col-span-1 lg:col-span-2">
                   <p className="text-label text-fg-tertiary mb-4">ATTENDANCE HEATMAP (LATEST 30 SESSIONS)</p>
                   <div className="flex flex-wrap gap-2 content-start">
                     {/* We map the history into blocks, max 35 blocks */}
                     {Array.from({length: 35}).map((_, idx) => {
                        const rec = history[idx];
                        if (!rec) return <div key={idx} className="w-8 h-8 rounded-md bg-surface-inset opacity-50" title="No Session" />;
                        return (
                           <div key={idx} 
                                title={`${rec.sessions.date}: ${rec.present ? 'Present' : 'Absent'}`}
                                className={`w-8 h-8 rounded-md ${rec.present ? 'bg-success-bg border border-success-border' : 'bg-danger-bg border border-danger-border'} transition-all hover:scale-110 cursor-help`} 
                           />
                        );
                     })}
                   </div>
                   <div className="mt-8 pt-6 border-t border-border-subtle grid grid-cols-3 gap-4">
                      <div>
                         <p className="text-caption text-fg-tertiary">Current Streak</p>
                         <p className="text-h2 text-fg-primary tabular-nums">{stats.streak} <span className="text-body text-fg-secondary">days</span></p>
                      </div>
                      <div>
                         <p className="text-caption text-fg-tertiary">Longest Streak</p>
                         <p className="text-h2 text-fg-primary tabular-nums">{stats.maxStreak} <span className="text-body text-fg-secondary">days</span></p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Table Listing */}
             <div className="card overflow-x-auto p-0 border border-border-subtle">
                <table className="table">
                   <thead>
                      <tr>
                        <th className="w-32">Date ⇅</th>
                        <th>Topic</th>
                        <th className="w-32">Status</th>
                        <th className="w-24 text-right">Hours</th>
                      </tr>
                   </thead>
                   <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                           <td className="font-mono text-fg-secondary">{h.sessions.date}</td>
                           <td className="font-medium">{h.sessions.topic} <span className="text-caption text-fg-tertiary ml-2 italic">{h.sessions.session_type}</span></td>
                           <td>
                              <span className={`pill ${h.present ? 'pill-success' : 'pill-danger'}`}>{h.present ? 'Present' : 'Absent'}</span>
                           </td>
                           <td className="text-right text-fg-secondary">{h.sessions.duration_hours}h</td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                         <tr><td colSpan="4" className="text-center py-8 text-fg-tertiary">No records exist for this student.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       )}
    </div>
  );
}

// Ensure lucide icon 'Users' mock works if needed above 
import { Users } from 'lucide-react';
