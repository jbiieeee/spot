import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  ShieldAlert,
  Users,
  Building2,
  Briefcase,
  CalendarDays,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  History,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Smartphone,
  ScanFace,
  QrCode,
  X,
} from 'lucide-react';
import { useSpot } from '../context/SpotContext';
import { useAuth } from '../context/AuthContext';

const NAV_GROUPS = [
  {
    title: 'Field Operations',
    items: [
      { label: 'Command Dashboard',  path: '/',            icon: LayoutDashboard },
      { label: 'Live GPS Telemetry', path: '/tracking',    icon: Radio,      badge: 'LIVE', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
      { label: 'Patrol Operations',  path: '/routes',      icon: ShieldAlert },
      { label: 'Guards Roster',      path: '/guards',      icon: Users },
      { label: 'Face Recognition',   path: '/face-verify', icon: ScanFace },
    ],
  },
  {
    title: 'Sites & Assets',
    items: [
      { label: 'Deployment Sites',   path: '/sites',       icon: Building2 },
      { label: 'QR Checkpoints',     path: '/checkpoints', icon: QrCode },
      { label: 'Client Accounts',    path: '/clients',     icon: Briefcase },
      { label: 'Duty Schedules',     path: '/schedules',   icon: CalendarDays },
      { label: 'Guard Devices',      path: '/devices',     icon: Smartphone },
    ],
  },
  {
    title: 'Intelligence & Audit',
    items: [
      { label: 'Incident Center',    path: '/incidents',   icon: AlertTriangle },
      { label: 'Analytics Insights', path: '/analytics',   icon: BarChart3 },
      { label: 'Executive Reports',  path: '/reports',     icon: FileSpreadsheet },
      { label: 'Security Audit Logs',path: '/logs',        icon: History },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'System Settings',    path: '/settings',    icon: Settings },
      { label: 'Officer Profile',    path: '/profile',     icon: UserCheck },
    ],
  },
];

export default function Sidebar({ onMobileClose }) {
  const { sidebarCollapsed, toggleSidebar, stats, incidents, checkpoints } = useSpot();
  const { logout, profile } = useAuth();
  const location = useLocation();

  // Dynamic badges
  const getBadge = (path) => {
    if (path === '/tracking') return { text: 'LIVE', color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' };
    if (path === '/checkpoints' && checkpoints.length > 0) return { text: `${checkpoints.length}`, color: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' };
    if (path === '/incidents' && incidents.length > 0) return { text: `${incidents.length}`, color: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' };
    if (path === '/guards' && stats.activeGuards > 0) return { text: `${stats.activeGuards}`, color: 'bg-blue-500/15 text-blue-300 border border-blue-500/30' };
    return null;
  };

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 select-none"
      style={{
        width: sidebarCollapsed ? '5rem' : '17rem',
        background: 'linear-gradient(180deg, #0a1020 0%, #0e1626 50%, #090f1d 100%)',
        borderRight: '1px solid rgba(36, 51, 84, 0.7)',
      }}
    >
      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }} />

      {/* ── Brand Header ── */}
      <div className="flex h-16 md:h-20 items-center justify-between px-3 md:px-4"
        style={{ borderBottom: '1px solid rgba(36,51,84,0.7)' }}>
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo icon */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)',
              border: '1px solid rgba(99,102,241,0.4)',
              boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
            }}>
            <Shield className="h-5 w-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>

          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 50%, #93c5fd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                  S.P.O.T.
                </span>
                <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
                  CMD
                </span>
              </div>
              <span className="truncate text-[10px] font-medium text-slate-500">
                Security Patrol Operations
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Mobile close */}
          {onMobileClose && (
            <button onClick={onMobileClose}
              className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Collapse toggle (desktop) */}
          <button onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:text-white hover:scale-105"
            style={{ background: 'rgba(36,51,84,0.6)', border: '1px solid rgba(51,65,85,0.7)' }}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-0.5">
            {/* Group label */}
            {!sidebarCollapsed && (
              <div className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
                {group.title}
              </div>
            )}
            {sidebarCollapsed && groupIdx > 0 && (
              <div className="my-2 mx-auto w-8 h-px" style={{ background: 'rgba(36,51,84,0.8)' }} />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const badge = getBadge(item.path);
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  title={sidebarCollapsed ? item.label : undefined}
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200"
                  style={({ isActive: navActive }) => {
                    const active = navActive || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return {
                      background: active
                        ? 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(79,70,229,0.2) 100%)'
                        : 'transparent',
                      color: active ? '#fff' : '#64748b',
                      border: active
                        ? '1px solid rgba(99,102,241,0.35)'
                        : '1px solid transparent',
                      boxShadow: active ? '0 4px 15px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
                    };
                  }}
                >
                  {/* Active left accent bar */}
                  {isActive && (
                    <span className="absolute left-0 inset-y-2 w-0.5 rounded-full"
                      style={{ background: 'linear-gradient(180deg, #60a5fa, #818cf8)' }} />
                  )}

                  <Icon
                    className="h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110"
                    style={{ color: isActive ? '#93c5fd' : undefined }}
                  />

                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wider transition-all ${badge.color}`}>
                          {badge.text}
                        </span>
                      )}
                    </>
                  )}

                  {/* Collapsed badge dot */}
                  {sidebarCollapsed && badge && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500"
                      style={{ boxShadow: '0 0 6px rgba(244,63,94,0.8)' }} />
                  )}

                  {/* Hover tooltip (collapsed) */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 hidden group-hover:flex items-center whitespace-nowrap
                                    rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-2xl z-50 pointer-events-none"
                      style={{
                        background: 'rgba(13,21,40,0.97)',
                        border: '1px solid rgba(36,51,84,0.9)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      }}>
                      {item.label}
                      {badge && (
                        <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-black ${badge.color}`}>
                          {badge.text}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer / Profile ── */}
      <div className="p-2.5" style={{ borderTop: '1px solid rgba(36,51,84,0.7)' }}>
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between rounded-2xl p-2.5"
            style={{ background: 'rgba(8,14,26,0.8)', border: '1px solid rgba(36,51,84,0.8)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-white">
                  {profile?.name || 'Supervisor Admin'}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: '#34d399' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Command HQ
                </span>
              </div>
            </div>

            <button onClick={logout}
              className="rounded-xl p-2 text-slate-500 transition-all hover:bg-rose-500/15 hover:text-rose-400 hover:scale-105"
              title="Sign Out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout}
            className="flex h-10 w-full items-center justify-center rounded-xl text-slate-500
                       hover:bg-rose-500/15 hover:text-rose-400 transition-all"
            style={{ border: '1px solid rgba(36,51,84,0.8)' }}
            title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
