import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const formatClock = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (date) => date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

export default function Layout({ children, title, subtitle, actions }) {
  const { profile } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <header className="border-b border-cyan-100 bg-white px-4 py-5 shadow-[inset_0_-1px_0_rgba(14,116,144,0.06)] sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex gap-1.5">
                <span className="h-1 w-8 rounded bg-cyan-600" />
                <span className="h-1 w-3 rounded bg-emerald-500" />
                <span className="h-1 w-3 rounded bg-amber-400" />
              </div>
              <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="font-semibold text-slate-950">{formatClock(now)}</div>
                  <div className="text-slate-500">{formatDate(now)}</div>
                </div>
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 security-pulse" />
                    Live
                  </div>
                  <div className="text-slate-500">Realtime</div>
                </div>
                <div className="px-3 py-2">
                  <div className="truncate font-semibold text-slate-950">{profile?.name || 'Supervisor'}</div>
                  <div className="capitalize text-slate-500">{profile?.role || 'operator'}</div>
                </div>
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
