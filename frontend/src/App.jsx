import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import DevTokens from './pages/DevTokens';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import RoleGuard from './components/RoleGuard';
import MainLayout from './components/Layout/Main';

import Dashboard from './pages/mentor/Dashboard';
import MarkAttendance from './pages/mentor/MarkAttendance';
import StudentHistory from './pages/mentor/StudentHistory';
import Materials from './pages/mentor/Materials';

import MyAttendance from './pages/student/MyAttendance';
import Upcoming from './pages/student/Upcoming';
import StudentMaterials from './pages/student/StudentMaterials';

import { UploadCSV } from './pages/Stubs';

function RootRedirect() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setTarget('/login');
        return;
      }
      supabase.from('users').select('role').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data && data.role === 'mentor') setTarget('/dashboard');
          else if (data && data.role === 'student') setTarget('/me/attendance');
          else setTarget('/403');
        })
        .catch(() => setTarget('/login'));
    });
  }, []);

  if (!target) return <div className="app-main h-screen" />; // empty placeholder while mapping
  return <Navigate to={target} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/dev-tokens" element={<DevTokens />} />

        {/* Global Root Interceptor */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Guarded Structural Routes */}
        <Route element={<RoleGuard allowedRoles={['mentor', 'student']} />}>
           <Route element={<MainLayout />}>
              
              {/* Mentor specific routes */}
              <Route element={<RoleGuard allowedRoles={['mentor']} />}>
                 <Route path="dashboard" element={<Dashboard />} />
                 <Route path="attendance" element={<MarkAttendance />} />
                 <Route path="history" element={<StudentHistory />} />
                 <Route path="materials" element={<Materials />} />
                 <Route path="upload" element={<UploadCSV />} />
              </Route>

              {/* Student specific routes */}
              <Route element={<RoleGuard allowedRoles={['student']} />}>
                 <Route path="me/attendance" element={<MyAttendance />} />
                 <Route path="me/upcoming" element={<Upcoming />} />
                 <Route path="me/materials" element={<StudentMaterials />} />
              </Route>
           </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
