import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, MapPin, User, FileText, Camera, Plus, X } from 'lucide-react';

export default function Incidents() {
  const { incidents, addToast, updateIncidentStatus } = useSpot();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const filteredIncidents = incidents.filter(
    (inc) => priorityFilter === 'All' || inc.priority === priorityFilter
  );

  return (
    <Layout
      title="Incident Response & Threat Evidence Console"
      subtitle="Priority Security Alerts, Evidence Attachments & Dispatch Investigation Workflows"
    >
      <div className="space-y-6">
        {/* Priority Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setPriorityFilter('High')}
            className={`card-spot cursor-pointer transition p-4 flex items-center justify-between ${
              priorityFilter === 'High' ? 'border-rose-500 bg-rose-950/20' : ''
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">High Priority Alerts</span>
              <div className="text-2xl font-bold text-white mt-1">
                {incidents.filter((i) => i.priority === 'High').length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          <div
            onClick={() => setPriorityFilter('Medium')}
            className={`card-spot cursor-pointer transition p-4 flex items-center justify-between ${
              priorityFilter === 'Medium' ? 'border-amber-500 bg-amber-950/20' : ''
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Medium Priority Alerts</span>
              <div className="text-2xl font-bold text-white mt-1">
                {incidents.filter((i) => i.priority === 'Medium').length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div
            onClick={() => setPriorityFilter('Low')}
            className={`card-spot cursor-pointer transition p-4 flex items-center justify-between ${
              priorityFilter === 'Low' ? 'border-blue-500 bg-blue-950/20' : ''
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Low Priority Logs</span>
              <div className="text-2xl font-bold text-white mt-1">
                {incidents.filter((i) => i.priority === 'Low').length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Incidents Grid */}
        {filteredIncidents.length === 0 ? (
          <div className="card-spot text-center py-16 text-xs text-slate-500">
            No incident reports found in database. Database is fresh and clear of active security incidents.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className="card-spot p-0 overflow-hidden cursor-pointer transition hover:-translate-y-1 hover:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full">
                    <img src={incident.evidencePhoto} alt={incident.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent" />
                    <span
                      className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        incident.priority === 'High'
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-600/40'
                          : incident.priority === 'Medium'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {incident.priority} Priority
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                      <span>{incident.id}</span>
                      <span>{incident.timestamp}</span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{incident.title}</h3>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-2">{incident.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Facility Location:</span>
                        <span className="font-semibold text-slate-200">{incident.siteName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reporting Guard:</span>
                        <span className="font-semibold text-blue-400">{incident.reporterName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-semibold">
                  <span>View Full Incident Report</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Incident Detail & Resolution Modal */}
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 p-5">
                <div>
                  <span className="text-xs font-mono text-rose-400">{selectedIncident.id} • Priority {selectedIncident.priority}</span>
                  <h3 className="text-lg font-bold text-white">{selectedIncident.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <img
                  src={selectedIncident.evidencePhoto}
                  alt={selectedIncident.title}
                  className="w-full h-56 rounded-xl object-cover border border-slate-800 shadow-md"
                />

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-bold text-white">{selectedIncident.location} ({selectedIncident.siteName})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reported By:</span>
                    <span className="font-bold text-blue-400">{selectedIncident.reporterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="font-mono text-slate-200">{selectedIncident.timestamp}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description & Evidence Details</h4>
                  <p className="text-xs leading-relaxed text-slate-200 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                    {selectedIncident.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Actions Taken</h4>
                  <p className="text-xs leading-relaxed text-slate-200 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                    {selectedIncident.actionsTaken}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => {
                    updateIncidentStatus(selectedIncident.id, 'Resolved');
                    addToast('Incident Resolution', `Incident ${selectedIncident.id} marked RESOLVED by supervisor.`, 'success');
                    setSelectedIncident(null);
                  }}
                  className="btn-primary text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Incident Resolved
                </button>
                <button onClick={() => setSelectedIncident(null)} className="btn-secondary text-xs">
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
