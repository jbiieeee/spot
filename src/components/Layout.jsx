import React, { useEffect, useState } from 'react';
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
  Radio,
  Shield,
  AlertTriangle,
  X,
  QrCode,
  Activity,
  CheckCircle2,
  UserCheck,
  Smartphone,
  CheckCheck,
  ChevronRight
} from 'lucide-react';

const formatClock = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const formatDate = (date) => date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export default function Layout({ children, title, subtitle, actions }) {
  const {
    setGlobalSearchOpen,
    dbConnected,
    incidents,
    checkpointLogs,
    attendance,
    liveEvents,
    checkpoints
  } = useSpot();

  const { profile } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => new Set());
  const [notifFilter, setNotifFilter] = useState('ALL'); // 'ALL' | 'INCIDENT' | 'SCAN' | 'LOGIN'
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute real-time live notifications from active synced Firestore feeds
  const realNotifications = [
    ...incidents.map((inc) => ({
      id: `inc-${inc.id}`,
      type: 'INCIDENT',
      priority: inc.priority || 'High',
      title: `${inc.priority || 'Priority'} Incident: ${inc.title}`,
      description: `${inc.siteName || 'Facility'} • Reported by: ${inc.reporterName}`,
      time: inc.timestamp,
      link: '/incidents'
    })),
    ...attendance.slice(0, 6).map((att) => ({
      id: `att-${att.id}`,
      type: 'LOGIN',
      priority: 'Info',
      title: `Guard Check-in: ${att.guardName}`,
      description: `${att.siteName || 'Site'} • ${att.faceVerified ? 'Face Biometric Verified' : 'Clocked In'}`,
      time: att.timeIn || 'Recently',
      link: '/guards'
    })),
    ...checkpointLogs.slice(0, 8).map((scan) => ({
      id: `scan-${scan.id}`,
      type: 'SCAN',
      priority: 'Verified',
      title: `QR Verified: ${scan.checkpointName}`,
      description: `Patrol post scan logged by ${scan.guardName}`,
      time: scan.timestamp,
      link: '/checkpoints'
    })),
    ...liveEvents.slice(0, 4).map((ev) => ({
      id: `ev-${ev.id}`,
      type: 'TELEMETRY',
      priority: 'Notice',
      title: 'Sector Telemetry Alert',
      description: ev.text,
      time: ev.time,
      link: '/tracking'
    }))
  ];

  // Filtered notifications
  const filteredNotifications = realNotifications.filter((n) => {
    if (notifFilter === 'ALL') return true;
    return n.type === notifFilter;
  });

  // Dynamically calculate unread count in real-time
  const unreadCount = realNotifications.filter((n) => !readNotifIds.has(n.id)).length;

  const handleMarkAllRead = () => {
    setReadNotifIds(new Set(realNotifications.map((n) => n.id)));
  };

  const handleNotificationClick = (notif) => {
    setReadNotifIds((prev) => new Set([...prev, notif.id]));
    setNotificationsOpen(false);
    if (notif.link) navigate(notif.link);
  };

  // Compute breadcrumb trail label based on current route
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Command Center / Operational Overview';
    if (path === '/tracking') return 'Command Center / Live GPS Tracking';
    if (path === '/routes') return 'Command Center / Patrol Operations';
    if (path === '/guards') return 'Command Center / Guards Directory';
    if (path === '/face-verify') return 'Command Center / Face Biometric Enrollment';
    if (path === '/sites') return 'Command Center / Deployment Sites';
    if (path === '/checkpoints') return 'Command Center / QR Checkpoints & Posts';
    if (path === '/clients') return 'Command Center / Client Accounts';
    if (path === '/schedules') return 'Command Center / Duty Schedules';
    if (path === '/incidents') return 'Command Center / Incident Center';
    if (path === '/analytics') return 'Command Center / Operational Analytics';
    if (path === '/reports') return 'Command Center / Executive Reports';
    if (path === '/logs') return 'Command Center / Security Audit Logs';
    if (path === '/settings') return 'Command Center / System Settings';
    if (path === '/profile') return 'Command Center / Officer Profile';
    if (path === '/devices') return 'Command Center / Mobile Device Assets';
    return 'Command Center';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B1120] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Body */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Navigation */}
        <header className="relative z-30 flex h-20 shrink-0 items-center justify-between border-b border-slate-800/80 bg-[#0E1626]/80 px-6 backdrop-blur-xl">
          {/* Left: Breadcrumbs & Page Titles */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span>{getBreadcrumb()}</span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden md:block text-[11px] text-slate-400 -mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Center: Global Search Input Button */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs text-slate-400 hover:border-slate-500 hover:bg-slate-800 transition shadow-inner"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-blue-400" />
                <span>Search guard, site, QR checkpoint, incident...</span>
              </div>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-700">
                Ctrl + K
              </span>
            </button>
          </div>

          {/* Right: Live Ticker, Real-Time Notifications & User Profile */}
          <div className="flex items-center gap-3.5">
            {/* Live Clock & Telemetry Status */}
            <div className="hidden lg:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-white leading-none">{formatClock(now)}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{formatDate(now)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-bold text-emerald-400 text-[11px] tracking-wide">
                  {dbConnected ? 'HQ SYNCED' : 'ONLINE'}
                </span>
              </div>
            </div>

            {/* Real-time Dynamic Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-slate-300 hover:border-slate-500 hover:bg-slate-700 hover:text-white transition"
                title="Live Operations Alert Center"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-96 rounded-2xl border border-slate-700/80 bg-[#131D31] p-4 shadow-2xl shadow-slate-950 z-50 backdrop-blur-xl">
                  {/* Notification Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-blue-400" /> Live Feed
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.2 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                          {unreadCount} Unread
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          title="Mark all notifications as read"
                        >
                          <CheckCheck className="h-3 w-3" /> Mark read
                        </button>
                      )}
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 pt-2.5 pb-2 overflow-x-auto no-scrollbar">
                    {['ALL', 'INCIDENT', 'SCAN', 'LOGIN'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setNotifFilter(tab)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition shrink-0 ${
                          notifFilter === tab
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab === 'ALL' ? `All (${realNotifications.length})` : tab}
                      </button>
                    ))}
                  </div>

                  {/* Real Notification Cards Stream */}
                  <div className="mt-2 space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
                    {filteredNotifications.map((notif) => {
                      const isRead = readNotifIds.has(notif.id);
                      let iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                      let IconComponent = Shield;

                      if (notif.type === 'INCIDENT') {
                        iconColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                        IconComponent = AlertTriangle;
                      } else if (notif.type === 'SCAN') {
                        iconColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
                        IconComponent = QrCode;
                      } else if (notif.type === 'LOGIN') {
                        iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                        IconComponent = UserCheck;
                      }

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer group ${
                            isRead
                              ? 'border-slate-800/60 bg-slate-900/40 text-slate-400 hover:bg-slate-800/40'
                              : 'border-slate-700 bg-slate-900/90 text-slate-100 hover:border-blue-500/50 hover:bg-slate-800/80 shadow-md'
                          }`}
                        >
                          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${iconColor}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-bold truncate ${isRead ? 'text-slate-300' : 'text-white'}`}>
                                {notif.title}
                              </span>
                              {!isRead && (
                                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-2">
                              {notif.description}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
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
                      <div className="py-8 text-center text-xs text-slate-500">
                        No notifications in this category.
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer Link */}
                  <div className="mt-3 border-t border-slate-800 pt-2.5 flex items-center justify-between text-xs">
                    <Link
                      to="/incidents"
                      onClick={() => setNotificationsOpen(false)}
                      className="font-bold text-blue-400 hover:underline"
                    >
                      Incident Center →
                    </Link>
                    <Link
                      to="/logs"
                      onClick={() => setNotificationsOpen(false)}
                      className="font-bold text-slate-400 hover:text-white"
                    >
                      Audit Trail →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Quick Info */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 pr-3 hover:border-blue-500/50 transition"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md border border-blue-400/30">
                {profile?.name ? profile.name.charAt(0) : 'S'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  {profile?.name || 'Supervisor'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Command Officer</span>
              </div>
            </Link>

            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Page Content Scroll View */}
        <main className="custom-scrollbar flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global Overlays */}
      <GlobalSearchModal />
      <GuardDetailDrawer />
      <ToastContainer />
    </div>
  );
}
