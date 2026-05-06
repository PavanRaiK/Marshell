import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export default function MarkAttendance() {
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState(null); // null means no session yet, loading means checking
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Creation Wizard variables
  const [newTopic, setNewTopic] = useState('');
  const [newDuration, setNewDuration] = useState('2.0');
  const [newType, setNewType] = useState('offline');

  // Attendance Checklist
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: boolean }
  const [initialAttendance, setInitialAttendance] = useState({}); // for diff detection
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState('');

  const minDate = '2025-08-04';
  const maxDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Check if session exists for selected date
    setIsCheckingSession(true);
    setSession(null);
    setAttendance({});
    setInitialAttendance({});
    
    supabase.from('sessions').select('*').eq('date', dateStr).maybeSingle()
      .then(({ data: sess }) => {
         if (sess) {
            setSession(sess);
            // Fetch students and existing attendance
            Promise.all([
               supabase.from('students').select('*').eq('is_active', true).order('name'),
               supabase.from('attendance').select('*').eq('session_id', sess.id)
            ]).then(([{ data: stuData }, { data: attData }]) => {
               if (stuData) setStudents(stuData);
               
               const attMap = {};
               if (attData) {
                 attData.forEach(r => attMap[r.student_id] = r.present);
               } else if (stuData) {
                 // default un-saved state is false
                 stuData.forEach(s => attMap[s.id] = false);
               }
               setAttendance(attMap);
               // copy object to track overrides
               setInitialAttendance({...attMap});
            });
         } else {
            // No session. Fetch students just to be ready.
            supabase.from('students').select('*').eq('is_active', true).order('name')
               .then(({ data }) => { if(data) setStudents(data); });
         }
         setIsCheckingSession(false);
      });
  }, [dateStr]);

  const handleCreateSession = async () => {
    if (!newTopic) return;
    setIsCheckingSession(true); // Loading lock
    const payload = {
       date: dateStr,
       topic: newTopic,
       month_number: new Date(dateStr).getMonth() + 1, // rough estimate
       duration_hours: parseFloat(newDuration),
       session_type: newType
    };
    
    const { data, error } = await supabase.from('sessions').insert([payload]).select().single();
    if (!error && data) {
       setSession(data);
       const initMap = {};
       students.forEach(s => initMap[s.id] = false);
       setAttendance(initMap);
       setInitialAttendance(initMap);
    }
    setIsCheckingSession(false);
  };

  const hasModifications = Object.keys(attendance).some(k => attendance[k] !== initialAttendance[k]);
  const isUpdatingExisting = Object.keys(initialAttendance).length > 0 && Object.keys(initialAttendance).some(k => initialAttendance[k] === true || initialAttendance[k] === false); // if initial had entries. Wait, if it's purely new, initial might only consist of default false or be empty. Let's explicitly check if db had rows.

  const executeSave = async () => {
    setIsSaving(true);
    setShowConfirmModal(false);

    const payload = Object.entries(attendance).map(([student_id, present]) => ({
      student_id: parseInt(student_id),
      session_id: session.id,
      present,
      marked_by: 'system_mentor' // normally fetch display_name from context
    }));

    // Upsert conflicts on (student_id, session_id) automatically if configured correctly in Schema UNIQUE constraint
    // In Supabase js, upsert accepts an array. We specify onConflict explicitly.
    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'student_id,session_id' });
    
    setIsSaving(false);
    if (!error) {
       setToast(`Marked ${payload.filter(p=>p.present).length} present, ${payload.filter(p=>!p.present).length} absent.`);
       setInitialAttendance({...attendance});
       setTimeout(() => setToast(''), 4000);
    } else {
       alert("Error saving: " + error.message);
    }
  };

  const triggerSave = () => {
    // Spec mandates confirmation if updating existing
    // We determine 'existing' if there was actually attendance records pulled in useEffect (keys existed that were true/false from DB)
    // To cleanly detect this: if initialAttendance has values AND we consider them pristine db values:
    const previouslySavedCount = Object.values(initialAttendance).filter(v => v === true).length;
    if (previouslySavedCount > 0 && hasModifications) {
       setShowConfirmModal(true);
    } else {
       executeSave();
    }
  };

  const toggleAll = (present) => {
    const newMap = {};
    students.forEach(s => newMap[s.id] = present);
    setAttendance(newMap);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl pb-24 relative animate-in fade-in">
      <h1 className="text-h1 font-display">Mark Attendance</h1>

      {/* Date Context */}
      <div className="flex gap-4 items-end">
        <div>
           <label className="block text-label text-fg-secondary mb-2">SESSION DATE</label>
           <input 
             type="date" 
             className="input tabular-nums font-mono w-48"
             min={minDate}
             max={maxDate}
             value={dateStr}
             onChange={(e) => setDateStr(e.target.value)}
           />
        </div>
      </div>

      {isCheckingSession ? <div className="card h-12 animate-pulse mt-4" /> : (
         !session ? (
            <div className="card mt-4 border-l-4 border-l-warning-fg pl-6 rounded-l-none">
               <h3 className="text-h3 text-fg-primary mb-2">No Session Found</h3>
               <p className="text-body-sm text-fg-secondary mb-6">There is no session recorded for this date. Create one below to begin marking attendance.</p>
               <div className="flex gap-4 flex-wrap">
                  <input type="text" placeholder="Topic (e.g. RAG Pattern)" value={newTopic} onChange={e=>setNewTopic(e.target.value)} className="input flex-1 min-w-[200px]" />
                  <input type="number" step="0.5" value={newDuration} onChange={e=>setNewDuration(e.target.value)} className="input w-32" title="Duration (hours)" />
                  <select value={newType} onChange={e=>setNewType(e.target.value)} className="input w-36 appearance-none">
                     <option value="offline">Offline</option>
                     <option value="online">Online</option>
                  </select>
                  <button onClick={handleCreateSession} className="btn-primary" disabled={!newTopic}>Establish Session</button>
               </div>
            </div>
         ) : (
            <>
               <div className="flex justify-between items-center bg-surface-inset border border-border-default rounded-xl px-6 py-4 mt-2">
                 <div>
                    <h3 className="text-h3 text-fg-primary">{session.topic}</h3>
                    <p className="text-caption text-fg-tertiary capitalize">{session.duration_hours}h • {session.session_type}</p>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={()=>toggleAll(true)} className="btn-secondary py-1.5 text-xs h-auto"><Check size={14} className="inline mr-1" /> All Present</button>
                   <button onClick={()=>toggleAll(false)} className="btn-secondary py-1.5 text-xs h-auto"><X size={14} className="inline mr-1" /> All Absent</button>
                 </div>
               </div>

               <div className="card p-0 overflow-hidden border border-border-subtle mt-4">
                 {students.map(s => {
                    const isPresent = attendance[s.id] || false;
                    return (
                       <label key={s.id} className="flex items-center justify-between px-6 py-4 border-b border-border-subtle last:border-0 hover:bg-surface-raised cursor-pointer transition-colors">
                          <div className="flex items-center gap-4">
                             <input 
                               type="checkbox" 
                               checked={isPresent}
                               onChange={() => setAttendance(a => ({...a, [s.id]: !isPresent}))}
                               className="w-5 h-5 accent-accent-glow cursor-pointer rounded-sm bg-surface-inset border-border-strong"
                             />
                             <div>
                               <p className="text-body font-medium text-fg-primary">{s.name}</p>
                               <p className="text-caption font-mono text-fg-tertiary mt-0.5">{s.usn}</p>
                             </div>
                          </div>
                          <span className={`pill ${isPresent ? 'pill-success' : 'pill-danger'}`}>
                             {isPresent ? 'Present' : 'Absent'}
                          </span>
                       </label>
                    );
                 })}
               </div>

               {/* Sticky floating save bar */}
               <div className="fixed bottom-8 left-1/2 -translate-x-1/2 ml-[130px] z-20 flex bg-surface-raised border border-border-strong p-4 rounded-2xl shadow-raised items-center gap-6">
                  <div className="text-body-sm text-fg-secondary">
                     <span className="text-fg-primary font-semibold tabular-nums">{Object.values(attendance).filter(v=>v).length}</span> Present,{' '}
                     <span className="text-fg-primary font-semibold tabular-nums">{Object.values(attendance).filter(v=>!v).length}</span> Absent
                  </div>
                  <button onClick={triggerSave} disabled={!hasModifications || isSaving} className="btn-primary w-32 disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Update'}
                  </button>
               </div>
            </>
         )
      )}

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-warning-bg text-warning p-3 rounded-full outline outline-1 outline-warning-border">
                  <AlertTriangle size={24} />
                </div>
                <div className="text-left">
                  <DialogTitle>Update Existing Attendance?</DialogTitle>
                  <DialogDescription className="mt-1">
                    You are modifying a session that already has confirmed attendance records attached. Overwriting this will change historical records for affected students. Proceed?
                  </DialogDescription>
                </div>
             </div>
          </DialogHeader>
          <DialogFooter>
            <button onClick={()=>setShowConfirmModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={executeSave} className="btn-primary bg-danger text-white border-none hover:bg-danger/80">Overwrite Data</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 right-8 z-50 bg-surface-raised border border-border-strong shadow-raised px-5 py-4 rounded-lg flex gap-3 items-center w-80 animate-in slide-in-from-right">
           <CheckCircle2 className="text-success" size={20} />
           <div>
              <p className="text-body font-semibold text-fg-primary">Success</p>
              <p className="text-caption text-fg-secondary">{toast}</p>
           </div>
        </div>
      )}
    </div>
  );
}
