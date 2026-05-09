import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import {
  Search, Users, TrendingUp, TrendingDown, Award, Flame,
  Calendar, Clock, BookOpen, Percent
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

const pctColor = (p) =>
  p >= 75 ? 'text-success' : p >= 60 ? 'text-warning' : 'text-danger';

const pctBg = (p) =>
  p >= 75 ? 'bg-success' : p >= 60 ? 'bg-warning' : 'bg-danger';

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-fg-primary' }) => (
  <div className="card flex items-center gap-4 p-5">
    <div className="w-10 h-10 rounded-xl bg-surface-inset flex items-center justify-center shrink-0">
      <Icon size={18} className="text-fg-secondary" />
    </div>
    <div className="min-w-0">
      <p className="text-caption text-fg-tertiary mb-0.5">{label}</p>
      <p className={`text-h2 tabular-nums font-semibold leading-none ${color}`}>{value}</p>
      {sub && <p className="text-caption text-fg-tertiary mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── main component ────────────────────────────────────────────────────────────

export default function StudentHistory() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStudent, setActiveStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    pct: 0, attended: 0, total: 0,
    streak: 0, maxStreak: 0,
    hoursAttended: 0, totalHours: 0,
    firstSession: null, lastSession: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('students')
      .select('id, name, usn, branch_code, batch, email, is_active')
      .order('name')
      .then(({ data }) => {
        if (data) {
          setStudents(data);
          const usnParam = searchParams.get('usn');
          if (usnParam) {
            const target = data.find((s) => s.usn === usnParam);
            if (target) {
              setActiveStudent(target);
              loadHistory(target.id);
            }
          }
        }
      });
  }, [searchParams]);

  const loadHistory = (studentId) => {
    setLoading(true);
    setHistory([]);
    supabase
      .from('attendance')
      .select('present, marked_at, sessions(id, date, topic, duration_hours, session_type)')
      .eq('student_id', studentId)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }

        // Sort ascending by date for streak logic, descending for display
        const sorted = [...data].sort(
          (a, b) => new Date(a.sessions.date) - new Date(b.sessions.date)
        );

        const total = sorted.length;
        const attended = sorted.filter((r) => r.present).length;
        const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

        const hoursAttended = sorted
          .filter((r) => r.present)
          .reduce((s, r) => s + (r.sessions.duration_hours || 0), 0);
        const totalHours = sorted
          .reduce((s, r) => s + (r.sessions.duration_hours || 0), 0);

        // Current streak (from most recent backwards)
        const desc = [...sorted].reverse();
        let streak = 0;
        for (const r of desc) {
          if (r.present) streak++;
          else break;
        }

        // Max streak
        let maxStreak = 0, temp = 0;
        for (const r of sorted) {
          if (r.present) { temp++; maxStreak = Math.max(maxStreak, temp); }
          else temp = 0;
        }

        const firstSession = sorted[0]?.sessions?.date || null;
        const lastSession  = sorted[sorted.length - 1]?.sessions?.date || null;

        setStats({ pct, attended, total, streak, maxStreak, hoursAttended, totalHours, firstSession, lastSession });
        // Display newest first
        setHistory(desc);
        setLoading(false);
      });
  };

  const selectStudent = (student) => {
    setActiveStudent(student);
    setSearchTerm('');
    loadHistory(student.id);
  };

  const filteredList = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.usn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto animate-in fade-in pb-12">
      <h1 className="text-h1 font-display mb-2">Student History</h1>

      {/* Search Bar */}
      <div className="relative z-30">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search by Name or USN…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-11 bg-surface-inset shadow-card focus:shadow-focus transition-all h-12 rounded-xl"
          />
        </div>
      </div>

      {/* Student Directory Grid (Shown when no student selected) */}
      {!activeStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
          {filteredList.map((s) => (
            <button
              key={s.id}
              onClick={() => selectStudent(s)}
              className="group card p-5 text-left hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Users size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-h3 font-semibold text-fg-primary group-hover:text-primary transition-colors truncate">{s.name}</h3>
                <p className="text-caption font-mono text-fg-tertiary mt-0.5">{s.usn}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="px-2 py-0.5 bg-surface-inset border border-border-subtle rounded text-[10px] text-fg-secondary font-medium uppercase">{s.branch_code}</span>
                <span className="px-2 py-0.5 bg-surface-inset border border-border-subtle rounded text-[10px] text-fg-secondary font-medium">{s.batch}</span>
              </div>
            </button>
          ))}

          {filteredList.length === 0 && (
            <div className="col-span-full card py-20 flex flex-col items-center justify-center border-dashed opacity-50">
              <Search size={40} className="mb-4 text-fg-tertiary" />
              <p className="text-fg-secondary">No students match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Student Detail Panel */}
      {activeStudent && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 fade-in">
          
          <button 
            onClick={() => setActiveStudent(null)}
            className="flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium text-sm w-fit"
          >
            <Users size={16} />
            Back to All Students
          </button>

          {/* Profile Header */}
          <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
            <div>
              <p className="text-label text-fg-tertiary mb-1">STUDENT PROFILE</p>
              <h2 className="text-display-sm text-fg-primary leading-none mb-3">{activeStudent.name}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-inset border border-border-default rounded-md text-caption font-mono text-fg-secondary">{activeStudent.usn}</span>
                <span className="px-3 py-1 bg-surface-inset border border-border-default rounded-md text-caption text-fg-secondary">{activeStudent.branch_code}</span>
                <span className="px-3 py-1 bg-surface-inset border border-border-default rounded-md text-caption text-fg-secondary">{activeStudent.batch}</span>
                {activeStudent.email && (
                  <span className="px-3 py-1 bg-surface-inset border border-border-default rounded-md text-caption text-fg-secondary">{activeStudent.email}</span>
                )}
              </div>
            </div>
            {/* Big % badge */}
            <div className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-border-default bg-surface-inset shrink-0">
              <p className={`text-display-md tabular-nums font-bold leading-none ${pctColor(stats.pct)}`}>{stats.pct}%</p>
              <p className="text-caption text-fg-tertiary mt-1">Attendance</p>
            </div>
          </div>

          {/* Attendance Progress Bar */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-2">
              <p className="text-label text-fg-tertiary">OVERALL ATTENDANCE</p>
              <p className="text-body-sm text-fg-secondary">{stats.attended} of {stats.total} sessions</p>
            </div>
            <div className="w-full h-3 bg-surface-inset rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pctBg(stats.pct)}`}
                style={{ width: `${stats.pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-caption text-fg-tertiary">0%</span>
              <span className="text-caption text-fg-tertiary">75% threshold</span>
              <span className="text-caption text-fg-tertiary">100%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Percent}     label="Avg Attendance"   value={`${stats.pct}%`}   color={pctColor(stats.pct)} />
            <StatCard icon={Calendar}    label="Sessions Attended" value={stats.attended}    sub={`out of ${stats.total}`} />
            <StatCard icon={Flame}       label="Current Streak"   value={`${stats.streak}`} sub="consecutive sessions" />
            <StatCard icon={Award}       label="Best Streak"      value={`${stats.maxStreak}`} sub="sessions in a row" />
            <StatCard icon={Clock}       label="Hours Attended"   value={`${stats.hoursAttended}h`} sub={`of ${stats.totalHours}h total`} />
            <StatCard icon={BookOpen}    label="Total Sessions"   value={stats.total} />
            <StatCard icon={TrendingUp}  label="First Session"    value={formatDate(stats.firstSession)} />
            <StatCard icon={TrendingDown} label="Latest Session"  value={formatDate(stats.lastSession)} />
          </div>

          {/* Heatmap */}
          <div className="card">
            <p className="text-label text-fg-tertiary mb-4">ATTENDANCE HEATMAP (ALL SESSIONS)</p>
            {loading ? (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-md bg-surface-inset animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 content-start">
                {history.map((rec, idx) => (
                  <div
                    key={idx}
                    title={`${formatDate(rec.sessions.date)}: ${rec.sessions.topic} — ${rec.present ? 'Present' : 'Absent'}`}
                    className={`w-8 h-8 rounded-md transition-all hover:scale-125 cursor-help ${
                      rec.present
                        ? 'bg-success-bg border border-success-border'
                        : 'bg-danger-bg border border-danger-border'
                    }`}
                  />
                ))}
                {history.length === 0 && (
                  <p className="text-body text-fg-tertiary">No records yet.</p>
                )}
              </div>
            )}
            <div className="flex gap-6 mt-4 pt-4 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-caption text-fg-secondary">
                <div className="w-4 h-4 rounded-sm bg-success-bg border border-success-border" /> Present
              </div>
              <div className="flex items-center gap-2 text-caption text-fg-secondary">
                <div className="w-4 h-4 rounded-sm bg-danger-bg border border-danger-border" /> Absent
              </div>
            </div>
          </div>

          {/* Session Table */}
          <div className="card overflow-x-auto p-0 border border-border-subtle">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-36">Date</th>
                  <th>Topic</th>
                  <th className="w-28">Type</th>
                  <th className="w-24 text-right">Hours</th>
                  <th className="w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="5" className="text-center py-8 text-fg-tertiary">Loading…</td></tr>
                )}
                {!loading && history.map((h, i) => (
                  <tr key={i}>
                    <td className="font-mono text-fg-secondary">{formatDate(h.sessions.date)}</td>
                    <td className="font-medium">{h.sessions.topic}</td>
                    <td className="text-fg-tertiary capitalize">{h.sessions.session_type}</td>
                    <td className="text-right text-fg-secondary">{h.sessions.duration_hours}h</td>
                    <td className="text-center">
                      <span className={`pill ${h.present ? 'pill-success' : 'pill-danger'}`}>
                        {h.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && history.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 text-fg-tertiary">No records for this student.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
