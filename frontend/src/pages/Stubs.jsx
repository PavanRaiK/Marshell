import React from 'react';

function BaseStub({ title }) {
  return (
    <div className="flex flex-col flex-1 h-full animate-in fade-in duration-500">
       <h1 className="text-display-md text-fg-primary mb-8 tracking-tight">{title}</h1>
       <div className="card flex items-center justify-center min-h-[400px]">
          <p className="text-body-lg text-fg-secondary">This page is pending Phase 3/5 Implementation.</p>
       </div>
    </div>
  );
}

export const Dashboard = () => <BaseStub title="Dashboard Overview" />;
export const MarkAttendance = () => <BaseStub title="Mark Attendance" />;
export const StudentHistory = () => <BaseStub title="Student History" />;
export const Materials = () => <BaseStub title="Class Materials" />;
export const UploadCSV = () => <BaseStub title="Upload CSV Data" />;

export const MyAttendance = () => <BaseStub title="My Attendance" />;
export const Upcoming = () => <BaseStub title="Upcoming Sessions" />;
export const StudentMaterials = () => <BaseStub title="Study Materials" />;
