import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import {
  AlertTriangle, CheckCircle2, Clock, Plus, X, Check, Trash2, Pencil
} from 'lucide-react';

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function DeleteConfirm({ label, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl border border-rose-800/60 bg-[#1E293B] shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Confirm Deletion</div>
            <div className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</div>
          </div>
        </div>
        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          Delete incident: <span className="font-bold text-white">{label}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 text-xs">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function IncidentFormFields({ form, onChange }) {
  return (
    <>
      <Field label="Incident Title *">
        <input className="input-spot" value={form.title} onChange={e => onChange('title', e.target.value)} placeholder="e.g. Unauthorized Access at Gate B" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Priority">
          <select className="input-spot" value={form.priority} onChange={e => onChange('priority', e.target.value)}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </Field>
        <Field label="Site / Location">
          <input className="input-spot" value={form.siteName} onChange={e => onChange('siteName', e.target.value)} placeholder="e.g. Eastwood Mall" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Exact Location">
          <input className="input-spot" value={form.location} onChange={e => onChange('location', e.target.value)} placeholder="e.g. Parking Level 2" />
        </Field>
        <Field label="Reporting Guard">
          <input className="input-spot" value={form.reporterName} onChange={e => onChange('reporterName', e.target.value)} placeholder="e.g. Juan dela Cruz" />
        </Field>
      </div>
      <Field label="Description">
        <textarea className="input-spot resize-none" rows={3} value={form.description} onChange={e => onChange('description', e.target.value)} placeholder="Describe the incident in detail..." />
      </Field>
      <Field label="Evidence Photo URL (optional)">
        <input className="input-spot" value={form.evidencePhoto} onChange={e => onChange('evidencePhoto', e.target.value)} placeholder="https://..." />
      </Field>
    </>
  );
}

const EMPTY_INC = { title: '', priority: 'High', siteName: '', location: '', reporterName: '', description: '', evidencePhoto: '' };

export default function Incidents() {
  const { incidents, addToast, updateIncidentStatus, addIncident, deleteIncident } = useSpot();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addForm, setAddForm] = useState(EMPTY_INC);
  const [saving, setSaving] = useState(false);

  const filteredIncidents = incidents.filter(
    (inc) => priorityFilter === 'All' || inc.priority === priorityFilter
  );

  const handleAdd = async () => {
    if (!addForm.title.trim()) return;
    setSaving(true);
    await addIncident(addForm);
    setSaving(false);
    setAddForm(EMPTY_INC);
    setShowAdd(false);
  };

  const handleDelete = async () => {
    await deleteIncident(deleteTarget.id);
    setSelectedIncident(null);
    setDeleteTarget(null);
  };

  return (
    <Layout
      title="Incident Response & Threat Evidence Console"
      subtitle="Priority Security Alerts, Evidence Attachments & Dispatch Investigation Workflows"
    >
      <div className="space-y-6">
        {/* Priority Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setPriorityFilter(priorityFilter === 'High' ? 'All' : 'High')}
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
            onClick={() => setPriorityFilter(priorityFilter === 'Medium' ? 'All' : 'Medium')}
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
            onClick={() => setPriorityFilter(priorityFilter === 'Low' ? 'All' : 'Low')}
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

        {/* Add Incident Button */}
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log New Incident
          </button>
        </div>

        {/* Incidents Grid */}
        {filteredIncidents.length === 0 ? (
          <div className="card-spot text-center py-16 flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700">
              <AlertTriangle className="h-7 w-7 text-slate-500" />
            </div>
            <div className="text-sm font-semibold text-slate-400">No incidents found</div>
            <div className="text-xs text-slate-500">Database is clear. Use "Log New Incident" to file a report.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className="card-spot p-0 overflow-hidden cursor-pointer transition hover:-translate-y-1 hover:border-slate-700 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 w-full">
                    <img
                      src={incident.evidencePhoto || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80'}
                      alt={incident.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent" />
                    <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      incident.priority === 'High'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-600/40'
                        : incident.priority === 'Medium'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {incident.priority} Priority
                    </span>
                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(incident); }}
                      title="Delete Incident"
                      className="absolute top-3 left-3 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-bold ${incident.status === 'Resolved' ? 'text-emerald-400' : 'text-amber-400'}`}>{incident.status}</span>
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
      </div>

      {/* ── Incident Detail & Resolution Modal ──────────────────── */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <span className="text-xs font-mono text-rose-400">{selectedIncident.id} • Priority {selectedIncident.priority}</span>
                <h3 className="text-lg font-bold text-white">{selectedIncident.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedIncident(null); setDeleteTarget(selectedIncident); }}
                  className="rounded-xl border border-rose-700/50 bg-rose-500/10 p-2 text-rose-400 hover:text-white transition"
                  title="Delete Incident"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <img
                src={selectedIncident.evidencePhoto || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80'}
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
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-bold ${selectedIncident.status === 'Resolved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedIncident.status}
                  </span>
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
              {selectedIncident.status !== 'Resolved' ? (
                <button
                  onClick={() => {
                    updateIncidentStatus(selectedIncident.id, 'Resolved');
                    addToast('Incident Resolution', `Incident ${selectedIncident.id} marked RESOLVED by supervisor.`, 'success');
                    setSelectedIncident(null);
                  }}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Incident Resolved
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Resolved
                </span>
              )}
              <button onClick={() => setSelectedIncident(null)} className="btn-secondary text-xs">
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Incident Modal ────────────────────────────────── */}
      {showAdd && (
        <Modal
          title="Log New Incident Report"
          subtitle="File a new security incident for the record"
          onClose={() => { setShowAdd(false); setAddForm(EMPTY_INC); }}
          footer={
            <>
              <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_INC); }} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAdd} disabled={saving || !addForm.title.trim()} className="btn-primary text-xs flex items-center gap-2">
                {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-3.5 w-3.5" />}
                Submit Report
              </button>
            </>
          }
        >
          <IncidentFormFields form={addForm} onChange={(k, v) => setAddForm(f => ({ ...f, [k]: v }))} />
        </Modal>
      )}

      {/* ── Delete Confirmation ───────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}
