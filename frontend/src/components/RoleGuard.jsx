import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Helper component to show while checking auth
function Loader() {
  return (
    <div className="flex w-full h-screen items-center justify-center app-main">
      <p className="text-fg-secondary font-body">Authenticating...</p>
    </div>
  );
}

export default function RoleGuard({ allowedRoles }) {
  const [session, setSession] = useState(undefined);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and fetch public.users role
    const getSessionProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(session);

      // Fetch role mapped to this auth user
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (!error && data) {
        setUserRole(data.role);
      }
      setLoading(false);
    };

    getSessionProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        setSession(null);
        setUserRole(null);
        setLoading(false);
      } else {
        getSessionProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <Loader />;
  }

  // Not authenticated
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Role mapped but doesnt match array
  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/403" replace />;
  }

  // Auth passed, mapping valid. Proceed to nested route
  return <Outlet />;
}
