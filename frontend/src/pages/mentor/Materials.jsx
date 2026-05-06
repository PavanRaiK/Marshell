import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, FileText, Video, Link as LinkIcon, File, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const icons = {
  slides: FileText,
  recording: Video,
  document: File,
  link: LinkIcon
};

export default function Materials() {
  const [sessionsWithMats, setSessionsWithMats] = useState([]);
  const [filterMonth, setFilterMonth] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [mForm, setMForm] = useState({ session_id: '', title: '', type: 'slides', url: '', description: '' });

  useEffect(() => {
    fetchMaterials();
  }, [filterMonth]); // Reload if month filter technically triggers API swap, though client filtering is fine too.

  const fetchMaterials = () => {
    // Left Join essentially: get all materials nested by session.
    // Supabase allows backward querying: get sessions, nested materials.
    let query = supabase.from('sessions').select('id, date, topic, month_number, materials(*)').order('date', { ascending: false });
    if (filterMonth !== 'all') query = query.eq('month_number', parseInt(filterMonth));

    query.then(({ data }) => {
       if (data) {
          // Filters out sessions with no materials for this view
          const filtered = data.filter(s => s.materials && s.materials.length > 0);
          setSessionsWithMats(filtered);
       }
    });

    // Populate dropdown for modal (all active sessions)
    supabase.from('sessions').select('id, date, topic').order('date', { ascending: false })
      .then(({data}) => { if(data) setAvailableSessions(data); });
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!mForm.url.startsWith('http')) return alert('URL must start with http/https');
    
    // Insert material
    const { error } = await supabase.from('materials').insert([mForm]);
    if (!error) {
       setShowModal(false);
       setMForm({ session_id: availableSessions[0]?.id || '', title: '', type: 'slides', url: '', description: '' });
       fetchMaterials(); // rehydrate
    } else {
       alert("Error adding material: " + error.message);
    }
  };

  const clientFiltered = sessionsWithMats.filter(s => 
     s.topic.toLowerCase().includes(search.toLowerCase()) ||
     s.materials.some(m => m.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-12 w-full max-w-[1440px]">
       <div className="flex justify-between items-end flex-wrap gap-4">
          <h1 className="text-h1 font-display">Class Materials Library</h1>
          <div className="flex gap-4">
             <select className="input h-10 w-32 appearance-none text-body-sm" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}>
                <option value="all">All Months</option>
                <option value="4">Month 4</option>
                <option value="5">Month 5</option>
                <option value="6">Month 6</option>
             </select>
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                <input type="text" placeholder="Search topic or title..." value={search} onChange={e=>setSearch(e.target.value)} className="input h-10 pl-9 max-w-[200px] text-body-sm" />
             </div>
             <button onClick={()=>setShowModal(true)} className="btn-primary h-10 py-0 flex items-center gap-2 text-body-sm"><Plus size={16} /> Add Material</button>
          </div>
       </div>

       {/* Grid Rendering */}
       {clientFiltered.length === 0 ? (
          <div className="card flex items-center justify-center flex-col py-24 border-dashed bg-transparent shadow-none">
             <FileText size={48} className="text-fg-tertiary opacity-30 mb-4" />
             <p className="text-body text-fg-secondary">No materials found for these filters.</p>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {clientFiltered.map(sess => (
                <div key={sess.id} className="card p-6 flex flex-col hover:border-accent-glow transition-colors hover:shadow-focus group">
                   <p className="text-caption text-fg-tertiary mb-1 font-mono">{sess.date}</p>
                   <h3 className="text-h3 text-fg-primary mb-4 leading-snug tracking-tight">{sess.topic}</h3>
                   <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-border-subtle">
                      {sess.materials.map(m => {
                         const Icon = icons[m.type] || LinkIcon;
                         return (
                            <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 -mx-3 rounded-md hover:bg-surface-raised transition-colors group/link">
                               <div className="bg-surface-inset p-2 rounded-md ring-1 ring-border-default group-hover/link:ring-accent-glow group-hover/link:text-accent-glow text-fg-secondary transition-colors">
                                 <Icon size={16} />
                               </div>
                               <div>
                                  <p className="text-body-sm font-medium text-fg-primary group-hover/link:text-accent-glow transition-colors line-clamp-1">{m.title}</p>
                                  {m.description && <p className="text-caption text-fg-tertiary line-clamp-1 mt-0.5">{m.description}</p>}
                               </div>
                            </a>
                         );
                      })}
                   </div>
                </div>
             ))}
          </div>
       )}

       {/* Add Material Modal */}
       <Dialog open={showModal} onOpenChange={setShowModal}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Add Resource Material</DialogTitle>
             <DialogDescription>Attach external presentations, videos, and links directly to completed class sessions.</DialogDescription>
           </DialogHeader>
           <form onSubmit={handleAddMaterial} className="flex flex-col gap-5 mt-2">
                   <div>
                      <label className="block text-label text-fg-secondary mb-2">TARGET SESSION</label>
                      <select required className="input w-full" value={mForm.session_id} onChange={e=>setMForm({...mForm, session_id: e.target.value})}>
                         <option value="" disabled>Select a session...</option>
                         {availableSessions.map(s => <option key={s.id} value={s.id}>{s.date} — {s.topic}</option>)}
                      </select>
                   </div>
                   <div className="flex gap-4">
                      <div className="flex-1">
                         <label className="block text-label text-fg-secondary mb-2">MATERIAL TITLE</label>
                         <input required type="text" placeholder="E.g. PDF Slides" className="input w-full" value={mForm.title} onChange={e=>setMForm({...mForm, title: e.target.value})} />
                      </div>
                      <div className="w-1/3">
                         <label className="block text-label text-fg-secondary mb-2">TYPE</label>
                         <select className="input w-full" value={mForm.type} onChange={e=>setMForm({...mForm, type: e.target.value})}>
                            <option value="slides">Slides</option>
                            <option value="recording">Recording</option>
                            <option value="document">Document</option>
                            <option value="link">External Link</option>
                         </select>
                      </div>
                   </div>
                   <div>
                      <label className="block text-label text-fg-secondary mb-2">URL PATH</label>
                      <input required type="url" placeholder="https://" className="input w-full font-mono text-sm" value={mForm.url} onChange={e=>setMForm({...mForm, url: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-label text-fg-secondary mb-2">DESCRIPTION (OPTIONAL)</label>
                      <input type="text" placeholder="Short description..." className="input w-full" value={mForm.description} onChange={e=>setMForm({...mForm, description: e.target.value})} />
                   </div>
                   <DialogFooter>
                      <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" className="btn-primary" disabled={!mForm.session_id || !mForm.title || !mForm.url}>Attach Material</button>
                   </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>
    </div>
  );
}
