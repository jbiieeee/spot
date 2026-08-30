import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio, CheckCircle2, Clock, Battery, MapPin, ShieldCheck,
  AlertTriangle, Zap, Activity, Wifi, WifiOff, Footprints
} from 'lucide-react';

const createLiveGuardMarker = (name, isLive) => {
  const color = isLive ? '#10b981' : '#2563EB';
  return L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,0.5);position:relative;">
      ${name.charAt(0)}
      <span style="position:absolute;top:-3px;right:-3px;width:12px;height:12px;border-radius:50%;background:${isLive ? '#34d399' : '#64748b'};border:2px solid #0f172a;"></span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

function formatLastSeen(date) {
  if (!date) return 'No live data';
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GuardTracking() {
  const { guards, patrols, guardLocations, addToast, openGuardDrawer } = useSpot();
  const [selectedGuardId, setSelectedGuardId] = useState(null);

  if (!guards || guards.length === 0) {
    return (
      <Layout title="Live Telemetry Monitoring Console" subtitle="Real-Time Android GPS Stream, Patrol Progress & Guard Diagnostics">
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Activity className="h-10 w-10 opacity-30" />
          <p className="text-sm">No guards found in the database.</p>
        </div>
      </Layout>
    );
  }

  const activeGuardId = selectedGuardId || guards[0]?.id;
  const activeGuard = guards.find((g) => g.id === activeGuardId) || guards[0];
  const activePatrol = patrols.find((p) => p.guardId === activeGuard?.id);

  // Prefer live Android GPS from guardLocations collection; fall back to users doc
  const liveLocation = (guardLocations || {})[activeGuard?.id] || null;
  const isLive = Boolean(liveLocation && liveLocation.lat != null && liveLocation.lng != null);

  const displayLat = isLive ? liveLocation.lat : (activeGuard?.gpsLat ?? 14.5547);
  const displayLng = isLive ? liveLocation.lng : (activeGuard?.gpsLng ?? 121.0244);
  const displayAccuracy = isLive
    ? `${liveLocation.accuracy?.toFixed(1) ?? '—'}m`
    : (activeGuard?.gpsAccuracy ?? '—');
  const displayBattery = isLive
    ? (liveLocation.battery ?? activeGuard?.battery)
    : activeGuard?.battery;
  const displayActivity = isLive ? liveLocation.activityType : null;
  const displayNetwork = isLive ? liveLocation.networkType : null;
  const displayLastSeen = isLive
    ? formatLastSeen(liveLocation.timestamp)
    : 'No Android data yet';

  const mapCenter = [displayLat, displayLng];

  return (
    <Layout
      title="Live Telemetry Monitoring Console"
      subtitle="Real-Time Android GPS Stream, Patrol Progress & Guard Diagnostics"
    >
      <div className="space-y-4">

        {/* Guard Selector Ribbon */}
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2">
          {guards.map((guard) => {
            const hasLive = (guardLocations || {})[guard.id]?.lat != null;
            return (
              <button
                key={guard.id}
                onClick={() => setSelectedGuardId(guard.id)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition shrink-0 ${
                  guard.id === activeGuard.id
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
                  title={hasLive ? 'Live Android GPS' : 'No live data'}
                  className={`ml-1 h-2 w-2 rounded-full ${
                    hasLive
                      ? 'bg-emerald-400 animate-pulse'
                      : guard.status === 'Emergency'
                      ? 'bg-rose-400 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Live/Offline status banner */}
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-xs ${
          isLive
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/5 text-amber-400'
        }`}>
          {isLive ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
          <span>
            {isLive
              ? `Live Android GPS active — last update: ${displayLastSeen} · Accuracy: ${displayAccuracy}`
              : `No live Android GPS for ${activeGuard?.name}. Showing last known position from profile. Guard may be offline or patrol not yet started.`}
          </span>
        </div>

        {/* 3-Column Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[620px]">

          {/* Left: Route Timeline (3 cols) */}
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
                      {idx !== activePatrol.checkpoints.length - 1 && (
                        <span className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-800" />
                      )}
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 shrink-0 ${
                        cp.status === 'Completed'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : cp.status === 'Missed'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {cp.status === 'Completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{cp.name}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>{cp.scannedAt || 'Pending'}</span>
                          {cp.method && <span className="font-semibold text-blue-400">QR</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    <Activity className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    No active patrol checkpoints.
                  </div>
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

          {/* Center: Live Map (6 cols) */}
          <div className="lg:col-span-6 card-spot p-0 overflow-hidden relative flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#1E293B] px-4 py-3 z-10">
              <div className="flex items-center gap-2">
                <Radio className={`h-4 w-4 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-xs font-bold text-white">Live Tracking: {activeGuard.name}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-slate-400">
                  {displayLat.toFixed(6)}, {displayLng.toFixed(6)}
                </span>
                <span className={isLive ? 'text-emerald-400' : 'text-amber-400'}>
                  {isLive ? `GPS Lock: ${displayAccuracy}` : 'Static position'}
                </span>
              </div>
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
                <Marker position={mapCenter} icon={createLiveGuardMarker(activeGuard.name, isLive)}>
                  <Popup className="custom-popup">
                    <div className="p-1 text-xs space-y-1">
                      <div className="font-bold text-white">{activeGuard.name}</div>
                      <div className="text-slate-400">{activeGuard.siteName}</div>
                      <div className={`font-semibold ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {activeGuard.status}
                      </div>
                      {isLive && (
                        <>
                          <div className="text-slate-400">Accuracy: {displayAccuracy}</div>
                          <div className="text-slate-400">Updated: {displayLastSeen}</div>
                          {displayActivity && <div className="text-slate-400 capitalize">Activity: {displayActivity}</div>}
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Right: Telematics Panel (3 cols) */}
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
                <div className="mt-2 flex justify-center gap-2 flex-wrap">
                  <span className={`text-[10px] rounded-full px-2.5 py-0.5 font-bold uppercase border ${
                    activeGuard.status === 'On Patrol'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : activeGuard.status === 'Emergency'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>{activeGuard.status}</span>
                  {isLive && (
                    <span className="text-[10px] rounded-full px-2.5 py-0.5 font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Battery className="h-4 w-4 text-emerald-400" /> Battery:
                  </span>
                  <span className={`font-bold ${
                    displayBattery <= 20 ? 'text-rose-400' :
                    displayBattery <= 40 ? 'text-amber-400' : 'text-white'
                  }`}>
                    {displayBattery != null ? `${displayBattery}%` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-400" /> GPS Accuracy:
                  </span>
                  <span className="font-bold text-white">{displayAccuracy}</span>
                </div>

                {displayActivity && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Footprints className="h-4 w-4 text-violet-400" /> Activity:
                    </span>
                    <span className="font-bold text-violet-300 capitalize">{displayActivity}</span>
                  </div>
                )}

                {displayNetwork && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Wifi className="h-4 w-4 text-cyan-400" /> Network:
                    </span>
                    <span className="font-bold text-cyan-300 capitalize">{displayNetwork}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Face ID:
                  </span>
                  <span className="font-bold text-emerald-400 text-right">
                    {activeGuard.faceVerified ? `PASSED (${activeGuard.faceVerifiedAt})` : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shift:</span>
                  <span className="font-semibold text-slate-200 text-right">{activeGuard.shift}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Update:</span>
                  <span className={`font-semibold ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {displayLastSeen}
                  </span>
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
