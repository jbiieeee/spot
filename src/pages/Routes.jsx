import React, { useState } from 'react';
import Layout from '../components/Layout';
import GuardAvatar from '../components/GuardAvatar';
import { useSpot } from '../context/SpotContext';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  X,
  Play,
  FileText,
  Search
} from 'lucide-react';

export default function PatrolOperations() {
  const { patrols, addToast } = useSpot();
  const [selectedPatrol, setSelectedPatrol] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatrols = patrols.filter(
    (p) =>
      p.guardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.routeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout
      title="Patrol Operations & Route Control"
      subtitle="Active Patrol Cards, Route Checkpoint Progression & Telemetry Timelines"
    >
      <div className="space-y-6">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card-spot p-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patrol route, guard name, or site..."
              className="input-spot pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Active Patrols ({patrols.length})</span>
          </div>
        </div>

        {/* Patrol Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatrols.map((patrol) => (
            <div
              key={patrol.id}
              onClick={() => setSelectedPatrol(patrol)}
              className="card-spot cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/60 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <span className="text-xs font-mono font-bold text-blue-400">{patrol.id}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      patrol.status === 'In Progress'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {patrol.status}
                  </span>
                </div>

                {/* Guard & Site */}
                <div className="flex items-center gap-3 mb-4">
                  <GuardAvatar photo={patrol.guardPhoto} name={patrol.guardName} />
                  <div>
                    <h4 className="text-sm font-bold text-white">{patrol.guardName}</h4>
                    <p className="text-xs text-slate-400">{patrol.siteName}</p>
                  </div>
                </div>

                {/* Route Name */}
                <div className="text-xs font-semibold text-slate-200 mb-3 line-clamp-1">
                  {patrol.routeName}
                </div>

                {/* Progress Bar & Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold text-blue-400">{patrol.progressPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${patrol.progressPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Checkpoints</div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {patrol.completedCount}/{patrol.totalCount}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Remaining</div>
                      <div className="text-xs font-bold text-amber-400 mt-0.5">{patrol.remainingCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">ETA</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">{patrol.etaMinutes}m</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-medium">
                <span>View Timeline & History</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Patrol Timeline & Verification History Modal */}
        {selectedPatrol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 p-5">
                <div>
                  <span className="text-xs font-mono text-blue-400">{selectedPatrol.id} Timeline</span>
                  <h3 className="text-base font-bold text-white">{selectedPatrol.routeName}</h3>
                </div>
                <button
                  onClick={() => setSelectedPatrol(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Guard Banner */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <GuardAvatar photo={selectedPatrol.guardPhoto} name={selectedPatrol.guardName} />
                    <div>
                      <div className="font-bold text-white text-sm">{selectedPatrol.guardName}</div>
                      <div className="text-xs text-slate-400">{selectedPatrol.siteName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{selectedPatrol.progressPct}% Complete</div>
                    <div className="text-[11px] text-slate-400">Started: {selectedPatrol.startTime}</div>
                  </div>
                </div>

                {/* Timeline History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Checkpoint History & Verification Stream
                  </h4>
                  <div className="space-y-3">
                    {selectedPatrol.checkpoints.map((cp, idx) => (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              cp.status === 'Completed'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white">{cp.name}</div>
                            <div className="text-[10px] text-slate-400">{cp.method}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-semibold ${
                              cp.status === 'Completed' ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {cp.scannedAt || 'Pending Scan'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end">
                <button onClick={() => setSelectedPatrol(null)} className="btn-secondary text-xs">
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
