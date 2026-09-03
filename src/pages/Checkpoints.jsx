import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import {
  QrCode, Plus, Search, Filter, Printer, Copy, Eye, Trash2,
  Building2, MapPin, CheckCircle2, ShieldCheck, Sparkles, X, Radio
} from 'lucide-react';

export default function Checkpoints() {
  const {
    checkpoints,
    sites,
    checkpointLogs,
    addCheckpoint,
    deleteCheckpoint,
    batchGenerateSiteCheckpoints,
    addToast
  } = useSpot();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [qrInspectModal, setQrInspectModal] = useState(null);
  const [batchPrintSite, setBatchPrintSite] = useState(null);

  const [form, setForm] = useState({
    name: '',
    siteId: '',
    zone: 'Zone A',
    description: '',
    lat: '',
    lng: ''
  });

  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.name]));

  // Filtered checkpoints
  const filteredCheckpoints = checkpoints.filter((cp) => {
    const matchesSite = selectedSiteFilter === 'ALL' || cp.siteId === selectedSiteFilter;
    const matchesSearch =
      cp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cp.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (siteMap[cp.siteId] || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSite && matchesSearch;
  });

  // Handle Save New Checkpoint
  const handleSaveCheckpoint = async () => {
    if (!form.name.trim() || !form.siteId) {
      addToast('Validation Error', 'Checkpoint name and assigned site are required.', 'warning');
      return;
    }

    const created = await addCheckpoint({
      name: form.name,
      siteId: form.siteId,
      zone: form.zone || 'Zone A',
      description: form.description,
      lat: form.lat,
      lng: form.lng
    });

    setForm({ name: '', siteId: '', zone: 'Zone A', description: '', lat: '', lng: '' });
    setOpenAddModal(false);
    setQrInspectModal(created);
  };

  const getQRPayload = (cp) => {
    return JSON.stringify({
      id: cp.id,
      siteId: cp.siteId,
      name: cp.name,
      qrCode: cp.qrCode
    });
  };

  return (
    <Layout
      title="Physical QR Patrol Checkpoints Hub"
      subtitle="Facility Scan Points, Printable Mobile Scanner Placards & Real-time Guard Log Verification"
      actions={
        <button
          onClick={() => setOpenAddModal(true)}
          className="btn-primary text-xs flex items-center gap-2 py-2 px-4 shadow-lg shadow-blue-600/30"
        >
          <Plus className="h-4 w-4" /> Create QR Post
        </button>
      }
    >
      <div className="space-y-6">
        {/* Top Filter & Search Bar */}
        <div className="card-spot p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search checkpoint name, QR code, or facility..."
              className="input-spot pl-10"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Site Filter Dropdown */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-4 w-4 text-blue-400" />
              <span>Filter Site:</span>
            </div>

            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="input-spot w-auto py-1.5 px-3 text-xs"
            >
              <option value="ALL">All Deployment Sites ({checkpoints.length} QRs)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({checkpoints.filter((c) => c.siteId === s.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkpoint Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-spot p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Total QR Posts</div>
              <div className="text-xl font-bold text-white mt-1">{checkpoints.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <QrCode className="h-5 w-5" />
            </div>
          </div>

          <div className="card-spot p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Sites Covered</div>
              <div className="text-xl font-bold text-white mt-1">{sites.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>

          <div className="card-spot p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Scans Logged Today</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{checkpointLogs.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="card-spot p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">App Scan Format</div>
              <div className="text-xs font-mono font-bold text-cyan-300 mt-1">JSON Validated</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Radio className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Checkpoints Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCheckpoints.map((cp) => {
            const siteName = siteMap[cp.siteId] || cp.siteName || 'Assigned Site';

            return (
              <div
                key={cp.id}
                className="card-spot p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Small QR Thumbnail */}
                    <div
                      onClick={() => setQrInspectModal(cp)}
                      className="p-2 rounded-xl bg-white cursor-pointer hover:opacity-90 shadow-md shrink-0"
                      title="Click to view & print QR"
                    >
                      <QRCodeSVG value={getQRPayload(cp)} size={64} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white text-sm truncate leading-snug">{cp.name}</h3>
                      <div className="mt-0.5 text-xs text-blue-400 flex items-center gap-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{siteName}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{cp.zone || 'Zone A'}</span>
                        {cp.lat && cp.lng && <span className="text-emerald-400">GPS Pinned</span>}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-[11px] text-cyan-300 text-center select-all">
                    {cp.qrCode}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setQrInspectModal(cp)}
                    className="btn-primary py-1.5 px-3 text-xs flex-1 flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" /> View / Print QR
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText?.(getQRPayload(cp));
                      addToast('QR JSON Copied', 'Copied mobile scanner payload to clipboard.', 'info');
                    }}
                    className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs"
                    title="Copy QR JSON payload"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete checkpoint post "${cp.name}"?`)) {
                        deleteCheckpoint(cp.id, cp.siteId);
                      }
                    }}
                    className="p-2 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-400 hover:text-white text-xs"
                    title="Delete Checkpoint"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCheckpoints.length === 0 && (
          <div className="card-spot py-16 text-center space-y-3">
            <QrCode className="h-10 w-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Checkpoints Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a new physical QR checkpoint post or batch-generate QR checkpoints for a deployment site.
            </p>
            <button onClick={() => setOpenAddModal(true)} className="btn-primary text-xs inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Create QR Post
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CREATE NEW CHECKPOINT MODAL
          ───────────────────────────────────────────────────────────── */}
      {openAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Register QR Checkpoint Post</h3>
                <p className="text-xs text-slate-400">Generates unique code for guard mobile app scanning</p>
              </div>
              <button
                onClick={() => setOpenAddModal(false)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Checkpoint Post Name *</label>
                <input
                  type="text"
                  className="input-spot"
                  placeholder="e.g. Main Lobby Reception / Perimeter Gate 1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Deployment Site *</label>
                <select
                  className="input-spot"
                  value={form.siteId}
                  onChange={(e) => {
                    const s = sites.find((site) => site.id === e.target.value);
                    setForm({ ...form, siteId: e.target.value, lat: s?.lat || '', lng: s?.lng || '' });
                  }}
                >
                  <option value="">Select a facility site...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Zone Assignment</label>
                  <input
                    type="text"
                    className="input-spot"
                    placeholder="e.g. Zone A / Floor 1"
                    value={form.zone}
                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    className="input-spot"
                    placeholder="e.g. Near Fire Extinguisher"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setOpenAddModal(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleSaveCheckpoint}
                disabled={!form.name.trim() || !form.siteId}
                className="btn-primary text-xs"
              >
                Generate QR Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          INSPECT / PRINT QR MODAL
          ───────────────────────────────────────────────────────────── */}
      {qrInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#131D31] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Patrol Checkpoint QR Code
                </span>
                <h3 className="text-base font-bold text-white">{qrInspectModal.name}</h3>
              </div>
              <button
                onClick={() => setQrInspectModal(null)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Card */}
            <div className="printable-qr-card rounded-2xl bg-white p-6 text-center text-slate-900 shadow-xl space-y-3">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                S.P.O.T. Security Operations
              </div>
              <h2 className="text-lg font-black text-slate-950 leading-tight">{qrInspectModal.name}</h2>
              <p className="text-xs text-slate-600 font-bold">{siteMap[qrInspectModal.siteId] || qrInspectModal.siteName}</p>

              <div className="inline-block p-4 rounded-xl border-2 border-slate-900 bg-white my-2">
                <QRCodeSVG value={getQRPayload(qrInspectModal)} size={200} level="H" />
              </div>

              <div className="font-mono text-sm font-black tracking-wider text-slate-900">
                {qrInspectModal.qrCode}
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Guards scan this placard using the S.P.O.T. mobile application to log their physical visit to this post.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(getQRPayload(qrInspectModal));
                  addToast('Payload Copied', 'Mobile scanner JSON payload copied.', 'info');
                }}
                className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </button>

              <button
                onClick={() => window.print()}
                className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print Placard
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
