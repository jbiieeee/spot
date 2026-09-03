import React, { useState } from 'react';
import Layout from '../components/Layout';
import GuardAvatar from '../components/GuardAvatar';
import { useSpot } from '../context/SpotContext';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone, RefreshCw, Link as LinkIcon, Unlink, Search, Wifi, Trash2,
  CheckCircle2, UserCheck, Shield, Plus, X, ArrowRightLeft, Radio, Battery, Zap
} from 'lucide-react';

function formatDate(date) {
  if (!date) return 'N/A';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default function Devices() {
  const { devices, guards, guardLocations, assignDeviceToGuard, unassignDevice, deleteDevice, addToast } = useSpot();
  const { profile } = useAuth();
  const canManageDevices = true; // Admin/Supervisor command
  const [search, setSearch] = useState('');
  const [bindModalDevice, setBindModalDevice] = useState(null);
  const [selectedGuardForBind, setSelectedGuardForBind] = useState('');

  // Map of deviceId -> bound guard
  const deviceToGuard = {};
  guards.forEach((g) => {
    if (g.deviceId) deviceToGuard[g.deviceId] = g;
  });

  const filtered = devices.filter((d) =>
    (d.deviceId || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.deviceModel || '').toLowerCase().includes(search.toLowerCase()) ||
    (deviceToGuard[d.deviceId]?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const unassigned = devices.filter((d) => !deviceToGuard[d.deviceId]);
  const assigned = devices.filter((d) => !!deviceToGuard[d.deviceId]);

  // Handle Bind action
  const handleConfirmBind = async () => {
    if (!bindModalDevice || !selectedGuardForBind) return;
    await assignDeviceToGuard(selectedGuardForBind, bindModalDevice.deviceId);
    setBindModalDevice(null);
    setSelectedGuardForBind('');
  };

  return (
    <Layout
      title="Registered Guard Mobile Devices"
      subtitle="Hardware asset telemetry, real-time guard binding/unbinding & live GPS phone tracking"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-spot p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/30">
              <Smartphone className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{devices.length}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">Total Phones Registered</div>
            </div>
          </div>

          <div className="card-spot p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
              <LinkIcon className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">{assigned.length}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">Active Bound to Guard</div>
            </div>
          </div>

          <div className="card-spot p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30">
              <Unlink className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">{unassigned.length}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">Free / Unassigned Devices</div>
            </div>
          </div>
        </div>

        {/* Search + Info Ribbon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card-spot p-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              className="input-spot pl-10"
              placeholder="Search by device ID, phone model, or assigned guard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Telemetry Synced
            </span>
          </div>
        </div>

        {/* Table of Registered Devices with Bind & Unbind Actions */}
        <div className="card-spot p-0 overflow-hidden border border-slate-800">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Device Model</th>
                  <th className="px-6 py-4">Hardware ID</th>
                  <th className="px-6 py-4">OS Telemetry</th>
                  <th className="px-6 py-4">Live Battery</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4">Assigned Guard</th>
                  <th className="px-6 py-4 text-center">Binding Status</th>
                  <th className="px-6 py-4 text-right">Device Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700">
                          <Smartphone className="h-7 w-7 text-slate-500" />
                        </div>
                        <div className="text-sm text-slate-400 font-semibold">No registered devices found</div>
                        <div className="text-xs text-slate-500 max-w-xs text-center">
                          When a guard logs in from their mobile device, the phone registers automatically into this command registry.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => {
                    const boundGuard = deviceToGuard[d.deviceId];
                    const locData = guardLocations[d.deviceId] || (boundGuard ? guardLocations[boundGuard.id] : null);
                    const liveBatt = locData?.battery ?? boundGuard?.battery ?? d.battery;
                    const isCharging = locData?.isCharging ?? boundGuard?.isCharging;

                    return (
                      <tr key={d.id} className="hover:bg-slate-800/40 transition">
                        {/* Device Model */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-blue-400">
                              <Smartphone className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{d.deviceModel}</div>
                              <div className="text-[10px] text-slate-500 font-mono">Android OS</div>
                            </div>
                          </div>
                        </td>

                        {/* Device ID */}
                        <td className="px-6 py-4 font-mono text-xs font-bold text-blue-400 select-all">
                          {d.deviceId}
                        </td>

                        {/* OS Version */}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          <span className="bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                            {d.osVersion || 'Android 13+'}
                          </span>
                        </td>

                        {/* Live Battery Telemetry */}
                        <td className="px-6 py-4">
                          {liveBatt != null ? (
                            <div className="flex items-center gap-1.5">
                              <Battery
                                className={`h-4 w-4 ${
                                  liveBatt <= 20
                                    ? 'text-rose-400 animate-pulse'
                                    : liveBatt <= 40
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              />
                              <span
                                className={`font-bold text-xs ${
                                  liveBatt <= 20
                                    ? 'text-rose-400'
                                    : liveBatt <= 40
                                    ? 'text-amber-400'
                                    : 'text-white'
                                }`}
                              >
                                {liveBatt}%
                              </span>
                              {isCharging && (
                                <Zap className="h-3 w-3 text-amber-400 animate-pulse" title="Device is charging" />
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">—</span>
                          )}
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs">
                            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-slate-300 font-medium">{formatDate(d.lastActive)}</span>
                          </div>
                        </td>

                        {/* Assigned Guard */}
                        <td className="px-6 py-4">
                          {boundGuard ? (
                            <div className="flex items-center gap-2.5">
                              <GuardAvatar photo={boundGuard.photo} name={boundGuard.name} size="h-8 w-8" />
                              <div>
                                <div className="text-xs font-bold text-white">{boundGuard.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{boundGuard.siteName}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic font-medium">Unassigned / Available</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4 text-center">
                          {boundGuard ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                              <LinkIcon className="h-3 w-3" /> Bound to Guard
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                              <Unlink className="h-3 w-3" /> Available Phone
                            </span>
                          )}
                        </td>

                        {/* Actions: BIND / REASSIGN / UNBIND */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {boundGuard ? (
                              <>
                                <button
                                  onClick={() => {
                                    setBindModalDevice(d);
                                    setSelectedGuardForBind(boundGuard.id);
                                  }}
                                  className="btn-secondary py-1 px-2.5 text-xs text-blue-400 hover:text-white flex items-center gap-1"
                                  title="Reassign phone to a different guard"
                                >
                                  <ArrowRightLeft className="h-3 w-3" /> Reassign
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Unbind device "${d.deviceId}" from guard "${boundGuard.name}"?`)) {
                                      unassignDevice(d.deviceId);
                                    }
                                  }}
                                  className="btn-secondary py-1 px-2.5 text-xs text-amber-400 hover:text-white flex items-center gap-1"
                                  title="Unbind phone from this guard"
                                >
                                  <Unlink className="h-3 w-3" /> Unbind
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setBindModalDevice(d);
                                  setSelectedGuardForBind(guards[0]?.id || '');
                                }}
                                className="btn-primary py-1 px-3 text-xs flex items-center gap-1 shadow-md"
                                title="Bind phone to a guard"
                              >
                                <LinkIcon className="h-3 w-3" /> Bind to Guard
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (!window.confirm(`Permanently delete registered device ${d.deviceId}? Any guard binding will be removed.`)) return;
                                try {
                                  await deleteDevice(d);
                                } catch (e) {
                                  addToast('Delete Failed', e.message || 'Could not delete device.', 'danger');
                                }
                              }}
                              title="Delete registered device record"
                              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-rose-400 hover:text-white transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BIND / REASSIGN DEVICE TO GUARD MODAL
          ───────────────────────────────────────────────────────────── */}
      {bindModalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Device Hardware Binding</span>
                <h3 className="text-base font-bold text-white">Bind / Reassign Phone</h3>
              </div>
              <button
                onClick={() => setBindModalDevice(null)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400">Target Phone:</div>
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>{bindModalDevice.deviceModel}</span>
                <span className="font-mono text-[11px] text-blue-400">{bindModalDevice.deviceId}</span>
              </div>
              {deviceToGuard[bindModalDevice.deviceId] && (
                <div className="text-[11px] text-amber-400 mt-1">
                  Currently bound to: <strong>{deviceToGuard[bindModalDevice.deviceId].name}</strong>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-slate-400">Select Guard to Bind *</label>
              <select
                className="input-spot"
                value={selectedGuardForBind}
                onChange={(e) => setSelectedGuardForBind(e.target.value)}
              >
                <option value="">Select a guard from roster...</option>
                {guards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.siteName}) {g.deviceId ? `[Bound to ${g.deviceId}]` : '[Free / No Device]'}
                  </option>
                ))}
              </select>

              {/* Guard swap notification */}
              {selectedGuardForBind && guards.find(g => g.id === selectedGuardForBind)?.deviceId && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
                  ℹ️ Guard <strong>{guards.find(g => g.id === selectedGuardForBind)?.name}</strong> currently has phone{' '}
                  <span className="font-mono font-bold text-white">{guards.find(g => g.id === selectedGuardForBind)?.deviceId}</span>.
                  Confirming will automatically swap and assign this new phone.
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                When bound, the guard's mobile GPS logs and telemetry from this phone will stream in real-time.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setBindModalDevice(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleConfirmBind}
                disabled={!selectedGuardForBind}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <LinkIcon className="h-3.5 w-3.5" /> Confirm Binding
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
