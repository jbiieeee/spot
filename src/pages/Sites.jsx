import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import {
  Building2,
  Users,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function Sites() {
  const { sites, guards, incidents, addToast } = useSpot();
  const [selectedSite, setSelectedSite] = useState(null);

  return (
    <Layout
      title="Deployment Sites Management"
      subtitle="Categorized Facility Profiles, Checkpoint Maps & Guard Allocation"
    >
      <div className="space-y-6">
        {/* Sites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              onClick={() => setSelectedSite(site)}
              className="card-spot p-0 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/60 flex flex-col justify-between"
            >
              <div>
                {/* Image Header */}
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={site.image} alt={site.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent" />
                  <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-slate-700 backdrop-blur-md">
                    {site.type}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-white leading-tight">{site.name}</h3>
                  <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" /> {site.address}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Guards</div>
                      <div className="text-sm font-bold text-white mt-0.5">{site.activeGuardsCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Checkpoints</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">{site.checkpointsCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Incidents</div>
                      <div className="text-sm font-bold text-rose-400 mt-0.5">{site.incidentsCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-semibold">
                <span>Inspect Facility & Guards</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Site Detail Drawer Modal */}
        {selectedSite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 p-5">
                <div>
                  <span className="text-xs font-mono text-blue-400">{selectedSite.id} • {selectedSite.type}</span>
                  <h3 className="text-lg font-bold text-white">{selectedSite.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Site Overview */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Client Organization:</span>
                    <div className="font-bold text-white mt-0.5">{selectedSite.client}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Security Status:</span>
                    <div className="font-bold text-emerald-400 mt-0.5">{selectedSite.status}</div>
                  </div>
                </div>

                {/* Assigned Guards */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" /> Assigned Guards at Facility
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guards
                      .filter((g) => g.siteId === selectedSite.id || g.siteName === selectedSite.name)
                      .map((g) => (
                        <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
                          <img src={g.photo} alt={g.name} className="h-9 w-9 rounded-full object-cover" />
                          <div>
                            <div className="font-bold text-white">{g.name}</div>
                            <div className="text-slate-400">{g.shift}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end">
                <button onClick={() => setSelectedSite(null)} className="btn-secondary text-xs">
                  Close Detail Modal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
