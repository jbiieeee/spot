import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SpotProvider } from './context/SpotContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guards from './pages/Guards';
import Sites from './pages/Sites';
import Clients from './pages/Clients';
import PatrolOperations from './pages/Routes';
import Schedules from './pages/Schedules';
import AdminLogs from './pages/AdminLogs';
import Incidents from './pages/Incidents';
import GuardTracking from './pages/GuardTracking';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Devices from './pages/Devices';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <div className="flex items-center gap-3 text-sm font-semibold text-blue-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          Initializing S.P.O.T Command Telemetry...
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <SpotProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tracking" element={<GuardTracking />} />
        <Route path="/routes" element={<PatrolOperations />} />
        <Route path="/guards" element={<Guards />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/logs" element={<AdminLogs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </SpotProvider>
  );
}
