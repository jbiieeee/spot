import React, { useState } from 'react';
import Layout from '../components/Layout';
import GuardAvatar from '../components/GuardAvatar';
import { useSpot } from '../context/SpotContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  CheckCircle2,
  Clock,
  Battery,
  MapPin,
  ShieldCheck,
  Phone,
  AlertTriangle,
  Play,
  UserCheck,
  Zap,
  Activity,
  Search,
  Wifi,
  Gauge,
  Footprints,
  Navigation,
  Timer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const createLiveGuardMarker = (name) => {
  return L.divIcon({
    className: 'live-guard-pulse',
    html: `<div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 border-2 border-white text-white font-bold text-xs shadow-xl radar-ping">
            ${name.charAt(0)}
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
          </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

export default function GuardTracking() {
  const { guards, patrols, addToast, openGuardDrawer } = useSpot();
  const [selectedGuardId, setSelectedGuardId] = useState('G-101');
  const [guardSearch, setGuardSearch] = useState('');
  const [showGuardList, setShowGuardList] = useState(false);

  const activeGuard = guards.find((g) => g.id === selectedGuardId) || guards[0] || {
    id: '--', name: 'Waiting for telemetry', siteName: 'No active site', status: 'Offline',
    gpsLat: 14.5547, gpsLng: 121.0244, gpsAccuracy: 'Unknown', networkSignal: 'Offline',
    battery: 0, faceVerifiedAt: 'Pending', shift: 'Unassigned', stepCount: 0,
    distanceWalkedMeters: 0, photo: ''
  };
  const activePatrol = activeGuard ? patrols.find((p) => p.guardId === activeGuard.id) || patrols[0] : null;
  const filteredGuards = guards.filter((guard) => {
    const search = guardSearch.trim().toLowerCase();
    return !search || `${guard.name} ${guard.siteName} ${guard.id}`.toLowerCase().includes(search);
  });
  const patrolProgress = Math.min(100, Math.max(0, Number(activeGuard.progressPct || 0)));
  const batteryLevel = Math.min(100, Math.max(0, Number(activeGuard.battery || 0)));
  const statusTone = activeGuard.status === 'Emergency'
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    : activeGuard.status === 'On Patrol'
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : 'text-slate-300 bg-slate-500/10 border-slate-500/20';

  const mapCenter = activeGuard ? [activeGuard.gpsLat, activeGuard.gpsLng] : [14.5547, 121.0244];

  return (
    <Layout
      title="Live Telemetry Monitoring Console"
      subtitle="Uber-Driver Style Real-Time Patrol Stream, GPS Breadcrumb Trail & Diagnostics"
    >
      <div className="space-y-4">
        {/* Search-first guard rail, map, and live diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[620px]">
          {/* Guard Search and Route Timeline */}
          <div className="lg:col-span-3 card-spot flex min-h-[620px] flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Guard Monitor</h3>
                  <p className="mt-1 text-[10px] text-slate-500">Search to switch live feed</p>
                </div>
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-300">{guards.length} guards</span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3">
                <GuardAvatar photo={activeGuard.photo} name={activeGuard.name} size="h-10 w-10" />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-white">{activeGuard.name}</div><div className="truncate text-[10px] text-slate-400">{activeGuard.siteName}</div></div>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activeGuard.status === 'On Patrol' ? 'bg-emerald-400' : activeGuard.status === 'Emergency' ? 'bg-rose-400' : 'bg-slate-500'}`} />
              </div>

              <div className="mt-4 flex items-end justify-between gap-2">
                <label className="relative block min-w-0 flex-1"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Switch guard</span><Search className="pointer-events-none absolute left-3 top-[2.05rem] h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={guardSearch} onFocus={() => setShowGuardList(true)} onChange={(event) => { setGuardSearch(event.target.value); setShowGuardList(true); }} placeholder="Search name, site, or ID" aria-label="Search guards" className="input-spot pl-9 text-xs" /></label>
                <button type="button" onClick={() => setShowGuardList((current) => !current)} className="btn-secondary mb-0 h-[42px] shrink-0 px-2.5 text-[10px]" aria-expanded={showGuardList} title={showGuardList ? 'Hide guard list' : 'Show all guards'}>
                  {showGuardList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}<span className="hidden xl:inline">All guards</span>
                </button>
              </div>

              {showGuardList && <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-1.5 custom-scrollbar">
                <div className="flex items-center justify-between px-2 py-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{guardSearch ? 'Matching guards' : 'All guards'}</span><span className="text-[10px] text-slate-600">{filteredGuards.length} shown</span></div>
                {filteredGuards.length > 0 ? filteredGuards.map((guard) => <button key={guard.id} onClick={() => { setSelectedGuardId(guard.id); setGuardSearch(''); setShowGuardList(false); }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${guard.id === activeGuard?.id ? 'bg-blue-500/15 ring-1 ring-blue-500/30' : 'hover:bg-slate-800/80'}`}><GuardAvatar photo={guard.photo} name={guard.name} size="h-7 w-7" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white">{guard.name}</span><span className="block truncate text-[10px] text-slate-500">{guard.siteName} · {guard.id}</span></span><span className={`h-2 w-2 shrink-0 rounded-full ${guard.status === 'On Patrol' ? 'bg-emerald-400' : guard.status === 'Emergency' ? 'bg-rose-400' : 'bg-slate-500'}`} /></button>) : <p className="px-2 py-3 text-center text-[11px] text-slate-500">No guards match that search.</p>}
              </div>}

              <div className="mb-4 mt-6 flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" /> Route Timeline
                </h3>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  {activePatrol?.completedCount || 0}/{activePatrol?.totalCount || 0} Done
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {activePatrol?.checkpoints ? (
                  activePatrol.checkpoints.map((cp, idx) => (
                    <div key={cp.id} className="relative flex items-start gap-3 pl-1">
                      {/* Timeline connecting line */}
                      {idx !== activePatrol.checkpoints.length - 1 && (
                        <span className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-800" />
                      )}

                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 shrink-0 ${
                          cp.status === 'Completed'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : cp.status === 'Missed'
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{cp.name}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>{cp.scannedAt || 'Pending'}</span>
                          <span className="font-semibold text-blue-400">{cp.method}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                    <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 px-4 text-center"><Clock className="mb-2 h-5 w-5 text-slate-600" /><div className="text-xs font-semibold text-slate-400">No route checkpoints logged</div><div className="mt-1 text-[10px] text-slate-600">A patrol timeline will appear when this guard starts a route.</div></div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800">
              <button
                onClick={() => addToast('Patrol Sync', `Real-time synchronization refreshed for ${activeGuard.name}`, 'success')}
                className="btn-secondary w-full py-2 text-xs"
              >
                <Zap className="h-3.5 w-3.5 mr-1 text-amber-400" /> Force Telemetry Sync
              </button>
            </div>
          </div>

          {/* Center Dominant Leaflet Map (6 cols) */}
          <div className="lg:col-span-6 card-spot p-0 overflow-hidden relative flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#1E293B] px-4 py-3 z-10">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Live Tracking: {activeGuard.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">GPS Lock: {activeGuard.gpsAccuracy} · {activeGuard.networkSignal}</span>
            </div>

            <div className="flex-1 w-full h-full relative">
              <MapContainer
                center={mapCenter}
                zoom={15}
                scrollWheelZoom={false}
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <Marker position={mapCenter} icon={createLiveGuardMarker(activeGuard.name)}>
                  <Popup className="custom-popup">
                    <div className="p-1 text-xs">
                      <div className="font-bold text-white">{activeGuard.name}</div>
                      <div className="text-slate-400">{activeGuard.siteName}</div>
                      <div className="mt-1 text-emerald-400 font-semibold">{activeGuard.status}</div>
                    </div>
                  </Popup>
                </Marker>

                {/* Simulated breadcrumb path line */}
                <Polyline
                  positions={[
                    [activeGuard.gpsLat - 0.002, activeGuard.gpsLng - 0.002],
                    [activeGuard.gpsLat - 0.001, activeGuard.gpsLng - 0.001],
                    [activeGuard.gpsLat, activeGuard.gpsLng]
                  ]}
                  color="#2563EB"
                  weight={4}
                  dashArray="8, 8"
                />
              </MapContainer>
            </div>
          </div>

          {/* Right Guard Info Panel (3 cols) */}
          <div className="lg:col-span-3 card-spot flex min-h-[620px] flex-col justify-between">
            <div>
              <div className="mb-4 flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Guard Telematics</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"><Activity className="h-3 w-3 text-emerald-400" /> Live device diagnostics</div>
                </div>
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-blue-400">
                  {activeGuard.id}
                </span>
              </div>

              <div className="border-b border-slate-800 pb-4 text-center">
                <GuardAvatar photo={activeGuard.photo} name={activeGuard.name} size="h-20 w-20" rounded="rounded-2xl" />
                <h4 className="mt-3 text-base font-bold text-white">{activeGuard.name}</h4>
                <p className="text-xs text-slate-400">{activeGuard.siteName}</p>
                <div className="mt-2 flex justify-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusTone}`}>{activeGuard.status}</span>
                  <span className="badge-info text-[10px]">{activeGuard.faceVerified ? 'VERIFIED' : 'VERIFYING'}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400"><Battery className="h-4 w-4 text-emerald-400" /> Battery health</span>
                    <span className="font-bold text-white">{batteryLevel}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${batteryLevel < 25 ? 'bg-rose-400' : batteryLevel < 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${batteryLevel}%` }} /></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-slate-950/35 p-2.5"><div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Wifi className="h-3.5 w-3.5 text-blue-400" /> GPS signal</div><div className="mt-1 font-bold text-white">{activeGuard.gpsAccuracy}</div></div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/35 p-2.5"><div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Gauge className="h-3.5 w-3.5 text-cyan-400" /> Network</div><div className="mt-1 truncate font-bold text-white">{activeGuard.networkSignal}</div></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Liveness:
                  </span>
                  <span className="font-bold text-emerald-400">PASSED ({activeGuard.faceVerifiedAt})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400"><Timer className="h-4 w-4 text-amber-400" /> Shift</span>
                  <span className="font-semibold text-slate-200">{activeGuard.shift}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl border border-white/10 bg-slate-950/35 p-2"><div className="flex items-center gap-1 text-[10px] text-slate-500"><Footprints className="h-3 w-3" /> Steps today</div><div className="mt-1 text-sm font-bold text-cyan-300">{Number(activeGuard.stepCount || 0).toLocaleString()}</div></div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/35 p-2"><div className="flex items-center gap-1 text-[10px] text-slate-500"><Navigation className="h-3 w-3" /> Distance</div><div className="mt-1 text-sm font-bold text-emerald-300">{(Number(activeGuard.distanceWalkedMeters || 0) / 1000).toFixed(2)} km</div></div>
                </div>
                <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3"><div className="flex items-center justify-between text-[10px]"><span className="text-slate-400">Patrol progress</span><span className="font-bold text-blue-300">{patrolProgress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${patrolProgress}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>{activeGuard.completedCheckpoints || 0} checkpoints</span><span>{activeGuard.etaMinutes ? `${activeGuard.etaMinutes}m ETA` : 'ETA pending'}</span></div></div>
                <div className="text-[10px] text-slate-500">Last location update: {activeGuard.lastLocationUpdate?.toDate ? activeGuard.lastLocationUpdate.toDate().toLocaleTimeString() : activeGuard.lastLocationUpdate || 'Awaiting sync'}</div>
                <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-2 font-mono text-[10px] text-cyan-200">
                  Live coordinates: {Number(activeGuard.gpsLat).toFixed(6)}, {Number(activeGuard.gpsLng).toFixed(6)}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => openGuardDrawer(activeGuard)}
                className="btn-primary w-full py-2 text-xs"
              >
                Inspect Guard Drawer →
              </button>

              <button
                onClick={() => addToast('Emergency Alert', `Dispatch requested for guard ${activeGuard.name}`, 'danger')}
                className="btn-danger w-full py-2 text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Request Emergency Dispatch
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
