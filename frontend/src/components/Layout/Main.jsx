import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function MainLayout() {
  return (
    <div className="flex h-screen w-full app-main overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto w-full max-w-[1440px] mx-auto p-6 md:p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
