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
  Layers
} from 'lucide-react';
import { useSpot } from '../context/SpotContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, stats, incidents, checkpoints } = useSpot();
  const { logout, profile } = useAuth();
  const location = useLocation();

  const navGroups = [
    {
      title: 'Field Operations',
      items: [
        { label: 'Command Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Live GPS Telemetry', path: '/tracking', icon: Radio, badge: 'LIVE', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
        { label: 'Patrol Operations', path: '/routes', icon: ShieldAlert, count: stats.todaysPatrols },
        { label: 'Guards Roster', path: '/guards', icon: Users, count: stats.activeGuards },
        { label: 'Face Recognition', path: '/face-verify', icon: ScanFace },
      ]
    },
    {
      title: 'Sites & Assets',
      items: [
        { label: 'Deployment Sites', path: '/sites', icon: Building2 },
        { label: 'QR Checkpoints', path: '/checkpoints', icon: QrCode, badge: checkpoints.length > 0 ? `${checkpoints.length} QRs` : null, badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
        { label: 'Client Accounts', path: '/clients', icon: Briefcase },
        { label: 'Duty Schedules', path: '/schedules', icon: CalendarDays },
        { label: 'Guard Devices', path: '/devices', icon: Smartphone },
      ]
    },
    {
      title: 'Intelligence & Audit',
      items: [
        { label: 'Incident Center', path: '/incidents', icon: AlertTriangle, badge: incidents.length > 0 ? `${incidents.length}` : null, badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
        { label: 'Analytics Insights', path: '/analytics', icon: BarChart3 },
        { label: 'Executive Reports', path: '/reports', icon: FileSpreadsheet },
        { label: 'Security Audit Logs', path: '/logs', icon: History },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'System Settings', path: '/settings', icon: Settings },
        { label: 'Officer Profile', path: '/profile', icon: UserCheck }
      ]
    }
  ];

  return (
    <aside
      className={`relative z-40 flex flex-col border-r border-slate-800/80 bg-[#0E1626] text-slate-300 transition-all duration-300 select-none ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-4 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-lg shadow-blue-600/30 border border-blue-400/30">
            <Shield className="h-6 w-6 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>

          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                  S.P.O.T.
                </span>
                <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                  COMMAND
                </span>
              </div>
              <span className="truncate text-[11px] font-medium text-slate-400">
                Security Patrol Operations
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List by Group */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group.title}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
                    }`
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />

                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate tracking-tight">{item.label}</span>
                  )}

                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                        item.badgeColor || 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {!sidebarCollapsed && !item.badge && item.count !== undefined && item.count > 0 && (
                    <span className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700/60">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer / Supervisor Profile */}
      <div className="border-t border-slate-800/80 p-3 bg-slate-900/40">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-xs border border-blue-400/40 shadow-md">
                {profile?.name ? profile.name.charAt(0) : 'S'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-white">
                  {profile?.name || 'Supervisor Admin'}
                </span>
                <span className="truncate text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Command HQ
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-400"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
