import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearchModal from './GlobalSearchModal';
import GuardDetailDrawer from './GuardDetailDrawer';
import ToastContainer from './ToastContainer';
import { useSpot } from '../context/SpotContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Bell,
  Clock,
  Shield,
  AlertTriangle,
  X,
  QrCode,
  Activity,
  CheckCircle2,
  UserCheck,
  CheckCheck,
  ChevronRight,
  Menu,
} from 'lucide-react';

const formatClock = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const formatDate = (date) =>
  date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

export default function Layout({ children, title, subtitle, actions }) {
  const {
    setGlobalSearchOpen,
    dbConnected,
    incidents,
    checkpointLogs,
    attendance,
    liveEvents,
    checkpoints,
    sidebarCollapsed,
    toggleSidebar,
    syncProgress,
  } = useSpot();

  const { profile } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const readNotificationsKey = `spot-read-notifications-${profile?.uid || profile?.email || 'guest'}`;
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(readNotificationsKey) || '[]'));
    } catch {
      return new Set();
    }
  });
  const [notifFilter, setNotifFilter] = useState('ALL');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const shellRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Close notifications on outside click
  useEffect(() => {
    if (!notificationsOpen) return;
    const handler = (e) => {
      if (!e.target.closest('[data-notif-panel]')) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationsOpen]);

  useEffect(() => {
    localStorage.setItem(readNotificationsKey, JSON.stringify([...readNotifIds]));
  }, [readNotifIds, readNotificationsKey]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frameId;
    const updatePointerField = (event) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        shell.style.setProperty('--pointer-x', `${(event.clientX / window.innerWidth) * 100}%`);
        shell.style.setProperty('--pointer-y', `${(event.clientY / window.innerHeight) * 100}%`);
      });
    };
    const resetPointerField = () => {
      shell.style.setProperty('--pointer-x', '50%');
      shell.style.setProperty('--pointer-y', '35%');
    };

    window.addEventListener('pointermove', updatePointerField, { passive: true });
    window.addEventListener('pointerleave', resetPointerField);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', updatePointerField);
      window.removeEventListener('pointerleave', resetPointerField);
    };
  }, []);

  const realNotifications = [
    ...incidents.map((inc) => ({
      id: `inc-${inc.id}`,
      type: 'INCIDENT',
      priority: inc.priority || 'High',
      title: `${inc.priority || 'Priority'} Incident: ${inc.title}`,
      description: `${inc.siteName || 'Facility'} • Reported by: ${inc.reporterName}`,
      time: inc.timestamp,
      link: '/incidents',
    })),
    ...attendance.slice(0, 6).map((att) => ({
      id: `att-${att.id}`,
      type: 'LOGIN',
      priority: 'Info',
      title: `Guard Check-in: ${att.guardName}`,
      description: `${att.siteName || 'Site'} • ${att.faceVerified ? 'Face Biometric Verified' : 'Clocked In'}`,
      time: att.timeIn || 'Recently',
      link: '/guards',
    })),
    ...checkpointLogs.slice(0, 8).map((scan) => ({
      id: `scan-${scan.id}`,
      type: 'SCAN',
      priority: 'Verified',
      title: `QR Verified: ${scan.checkpointName}`,
      description: `Patrol post scan logged by ${scan.guardName}`,
      time: scan.timestamp,
      link: '/checkpoints',
    })),
    ...liveEvents.slice(0, 4).map((ev) => ({
      id: `ev-${ev.id}`,
      type: 'TELEMETRY',
      priority: 'Notice',
      title: 'Sector Telemetry Alert',
      description: ev.text,
      time: ev.time,
      link: '/tracking',
    })),
  ];

  const filteredNotifications = realNotifications.filter((n) => {
    if (notifFilter === 'ALL') return true;
    return n.type === notifFilter;
  });

  const unreadCount = realNotifications.filter((n) => !readNotifIds.has(n.id)).length;

  const handleMarkAllRead = () =>
    setReadNotifIds(new Set(realNotifications.map((n) => n.id)));

  const handleNotificationClick = (notif) => {
    setReadNotifIds((prev) => new Set([...prev, notif.id]));
    setNotificationsOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    const map = {
      '/': 'Command Center / Operational Overview',
      '/tracking': 'Command Center / Live GPS Tracking',
      '/routes': 'Command Center / Patrol Operations',
      '/guards': 'Command Center / Guards Directory',
      '/face-verify': 'Command Center / Face Biometric Enrollment',
      '/sites': 'Command Center / Deployment Sites',
      '/checkpoints': 'Command Center / QR Checkpoints & Posts',
      '/clients': 'Command Center / Client Accounts',
      '/schedules': 'Command Center / Duty Schedules',
      '/incidents': 'Command Center / Incident Center',
      '/analytics': 'Command Center / Operational Analytics',
      '/reports': 'Command Center / Executive Reports',
      '/logs': 'Command Center / Security Audit Logs',
      '/settings': 'Command Center / System Settings',
      '/profile': 'Command Center / Officer Profile',
      '/devices': 'Command Center / Mobile Device Assets',
    };
    return map[path] || 'Command Center';
  };

  const notifTypeConfig = {
    INCIDENT: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', Icon: AlertTriangle },
    SCAN: { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', Icon: QrCode },
    LOGIN: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', Icon: UserCheck },
    TELEMETRY: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', Icon: Activity },
  };

  return (
    <div ref={shellRef} className="command-shell relative flex h-screen w-screen overflow-hidden text-slate-100 select-none"
      style={{ background: 'var(--color-bg-base)' }}>

      {/* ── Mobile sidebar backdrop ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Desktop sidebar (always) + mobile slide-in ── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:flex
          transition-transform duration-300
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar onMobileClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* ── Main content body ── */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">

        {/* ── Top Header ── */}
        <header
          className="relative z-30 flex h-16 md:h-20 shrink-0 items-center justify-between px-4 md:px-6 backdrop-blur-xl"
          style={{
            background: 'rgba(14, 22, 38, 0.85)',
            borderBottom: '1px solid rgba(36, 51, 84, 0.7)',
          }}
        >
          {syncProgress < 100 && (
            <div className="sync-progress absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-slate-800/80" aria-label={`Synchronizing ${syncProgress}%`}>
              <div className="sync-progress-fill h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-[width] duration-500" style={{ width: `${syncProgress}%` }} />
            </div>
          )}
          {/* Left: Hamburger (mobile) + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="btn-icon md:hidden flex-shrink-0"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{getBreadcrumb()}</span>
              </div>
              <h1 className="text-base md:text-xl font-extrabold text-white tracking-tight truncate flex items-center gap-2">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden lg:block text-[11px] text-slate-500 -mt-0.5 truncate max-w-sm">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Center: Global Search */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-4 lg:mx-8">
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-2 text-xs text-slate-400
                         transition-all duration-200 hover:border-blue-500/50"
              style={{
                background: 'rgba(8,14,26,0.8)',
                border: '1px solid rgba(36,51,84,0.9)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-blue-400" />
                <span className="hidden lg:inline">Search guard, site, checkpoint, incident...</span>
                <span className="lg:hidden">Search...</span>
              </div>
              <span className="hidden lg:flex rounded-md px-2 py-0.5 font-mono text-[10px] text-slate-400"
                style={{ background: 'rgba(36,51,84,0.8)', border: '1px solid rgba(51,65,85,0.9)' }}>
                Ctrl+K
              </span>
            </button>
          </div>

          {/* Right: Clock, Notifications, Profile */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Live Clock — hidden on small screens */}
            <div className="hidden lg:flex items-center gap-3 rounded-xl px-3.5 py-1.5 text-xs"
              style={{ background: 'rgba(8,14,26,0.8)', border: '1px solid rgba(36,51,84,0.9)' }}>
              <div className="flex items-center gap-2 border-r pr-3" style={{ borderColor: 'rgba(36,51,84,0.9)' }}>
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-white leading-none">{formatClock(now)}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-medium">{formatDate(now)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className={`font-bold text-[11px] tracking-wide ${syncProgress < 100 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                  {syncProgress < 100 ? `SYNCING ${syncProgress}%` : (dbConnected ? 'HQ SYNCED' : 'ONLINE')}
                </span>
              </div>
            </div>

            {/* Mobile search button */}
            <button className="btn-icon md:hidden" onClick={() => setGlobalSearchOpen(true)} aria-label="Search">
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <div className="relative" data-notif-panel>
              <button
                onClick={() => setNotificationsOpen((p) => !p)}
                className="btn-icon"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center
                                   rounded-full text-[10px] font-black text-white ring-2 animate-pulse"
                    style={{ background: '#f43f5e', ringColor: 'var(--color-bg-base)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl z-50 animate-fade-up"
                  style={{
                    background: 'rgba(13, 21, 40, 0.97)',
                    border: '1px solid rgba(36,51,84,0.9)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                  }}>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b pb-3"
                    style={{ borderColor: 'rgba(36,51,84,0.8)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-blue-400" /> Live Feed
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}>
                          {unreadCount} Unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead}
                          className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" /> Mark read
                        </button>
                      )}
                      <button onClick={() => setNotificationsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter pills */}
                  <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar">
                    {['ALL', 'INCIDENT', 'SCAN', 'LOGIN'].map((tab) => (
                      <button key={tab} onClick={() => setNotifFilter(tab)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition shrink-0"
                        style={{
                          background: notifFilter === tab ? '#2563eb' : 'rgba(36,51,84,0.8)',
                          color: notifFilter === tab ? '#fff' : '#64748b',
                        }}>
                        {tab === 'ALL' ? `All (${realNotifications.length})` : tab}
                      </button>
                    ))}
                  </div>

                  {/* Notification list */}
                  <div className="mt-1 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {filteredNotifications.map((notif) => {
                      const isRead = readNotifIds.has(notif.id);
                      const { color, Icon: NIcon } = notifTypeConfig[notif.type] || notifTypeConfig.TELEMETRY;
                      return (
                        <div key={notif.id} onClick={() => handleNotificationClick(notif)}
                          className="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group"
                          style={{
                            background: isRead ? 'rgba(8,14,26,0.5)' : 'rgba(19,29,49,0.9)',
                            borderColor: isRead ? 'rgba(36,51,84,0.5)' : 'rgba(51,65,85,0.8)',
                          }}>
                          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${color}`}>
                            <NIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-bold truncate ${isRead ? 'text-slate-400' : 'text-white'}`}>
                                {notif.title}
                              </span>
                              {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{notif.description}</p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                              <span>{notif.time}</span>
                              <span className="text-blue-400 font-sans font-semibold group-hover:underline flex items-center">
                                View <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredNotifications.length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-600">
                        No notifications in this category.
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-2.5 flex items-center justify-between text-xs"
                    style={{ borderTop: '1px solid rgba(36,51,84,0.8)' }}>
                    <Link to="/incidents" onClick={() => setNotificationsOpen(false)}
                      className="font-bold text-blue-400 hover:underline">
                      Incident Center →
                    </Link>
                    <Link to="/logs" onClick={() => setNotificationsOpen(false)}
                      className="font-bold text-slate-500 hover:text-white transition-colors">
                      Audit Trail →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile avatar */}
            <Link to="/profile"
              className="flex items-center gap-2.5 rounded-xl p-1.5 pr-3 transition-all hover:border-blue-500/40"
              style={{ background: 'rgba(8,14,26,0.8)', border: '1px solid rgba(36,51,84,0.9)' }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  border: '1px solid rgba(99,102,241,0.4)',
                }}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  {profile?.name || 'Supervisor'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Command Officer</span>
              </div>
            </Link>

            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div key={location.pathname} className="page-transition">
            {children}
          </div>
        </main>
      </div>

      {/* Global Overlays */}
      <GlobalSearchModal />
      <GuardDetailDrawer />
      <ToastContainer />
    </div>
  );
}
