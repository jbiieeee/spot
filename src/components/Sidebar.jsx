import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'D', accent: 'bg-cyan-400', meta: 'Overview' },
  { to: '/guards', label: 'Guards', icon: 'G', accent: 'bg-emerald-400', meta: 'Personnel' },
  { to: '/checkpoints', label: 'Checkpoints', icon: 'C', accent: 'bg-sky-400', meta: 'QR points' },
  { to: '/routes', label: 'Routes', icon: 'R', accent: 'bg-indigo-400', meta: 'Sequences' },
  { to: '/schedules', label: 'Schedules', icon: 'S', accent: 'bg-amber-400', meta: 'Shifts' },
  { to: '/logs', label: 'Patrol Logs', icon: 'L', accent: 'bg-teal-400', meta: 'Scans' },
  { to: '/incidents', label: 'Incidents', icon: 'I', accent: 'bg-rose-400', meta: 'Alerts' }
];

export default function Sidebar() {
  const { profile, logout } = useAuth();

  return (
    <aside className="flex shrink-0 flex-col border-b border-cyan-950/30 bg-slate-950 text-white md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-xs font-semibold text-slate-950">SP</div>
          <div>
            <div className="text-lg font-semibold text-white">S.P.O.T.</div>
            <div className="mt-0.5 text-xs text-slate-400">Security Patrol Operations & Tracking</div>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 security-pulse" />
          Live System
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:block md:flex-1 md:space-y-1 md:overflow-visible md:py-2">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `group flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-cyan-900/30 hover:text-white'
              }`
            }
          >
            <span className={`h-2 w-2 rounded-sm ${n.accent}`} />
            <span className="grid h-6 w-6 place-items-center rounded border border-current/20 bg-white/5 text-[10px] font-semibold">{n.icon}</span>
            <span className="min-w-0">
              <span className="block truncate">{n.label}</span>
              <span className="hidden text-[10px] font-normal text-slate-500 group-hover:text-cyan-100 md:block">{n.meta}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase text-cyan-100">
            <span>System Load</span>
            <span>Nominal</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-white/10">
            <div className="h-full w-2/3 rounded bg-cyan-300" />
          </div>
        </div>
        <div className="text-sm font-medium text-white">{profile?.name || 'Supervisor'}</div>
        <div className="mb-3 text-xs capitalize text-slate-400">{profile?.role || 'supervisor'}</div>
        <button
          onClick={logout}
          className="w-full rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
