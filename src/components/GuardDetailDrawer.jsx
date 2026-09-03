import React, { useState } from 'react';
import {
  X, Battery, MapPin, ShieldCheck, Phone, AlertTriangle, Activity,
  Calendar, Award, CheckCircle, Smartphone, Link as LinkIcon, Unlink, Zap
} from 'lucide-react';
import { useSpot } from '../context/SpotContext';
import GuardAvatar from './GuardAvatar';

export default function GuardDetailDrawer() {
  const {
    isGuardDrawerOpen,
    closeGuardDrawer,
    selectedGuard,
    devices,
    guardLocations,
    assignDeviceToGuard,
    unassignDevice,
    addToast
  } = useSpot();

  const [selectedDeviceToBind, setSelectedDeviceToBind] = useState('');

  if (!isGuardDrawerOpen || !selectedGuard) return null;

  const boundDeviceObj = devices.find((d) => d.deviceId === selectedGuard.deviceId);
  const unassignedDevices = devices.filter((d) => !d.deviceId || d.deviceId === selectedGuard.deviceId || !devices.some(other => other.deviceId === d.deviceId && other.id !== d.id));

  const liveLoc = (guardLocations || {})[selectedGuard.id] || (selectedGuard.deviceId ? (guardLocations || {})[selectedGuard.deviceId] : null);
  const liveBattery = liveLoc?.battery ?? selectedGuard.battery;
  const isCharging = liveLoc?.isCharging ?? selectedGuard.isCharging;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={closeGuardDrawer} />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="pointer-events-auto w-screen max-w-md border-l border-slate-800 bg-[#131D31] p-6 text-slate-100 shadow-2xl shadow-slate-950 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
                <h2 className="text-lg font-bold text-white">Guard Operations Telemetry</h2>
              </div>
              <button
                onClick={closeGuardDrawer}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <GuardAvatar photo={selectedGuard.photo} name={selectedGuard.name} size="h-16 w-16" rounded="rounded-2xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="truncate text-base font-bold text-white">{selectedGuard.name}</h3>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-blue-400">
                    {selectedGuard.id}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-400 mt-0.5">{selectedGuard.client}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      selectedGuard.status === 'On Patrol'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedGuard.status === 'Emergency'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {selectedGuard.status}
                  </span>
                  <span className="text-xs text-slate-400">{selectedGuard.shift}</span>
                </div>
              </div>
            </div>

            {/* Bound Hardware Phone Telemetry */}
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Smartphone className="h-4 w-4 text-cyan-400" />
                  <span>Bound Mobile Device</span>
                </div>
                {selectedGuard.deviceId ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <LinkIcon className="h-2.5 w-2.5" /> Bound
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Unlink className="h-2.5 w-2.5" /> No Device
                  </span>
                )}
              </div>

              {selectedGuard.deviceId ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <div className="font-mono text-xs font-bold text-blue-400">{selectedGuard.deviceId}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {boundDeviceObj?.deviceModel || 'Android Guard Phone'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Unbind phone from ${selectedGuard.name}?`)) {
                        assignDeviceToGuard(selectedGuard.id, null);
                      }
                    }}
                    className="btn-secondary py-1 px-2 text-[11px] text-amber-400 hover:text-white"
                  >
                    <Unlink className="h-3 w-3 mr-1" /> Unbind
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      className="input-spot text-xs py-1.5 flex-1"
                      value={selectedDeviceToBind}
                      onChange={(e) => setSelectedDeviceToBind(e.target.value)}
                    >
                      <option value="">Select registered device...</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.deviceId}>
                          {d.deviceModel} ({d.deviceId})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedDeviceToBind) return;
                        assignDeviceToGuard(selectedGuard.id, selectedDeviceToBind);
                        setSelectedDeviceToBind('');
                      }}
                      disabled={!selectedDeviceToBind}
                      className="btn-primary py-1 px-3 text-xs"
                    >
                      Bind
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Bind a phone to enable real-time GPS tracking and instant scan log sync for this guard.
                  </p>
                </div>
              )}
            </div>

            {/* Diagnostic Telemetry Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    Battery Status
                    {isCharging && <Zap className="h-3 w-3 text-amber-400 animate-pulse" />}
                  </span>
                  <Battery
                    className={`h-4 w-4 ${
                      liveBattery <= 20
                        ? 'text-rose-400 animate-pulse'
                        : liveBattery <= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  />
                </div>
                <div className="mt-2 text-lg font-bold text-white flex items-center gap-1.5">
                  <span>{liveBattery != null ? `${liveBattery}%` : '—'}</span>
                  {liveBattery <= 20 && (
                    <span className="text-[10px] text-rose-400 font-normal uppercase">Low</span>
                  )}
                  {isCharging && (
                    <span className="text-[10px] text-amber-400 font-normal uppercase">Charging</span>
                  )}
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      liveBattery <= 20
                        ? 'bg-rose-500'
                        : liveBattery <= 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, liveBattery ?? 0))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>GPS Telemetry</span>
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <div className="mt-2 text-sm font-bold text-white truncate">{selectedGuard.gpsAccuracy}</div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  {typeof selectedGuard.gpsLat === 'number' ? selectedGuard.gpsLat.toFixed(4) : selectedGuard.gpsLat},{' '}
                  {typeof selectedGuard.gpsLng === 'number' ? selectedGuard.gpsLng.toFixed(4) : selectedGuard.gpsLng}
                </div>
              </div>
            </div>

            {/* Verification & Performance Metrics */}
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Face Biometrics</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">
                  {selectedGuard.faceVerified ? `VERIFIED (${selectedGuard.faceVerifiedAt})` : 'UNVERIFIED'}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>Performance Rating</span>
                </div>
                <span className="text-xs font-semibold text-white">{selectedGuard.performanceRating}%</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Attendance Rate</span>
                </div>
                <span className="text-xs font-semibold text-white">{selectedGuard.attendanceRate}%</span>
              </div>
            </div>

            {/* Current Patrol Progression */}
            {selectedGuard.currentPatrolName && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Patrol</span>
                  <span className="text-xs font-semibold text-blue-400">{selectedGuard.progressPct}%</span>
                </div>
                <div className="text-sm font-bold text-white">{selectedGuard.currentPatrolName}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{selectedGuard.completedCheckpoints} of {selectedGuard.totalCheckpoints} Checkpoints</span>
                  <span>ETA: {selectedGuard.etaMinutes} mins</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${selectedGuard.progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Footer Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                addToast('Dispatch Command', `Field supervisor dispatched to ${selectedGuard.name}'s position.`, 'info');
              }}
              className="btn-primary w-full py-2.5"
            >
              <Phone className="h-4 w-4 mr-2" /> Direct Contact Guard ({selectedGuard.phone})
            </button>

            <button
              onClick={() => {
                addToast('Supervisor Alert', `Supervisor unit dispatched to ${selectedGuard.siteName}`, 'warning');
              }}
              className="btn-secondary w-full py-2.5 text-slate-300"
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" /> Dispatch Field Supervisor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
