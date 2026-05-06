import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function MyAttendance() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, attended: 0, pct: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch user mapping to get student_id
        const { data: user } = await supabase.from('users').select('student_id').eq('id', session.user.id).single();
        
        if (user?.student_id) {
          // Fetch student details
          const { data: student } = await supabase.from('students').select('*').eq('id', user.student_id).single();
          if (student) setStudentInfo(student);

          // Fetch attendance records joined with sessions
          const { data: records } = await supabase
            .from('attendance')
            .select('present, sessions(*)')
            .eq('student_id', user.student_id)
            .order('sessions(date)', { ascending: false });

          if (records) {
             const formattedRecords = records
                .filter(r => r.sessions !== null)
                .sort((a, b) => new Date(b.sessions.date) - new Date(a.sessions.date));
                
             setAttendanceRecords(formattedRecords);
             
             const total = formattedRecords.length;
             const attended = formattedRecords.filter(r => r.present).length;
             setStats({
                total,
                attended,
                pct: total === 0 ? 0 : Math.round((attended / total) * 100)
             });
          }
        }
      } catch (error) {
        console.error("Error fetching student attendance:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
     return <div className="animate-pulse space-y-6">
        <div className="h-32 bg-surface-base rounded-2xl w-full" />
        <div className="h-48 bg-surface-base rounded-2xl w-full" />
     </div>;
  }

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
         <h1 className="text-display-lg tracking-tight font-display text-fg-primary">
            {studentInfo?.name || 'Student Portal'}
         </h1>
         {studentInfo && (
            <p className="text-body-sm text-fg-tertiary">
               {studentInfo.usn} • {studentInfo.branch_code} • {studentInfo.batch}
            </p>
         )}
      </div>

      <div className="card text-center py-12 flex flex-col items-center justify-center">
         <p className="text-label text-fg-tertiary mb-6">OVERALL ATTENDANCE</p>
         <h2 className={`text-display-hero font-bold tracking-tighter ${stats.pct >= 75 ? 'text-success' : stats.pct >= 60 ? 'text-warning' : 'text-danger'}`}>
            {stats.pct}%
         </h2>
         <p className="text-body-lg text-fg-secondary mt-4">
            {stats.attended} of {stats.total} sessions attended
         </p>
      </div>

      <div className="card flex flex-col gap-6">
         <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-fg-tertiary" />
            <h3 className="text-h3 text-fg-primary font-medium">Session History</h3>
         </div>
         
         {attendanceRecords.length === 0 ? (
            <p className="text-body text-fg-secondary">No attendance records found.</p>
         ) : (
            <div className="w-full overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-border-subtle text-caption text-fg-tertiary">
                        <th className="pb-3 px-4 font-normal">Date</th>
                        <th className="pb-3 px-4 font-normal">Topic</th>
                        <th className="pb-3 px-4 font-normal">Duration</th>
                        <th className="pb-3 px-4 font-normal">Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     {attendanceRecords.map((r, i) => (
                        <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-surface-elevated transition-colors">
                           <td className="py-4 px-4 text-body text-fg-secondary whitespace-nowrap">
                              {r.sessions.date}
                           </td>
                           <td className="py-4 px-4 text-body-lg font-medium text-fg-primary max-w-sm truncate">
                              {r.sessions.topic}
                           </td>
                           <td className="py-4 px-4 text-body text-fg-secondary whitespace-nowrap">
                              {r.sessions.duration_hours} hrs
                           </td>
                           <td className="py-4 px-4">
                              {r.present ? (
                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-bg text-success text-caption font-medium border border-success-border">
                                    <CheckCircle2 size={14} /> Present
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-bg text-danger text-caption font-medium border border-danger-border">
                                    <XCircle size={14} /> Absent
                                 </span>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}
