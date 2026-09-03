import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Users,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  WifiOff,
  Activity,
  BarChart3,
  TrendingUp,
  MapPin,
  QrCode,
  ShieldCheck,
  Building2,
  Maximize2,
  Layers,
  Radio
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Guard map marker
const createGuardMarker = (status, initial) => {
  let colorClass = 'bg-blue-600 border-blue-400';
  if (status === 'Emergency') colorClass = 'bg-rose-600 border-rose-400 emergency-flash';
  if (status === 'Idle') colorClass = 'bg-slate-600 border-slate-400';
  if (status === 'On Patrol') colorClass = 'bg-emerald-600 border-emerald-400';

  return L.divIcon({
    className: 'custom-guard-marker',
    html: `<div class="relative flex items-center justify-center h-9 w-9 rounded-full ${colorClass} text-white font-black text-xs border-2 shadow-lg shadow-black/60 cursor-pointer radar-ping">
            ${initial}
            <span class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border border-slate-900"></span>
          </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

export default function Dashboard() {
  const { stats, guards, sites, checkpoints, checkpointLogs, liveEvents, openGuardDrawer, addToast } = useSpot();
  const [timeFilter, setTimeFilter] = useState('Daily');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredGuards = guards.filter((g) => {
    if (statusFilter === 'PATROL') return g.status === 'On Patrol';
    if (statusFilter === 'IDLE') return g.status === 'Idle';
    if (statusFilter === 'OFFLINE') return g.status === 'Offline' || g.status === 'Off Duty';
    return true;
  });

  const topCards = [
    { title: 'Active Guards', count: stats.activeGuards, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: 'On Active Patrol', count: stats.currentlyOnPatrol, icon: ShieldAlert, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Deployment Sites', count: sites.length, icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { title: 'QR Checkpoints', count: checkpoints.length, icon: QrCode, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { title: "Today's Patrols", count: stats.todaysPatrols, icon: CalendarCheck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: 'Delayed Patrols', count: stats.delayedPatrols, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { title: 'Missed Patrols', count: stats.missedPatrols, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    { title: 'Incidents Today', count: stats.incidentsToday, icon: Activity, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
  ];

  const mapCenter = [14.5547, 121.0244];

  return (
    <Layout
      title="Security Operations Command Hub"
      subtitle="Real-time Guard Patrol Telemetry, GPS Sector Coordinates & Dynamic QR Checkpoint Validation"
    >
      <div className="space-y-6">
        {/* Top 8 Dynamic Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {topCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="card-spot flex flex-col justify-between p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 truncate">{card.title}</span>
                  <div className={`p-1.5 rounded-xl border ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-white tracking-tight">{card.count}</div>
              </div>
            );
          })}
        </div>

        {/* Center Live Map (~65% width) & Right Activity Feed (~35% width) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Live Operations Map */}
          <div className="lg:col-span-7 xl:col-span-8 card-spot p-0 overflow-hidden flex flex-col min-h-[540px] relative border border-slate-800">
            {/* Map Top Bar Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#131D31] px-5 py-3.5 z-10">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
                <span className="text-sm font-bold text-white tracking-wide">
                  Live Global Operations Radar
                </span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                  {filteredGuards.length} Active Guards
                </span>
              </div>

              {/* Status filter tabs for map */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
                {['ALL', 'PATROL', 'IDLE', 'OFFLINE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaflet Interactive Map */}
            <div className="flex-1 w-full h-full relative min-h-[470px]">
              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={false}
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Guard Markers on Map */}
                {filteredGuards.map((guard) => (
                  <Marker
                    key={guard.id}
                    position={[guard.gpsLat, guard.gpsLng]}
                    icon={createGuardMarker(guard.status, guard.name.charAt(0))}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1 min-w-[210px]">
                        <div className="flex items-center gap-2.5 border-b border-slate-700 pb-2 mb-2">
                          <img src={guard.photo} alt={guard.name} className="h-8 w-8 rounded-full object-cover border border-slate-600" />
                          <div>
                            <div className="font-bold text-white text-sm">{guard.name}</div>
                            <div className="text-[11px] text-slate-400">{guard.siteName}</div>
                          </div>
                        </div>
                        <div className="text-xs space-y-1.5 mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status:</span>
                            <span className="font-bold text-emerald-400">{guard.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Battery:</span>
                            <span className="font-semibold text-white">
                              {guard.battery != null ? `${guard.battery}%` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Face Verified:</span>
                            <span className="font-semibold text-blue-400">{guard.faceVerified ? 'Yes' : 'Pending'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => openGuardDrawer(guard)}
                          className="w-full btn-primary py-1.5 text-xs font-bold"
                        >
                          View Guard Telemetry →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Right Activity Feed */}
          <div className="lg:col-span-5 xl:col-span-4 card-spot flex flex-col min-h-[540px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Operations Stream</h3>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                REALTIME
              </span>
            </div>

            {/* Event List Stream */}
            <div className="custom-scrollbar flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
              {liveEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No live events recorded in database yet. Ready for fresh field events.
                </div>
              ) : (
                liveEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 transition group"
                  >
                    <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-blue-400">{ev.time}</span>
                        <span className="text-[10px] text-slate-500">Telemetry Event</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-200 font-semibold leading-relaxed">{ev.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Link to Sites & Checkpoints */}
            <div className="pt-3 border-t border-slate-800 mt-2 flex items-center justify-between text-xs">
              <Link to="/sites" className="text-blue-400 hover:underline font-bold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Manage Sites & QRs →
              </Link>
              <Link to="/incidents" className="text-rose-400 hover:underline font-bold">
                Incident Center →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Analytics Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patrol Completion Overview Bar */}
          <div className="card-spot">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" /> Patrol Route Compliance
              </h4>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                {['Daily', 'Weekly', 'Monthly'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(tf)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      timeFilter === tf ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Completed Patrol Sweeps</span>
                  <span className="font-bold text-emerald-400">92.4% Verified</span>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Delayed / Warning</span>
                  <span className="font-bold text-amber-400">5.2%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '5.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Missed / Critical Alert</span>
                  <span className="font-bold text-rose-400">2.4%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '2.4%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* QR Checkpoints & Verification Stats */}
          <div className="card-spot">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="h-4 w-4 text-cyan-400" /> Checkpoint Scan Telemetry
              </h4>
              <span className="text-xs text-cyan-400 font-mono font-bold">{checkpoints.length} QR Posts</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="text-xs text-slate-400">Deployed Sites</div>
                <div className="text-xl font-black text-white mt-1">{sites.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="text-xs text-slate-400">Scan Success Rate</div>
                <div className="text-xl font-black text-emerald-400 mt-1">99.8%</div>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Scans Streamed:</span>
              <span className="font-bold text-cyan-400 font-mono">{checkpointLogs.length} Verified</span>
            </div>
          </div>

          {/* Incident & Perimeter Health */}
          <div className="card-spot">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rose-400" /> Sector Health Index
              </h4>
              <span className="text-xs text-emerald-400 font-bold">100% Operational</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">Mobile Guard Telemetry</span>
                <span className="font-bold text-emerald-400">Active Stream</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">GPS Accuracy Tolerance</span>
                <span className="font-bold text-blue-400">&lt; 2.0 meters</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">QR Scanner Protocol</span>
                <span className="font-bold text-cyan-400">Android Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
