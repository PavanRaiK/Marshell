import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Users, Activity, BarChart2, CheckCircle2, Clock } from 'lucide-react';

function StatTicker({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 pr-6 border-r border-border-subtle last:border-0 whitespace-nowrap min-w-fit shrink-0">
      <div className="text-fg-secondary">
         <Icon size={20} strokeWidth={1.75} />
      </div>
      <div>
         <p className="text-caption text-fg-tertiary mb-0.5">{label}</p>
         <p className="text-body-lg font-semibold tabular-nums text-fg-primary">{value}</p>
      </div>
    </div>
  );
}

function TodaysSessionCard({ todayStr }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sessions').select('*').eq('date', todayStr).maybeSingle()
      .then(({ data }) => {
        setSession(data);
        setLoading(false);
      });
  }, [todayStr]);

  if (loading) return <div className="card animate-pulse h-40" />;

  return (
    <div className="card flex flex-col justify-between">
      <div>
        <p className="text-label text-fg-tertiary mb-2">TODAY'S SESSION</p>
        <h2 className="text-display-sm text-fg-primary tabular-nums">
           {session ? session.topic : 'No Session'}
        </h2>
        {session && (
          <p className="text-fg-secondary text-body mt-2 flex items-center gap-2">
            <span className="capitalize">{session.session_type}</span> • {session.duration_hours} Hrs
          </p>
        )}
      </div>
      <div className="mt-6">
        {!session ? (
          <Link to="/attendance" className="btn-primary inline-block">Create Session</Link>
        ) : (
          <p className="text-body-sm text-fg-tertiary">Session active for {todayStr}</p>
        )}
      </div>
    </div>
  );
}

function TodaysAttendanceCard({ todayStr }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sessions').select('id').eq('date', todayStr).maybeSingle().then(({ data: sess }) => {
      if (!sess) {
        setLoading(false);
        return;
      }
      supabase.from('attendance')
        .select('present, students(name)')
        .eq('session_id', sess.id)
        .then(({ data: att }) => {
           if (!att || att.length === 0) {
              setStats({ empty: true });
           } else {
              const present = att.filter(a => a.present).length;
              const absentUsers = att.filter(a => !a.present).map(a => a.students.name);
              setStats({ present, total: att.length, absentUsers, empty: false });
           }
           setLoading(false);
        });
    });
  }, [todayStr]);

  if (loading) return <div className="card animate-pulse h-40" />;

  if (!stats) {
    return (
      <div className="card">
        <p className="text-label text-fg-tertiary mb-2">TODAY'S ATTENDANCE</p>
        <p className="text-body text-fg-secondary">Session not created yet.</p>
      </div>
    );
  }

  if (stats.empty) {
    return (
      <div className="card">
        <p className="text-label text-fg-tertiary mb-2">TODAY'S ATTENDANCE</p>
        <p className="text-body text-fg-secondary mb-4">Not yet marked.</p>
        <Link to="/attendance" className="btn-secondary inline-block">Mark Attendance</Link>
      </div>
    );
  }

  const pct = Math.round((stats.present / stats.total) * 100) || 0;

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-label text-fg-tertiary mb-2">TODAY'S ATTENDANCE</p>
          <div className="flex items-end gap-3">
             <span className="text-display-md tabular-nums font-semibold">{pct}%</span>
             <span className="text-body-sm text-fg-secondary mb-2">{stats.present} / {stats.total} Present</span>
          </div>
        </div>
      </div>
      
      <div className="w-full h-1.5 bg-surface-inset rounded-full overflow-hidden mb-6">
        <div className={`h-full ${pct > 75 ? 'bg-success' : pct > 60 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${pct}%` }} />
      </div>

      {stats.absentUsers.length > 0 && (
         <div>
            <p className="text-micro text-fg-tertiary mb-2">ABSENT TODAY</p>
            <div className="flex flex-wrap gap-2">
               {stats.absentUsers.slice(0, 5).map(name => (
                  <span key={name} className="px-2 py-1 bg-danger-bg text-danger text-caption rounded-md border border-danger-border">{name}</span>
               ))}
               {stats.absentUsers.length > 5 && <span className="text-caption text-fg-secondary py-1">+{stats.absentUsers.length - 5} more</span>}
            </div>
         </div>
      )}
    </div>
  );
}

function ProgramOverviewCard() {
   const [ov, setOv] = useState({ total: 0, avg: 0, highest: '-', lowest: '-' });
   useEffect(() => {
     // A naive client-side aggregation for demo context, relying on full table fetch.
     // In production, this should map to a Postgres VIEW or RPC for performance.
     Promise.all([
        supabase.from('sessions').select('id', { count: 'exact' }),
        supabase.from('attendance').select('present, student_id, students(name)')
     ]).then(([{count: sessCount}, {data: att}]) => {
        if (!att || att.length === 0) return;
        const totalRows = att.length;
        const presentCount = att.filter(a=>a.present).length;
        const overallAvg = Math.round((presentCount / totalRows) * 100) || 0;
        
        let studentMap = {};
        att.forEach(r => {
           if (!studentMap[r.student_id]) studentMap[r.student_id] = { name: r.students.name, present: 0, total: 0 };
           studentMap[r.student_id].total++;
           if (r.present) studentMap[r.student_id].present++;
        });
        
        let arr = Object.values(studentMap).map(s => ({ name: s.name, pct: s.present/s.total }));
        arr.sort((a,b) => b.pct - a.pct);

        setOv({
           total: sessCount || 0,
           avg: overallAvg,
           highest: arr.length ? arr[0].name : '-',
           lowest: arr.length ? arr[arr.length-1].name : '-'
        });
     });
   }, []);

   return (
      <div className="card">
        <p className="text-label text-fg-tertiary mb-2">PROGRAM OVERVIEW</p>
        <div className="grid grid-cols-2 gap-y-6 mt-4">
           <div>
              <p className="text-caption text-fg-secondary">Total Sessions</p>
              <p className="text-h2 tabular-nums">{ov.total}</p>
           </div>
           <div>
              <p className="text-caption text-fg-secondary">Average Attendance</p>
              <p className="text-h2 tabular-nums">{ov.avg}%</p>
           </div>
           <div>
              <p className="text-caption text-fg-secondary">Highest Performer</p>
              <p className="text-body-lg text-success truncate">{ov.highest}</p>
           </div>
           <div>
              <p className="text-caption text-fg-secondary">Needs Attention</p>
              <p className="text-body-lg text-danger truncate">{ov.lowest}</p>
           </div>
        </div>
      </div>
   );
}

function RecentActivityCard() {
   const [feed, setFeed] = useState([]);
   useEffect(() => {
     // Fetch distinct sessions recently marked
     supabase.from('attendance').select('marked_at, sessions(topic)').order('marked_at', { ascending: false }).limit(50)
       .then(({data}) => {
          if (!data) return;
          // deduplicate by topic/timestamp proximity 
          const acts = [];
          const seen = new Set();
          for(const row of data) {
             const key = row.sessions?.topic;
             if (!key || seen.has(key)) continue;
             seen.add(key);
             acts.push({
                desc: `Attendance marked for ${key}`,
                ts: new Date(row.marked_at).getTime(),
                dateStr: new Date(row.marked_at).toLocaleDateString()
             });
             if (acts.length >= 5) break;
          }
          setFeed(acts);
       });
   }, []);

   return (
      <div className="card flex flex-col">
        <p className="text-label text-fg-tertiary mb-4">RECENT ACTIVITY</p>
        {feed.length === 0 ? <p className="text-body text-fg-secondary">No activity yet.</p> : (
           <div className="flex flex-col gap-4">
              {feed.map((i, idx) => (
                 <div key={idx} className="flex gap-3 items-start">
                    <div className="mt-1 text-fg-tertiary"><CheckCircle2 size={16} /></div>
                    <div>
                       <p className="text-body-sm text-fg-primary">{i.desc}</p>
                       <p className="text-caption text-fg-tertiary">{i.dateStr}</p>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>
   );
}

export default function Dashboard() {
  const [userName, setUserName] = useState('');
  const [metrics, setMetrics] = useState({ sessions: 0, attPct: 0, active: 0, lastDate: '-' });
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
       if (session) {
         supabase.from('users').select('display_name').eq('id', session.user.id).single()
           .then(({ data }) => { if (data) setUserName(data.display_name.split(' ')[0]); });
       }
    });

    // Strip Aggregates
    Promise.all([
       supabase.from('sessions').select('id, date').order('date', { ascending: false }),
       supabase.from('students').select('id', { count: 'exact' }).eq('is_active', true)
    ]).then(([{data: sessQuery}, {count: stuCount}]) => {
       setMetrics(m => ({
          ...m, 
          sessions: sessQuery ? sessQuery.length : 0,
          lastDate: sessQuery && sessQuery.length > 0 ? sessQuery[0].date : '-',
          active: stuCount || 0
       }));
    });
  }, []);

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
         <h1 className="text-display-hero tracking-tight font-display text-fg-primary">
            Welcome Back, {userName || 'Mentor'}
         </h1>
      </div>

      {/* Ticker Strip */}
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2 pt-2 border-y border-border-subtle items-center min-h-[72px]">
         <StatTicker label="TOTAL SESSIONS" value={metrics.sessions} icon={CalendarIcon} />
         <StatTicker label="ACTIVE STUDENTS" value={metrics.active} icon={Users} />
         <StatTicker label="LAST SESSION" value={metrics.lastDate} icon={Clock} />
         <StatTicker label="SYSTEM STATUS" value={"ONLINE"} icon={Activity} />
      </div>

      {/* Grid Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <TodaysSessionCard todayStr={todayStr} />
         <TodaysAttendanceCard todayStr={todayStr} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <ProgramOverviewCard />
         <RecentActivityCard />
      </div>
    </div>
  );
}
