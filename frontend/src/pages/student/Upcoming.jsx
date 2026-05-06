import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock } from 'lucide-react';

export default function Upcoming() {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        const { data: upcoming } = await supabase
          .from('sessions')
          .select('*')
          .gt('date', todayStr)
          .order('date', { ascending: true })
          .limit(6);

        if (upcoming) setUpcomingSessions(upcoming);

        const { data: past } = await supabase
          .from('sessions')
          .select('*')
          .lte('date', todayStr)
          .order('date', { ascending: false })
          .limit(3);

        if (past) setPastSessions(past);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  if (loading) {
     return <div className="animate-pulse space-y-6">
        <div className="h-48 bg-surface-base rounded-2xl w-full" />
        <div className="h-64 bg-surface-base rounded-2xl w-full" />
     </div>;
  }

  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  const otherUpcoming = upcomingSessions.slice(1);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-12">
      <div>
         <h1 className="text-display-md tracking-tight font-display text-fg-primary mb-2">Upcoming Sessions</h1>
         <p className="text-body-lg text-fg-secondary">View your schedule and prepare for next classes.</p>
      </div>

      {nextSession ? (
         <div className="card border border-primary-500/30 shadow-[0_0_24px_-4px_rgba(var(--color-primary-500),0.15)]">
            <p className="text-label text-primary-400 mb-4 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
               NEXT SESSION
            </p>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <h2 className="text-display-sm text-fg-primary mb-2">{nextSession.topic}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-fg-secondary text-body-sm">
                     <span className="flex items-center gap-1.5"><Calendar size={16} /> {nextSession.date}</span>
                     <span className="flex items-center gap-1.5 capitalize"><Clock size={16} /> {nextSession.duration_hours} hrs • {nextSession.session_type}</span>
                  </div>
               </div>
            </div>
         </div>
      ) : (
         <div className="card text-center py-12 flex flex-col items-center">
            <Calendar size={48} className="text-fg-tertiary mb-4" strokeWidth={1} />
            <h3 className="text-h3 text-fg-primary mb-2">No upcoming sessions</h3>
            <p className="text-body text-fg-secondary">There are currently no future sessions scheduled.</p>
         </div>
      )}

      {otherUpcoming.length > 0 && (
         <div>
            <h3 className="text-h4 text-fg-primary mb-4 font-medium">Later This Month</h3>
            <div className="flex flex-col gap-3">
               {otherUpcoming.map((s, i) => (
                  <div key={i} className="card py-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div>
                        <p className="text-body-lg font-medium text-fg-primary">{s.topic}</p>
                        <p className="text-caption text-fg-tertiary capitalize">{s.duration_hours} hrs • {s.session_type}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-body font-medium text-fg-secondary">{s.date}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {pastSessions.length > 0 && (
         <div className="opacity-75">
            <h3 className="text-h4 text-fg-primary mb-4 font-medium">Recently Completed</h3>
            <div className="flex flex-col gap-3">
               {pastSessions.map((s, i) => (
                  <div key={i} className="bg-surface-inset rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border-subtle">
                     <div>
                        <p className="text-body font-medium text-fg-secondary">{s.topic}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-caption text-fg-tertiary">{s.date}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
