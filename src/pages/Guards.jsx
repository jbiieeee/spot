import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import {
  Users,
  Search,
  Battery,
  MapPin,
  ShieldCheck,
  Phone,
  Filter,
  Eye,
  Plus
} from 'lucide-react';

export default function Guards() {
  const { guards, openGuardDrawer } = useSpot();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredGuards = guards.filter((guard) => {
    const matchesSearch =
      guard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guard.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guard.siteName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || guard.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout
      title="Guards Directory & Personnel Roster"
      subtitle="Enterprise Active Roster, Battery Telemetry, Face Verification & Drawer Telematics"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card-spot p-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guard by name, ID, or deployment site..."
              className="input-spot pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {['All', 'On Patrol', 'Idle', 'Emergency'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    statusFilter === st ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Guards Enterprise Table */}
        <div className="card-spot p-0 overflow-hidden border border-slate-800">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Guard Info</th>
                  <th className="px-6 py-4">Client & Site</th>
                  <th className="px-6 py-4">Shift</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Battery</th>
                  <th className="px-6 py-4">GPS Accuracy</th>
                  <th className="px-6 py-4">Face Verified</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredGuards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      No guard personnel found in database. Database is fresh and ready for new guard entries.
                    </td>
                  </tr>
                ) : (
                  filteredGuards.map((guard) => (
                    <tr
                      key={guard.id}
                      onClick={() => openGuardDrawer(guard)}
                      className="hover:bg-slate-800/50 cursor-pointer transition"
                    >
                    {/* Guard Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={guard.photo}
                          alt={guard.name}
                          className="h-10 w-10 rounded-full object-cover border border-blue-500/40"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{guard.name}</div>
                          <div className="text-xs font-mono text-blue-400">{guard.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Client & Site */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{guard.siteName}</div>
                      <div className="text-xs text-slate-400">{guard.client}</div>
                    </td>

                    {/* Shift */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">
                      {guard.shift}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          guard.status === 'On Patrol'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : guard.status === 'Emergency'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {guard.status}
                      </span>
                    </td>

                    {/* Battery */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-white text-xs">{guard.battery}%</span>
                      </div>
                    </td>

                    {/* GPS Accuracy */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">
                      {guard.gpsAccuracy}
                    </td>

                    {/* Face Verified */}
                    <td className="px-6 py-4">
                      {guard.faceVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                          <ShieldCheck className="h-3 w-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">PENDING</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGuardDrawer(guard);
                        }}
                        className="btn-secondary py-1 px-3 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-blue-400" /> Inspect Drawer
                      </button>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
