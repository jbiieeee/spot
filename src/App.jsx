import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guards from './pages/Guards';
import Checkpoints from './pages/Checkpoints';
import RoutesPage from './pages/Routes';
import Schedules from './pages/Schedules';
import PatrolLogs from './pages/PatrolLogs';
import Incidents from './pages/Incidents';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-sm text-cyan-200">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-200" />
          Initializing secure session...
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/guards" element={<Guards />} />
      <Route path="/checkpoints" element={<Checkpoints />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/schedules" element={<Schedules />} />
      <Route path="/logs" element={<PatrolLogs />} />
      <Route path="/incidents" element={<Incidents />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
