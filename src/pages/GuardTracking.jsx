import React, { useState } from 'react';
import Layout from '../components/Layout';
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
  Activity
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

  const activeGuard = guards.find((g) => g.id === selectedGuardId) || guards[0] || {
    id: '--', name: 'Waiting for telemetry', siteName: 'No active site', status: 'Offline',
    gpsLat: 14.5547, gpsLng: 121.0244, gpsAccuracy: 'Unknown', networkSignal: 'Offline',
    battery: 0, faceVerifiedAt: 'Pending', shift: 'Unassigned', stepCount: 0,
    distanceWalkedMeters: 0, photo: ''
  };
  const activePatrol = activeGuard ? patrols.find((p) => p.guardId === activeGuard.id) || patrols[0] : null;

  const mapCenter = activeGuard ? [activeGuard.gpsLat, activeGuard.gpsLng] : [14.5547, 121.0244];

  return (
    <Layout
      title="Live Telemetry Monitoring Console"
      subtitle="Uber-Driver Style Real-Time Patrol Stream, GPS Breadcrumb Trail & Diagnostics"
    >
      <div className="space-y-4">
        {/* Guard Selector Ribbon */}
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2">
          {guards.map((guard) => (
            <button
              key={guard.id}
              onClick={() => setSelectedGuardId(guard.id)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition shrink-0 ${
                guard.id === activeGuard?.id
                  ? 'border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-600/20'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <img src={guard.photo} alt={guard.name} className="h-7 w-7 rounded-full object-cover" />
              <div className="text-left">
                <div className="text-xs font-bold">{guard.name}</div>
                <div className="text-[10px] opacity-75">{guard.siteName}</div>
              </div>
              <span
                className={`ml-1 h-2 w-2 rounded-full ${
                  guard.status === 'On Patrol'
                    ? 'bg-emerald-400 animate-pulse'
                    : guard.status === 'Emergency'
                    ? 'bg-rose-400 animate-ping'
                    : 'bg-slate-500'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Uber-Driver Style 3-Column Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[620px]">
          {/* Left Timeline Panel (3 cols) */}
          <div className="lg:col-span-3 card-spot flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" /> Route Timeline
                </h3>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  {activePatrol?.completedCount || 0}/{activePatrol?.totalCount || 0} Done
                </span>
              </div>

              <div className="space-y-4">
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
                  <div className="text-xs text-slate-400 py-4">No route checkpoints logged.</div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
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
          <div className="lg:col-span-3 card-spot flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Guard Telematics</h3>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-blue-400 border border-slate-700">
                  {activeGuard.id}
                </span>
              </div>

              <div className="text-center pb-4 border-b border-slate-800">
                <img
                  src={activeGuard.photo}
                  alt={activeGuard.name}
                  className="h-20 w-20 rounded-2xl object-cover mx-auto border-2 border-blue-500/40 shadow-xl"
                />
                <h4 className="mt-3 text-base font-bold text-white">{activeGuard.name}</h4>
                <p className="text-xs text-slate-400">{activeGuard.siteName}</p>
                <div className="mt-2 flex justify-center gap-2">
                  <span className="badge-success text-[10px]">{activeGuard.status}</span>
                  <span className="badge-info text-[10px]">VERIFIED</span>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Battery className="h-4 w-4 text-emerald-400" /> Battery:
                  </span>
                  <span className="font-bold text-white">{activeGuard.battery}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-400" /> GPS Signal:
                  </span>
                  <span className="font-bold text-white">{activeGuard.gpsAccuracy}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Liveness:
                  </span>
                  <span className="font-bold text-emerald-400">PASSED ({activeGuard.faceVerifiedAt})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shift:</span>
                  <span className="font-semibold text-slate-200">{activeGuard.shift}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl border border-white/10 bg-slate-950/35 p-2"><div className="text-[10px] text-slate-500">Steps today</div><div className="mt-1 text-sm font-bold text-cyan-300">{Number(activeGuard.stepCount || 0).toLocaleString()}</div></div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/35 p-2"><div className="text-[10px] text-slate-500">Distance</div><div className="mt-1 text-sm font-bold text-emerald-300">{(Number(activeGuard.distanceWalkedMeters || 0) / 1000).toFixed(2)} km</div></div>
                </div>
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
