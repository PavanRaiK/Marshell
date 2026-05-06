import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Video, Link as LinkIcon, File } from 'lucide-react';

const TYPE_ICONS = {
  slides: FileText,
  recording: Video,
  document: File,
  link: LinkIcon
};

export default function StudentMaterials() {
  const [sessionsWithMaterials, setSessionsWithMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        // Fetch sessions and inner join materials
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*, materials(*)')
          .order('date', { ascending: false });

        if (sessions) {
          const filtered = sessions.filter(s => s.materials && s.materials.length > 0);
          setSessionsWithMaterials(filtered);
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
  }, []);

  if (loading) {
     return <div className="animate-pulse space-y-6">
        <div className="h-24 bg-surface-base rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="h-48 bg-surface-base rounded-2xl w-full" />
           <div className="h-48 bg-surface-base rounded-2xl w-full" />
        </div>
     </div>;
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-12">
      <div>
         <h1 className="text-display-md tracking-tight font-display text-fg-primary mb-2">Study Materials</h1>
         <p className="text-body-lg text-fg-secondary">Access slides, recordings, and reading materials from all sessions.</p>
      </div>

      {sessionsWithMaterials.length === 0 ? (
         <div className="card text-center py-16 flex flex-col items-center">
            <FileText size={48} className="text-fg-tertiary mb-4" strokeWidth={1} />
            <h3 className="text-h3 text-fg-primary mb-2">No materials available</h3>
            <p className="text-body text-fg-secondary">Materials will appear here once mentors upload them.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sessionsWithMaterials.map((session) => (
               <div key={session.id} className="card flex flex-col h-full">
                  <div className="mb-6">
                     <p className="text-caption text-fg-tertiary mb-1">{session.date}</p>
                     <h3 className="text-h4 text-fg-primary">{session.topic}</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-auto">
                     {session.materials.map((mat) => {
                        const Icon = TYPE_ICONS[mat.type] || File;
                        return (
                           <a 
                              key={mat.id}
                              href={mat.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col gap-1 p-3 rounded-xl bg-surface-inset hover:bg-surface-elevated border border-border-subtle hover:border-primary-500/30 transition-all"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="text-fg-tertiary group-hover:text-primary-400 transition-colors">
                                    <Icon size={18} />
                                 </div>
                                 <p className="text-body-sm font-medium text-fg-primary group-hover:text-primary-300 truncate">
                                    {mat.title}
                                 </p>
                              </div>
                              {mat.description && (
                                 <p className="text-caption text-fg-secondary pl-7 line-clamp-2">
                                    {mat.description}
                                 </p>
                              )}
                           </a>
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
}
