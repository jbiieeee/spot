import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { addItem, removeItem, subscribeCollection } from '../lib/dataSource';

export default function Checkpoints() {
  const [checkpoints, setCheckpoints] = useState([]);
  const [sites, setSites] = useState([]);
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(null);
  const [form, setForm] = useState({ name: '', siteId: '', lat: '', lng: '' });

  useEffect(() => {
    const u1 = subscribeCollection('checkpoints', setCheckpoints);
    const u2 = subscribeCollection('sites', setSites);
    return () => { u1(); u2(); };
  }, []);

  const save = async () => {
    if (!form.name || !form.siteId) return;
    const qrCode = 'SPOT-CP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const newItem = {
      name: form.name,
      siteId: form.siteId,
      qrCode,
      lat: parseFloat(form.lat) || 0,
      lng: parseFloat(form.lng) || 0
    };
    await addItem('checkpoints', newItem);
    setForm({ name: '', siteId: '', lat: '', lng: '' });
    setOpen(false);
    setQrOpen(newItem);
  };

  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.name]));

  return (
    <Layout
      title="Checkpoints"
      subtitle="Physical patrol points with generated QR codes"
      actions={<button className="btn-create" onClick={() => setOpen(true)}><span className="btn-icon">+</span>Add Checkpoint</button>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {checkpoints.map((c) => (
          <div key={c.id} className="card border-cyan-100 p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-950">{c.name}</h3>
                <div className="mt-1 text-xs text-slate-500">Site: {siteMap[c.siteId] || 'Unknown site'}</div>
              </div>
              <span className="badge bg-cyan-50 font-mono text-cyan-800 ring-1 ring-inset ring-cyan-100">{c.qrCode}</span>
            </div>
            <div className="mb-4 text-xs text-slate-500">
              Lat: {c.lat?.toFixed?.(4) ?? '-'} / Lng: {c.lng?.toFixed?.(4) ?? '-'}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 justify-center text-xs" onClick={() => setQrOpen(c)}>Show QR</button>
              <button className="btn-ghost text-xs text-rose-600" onClick={() => { if (confirm(`Delete ${c.name}?`)) removeItem('checkpoints', c.id); }}>Delete</button>
            </div>
          </div>
        ))}
        {checkpoints.length === 0 && (
          <div className="card col-span-full p-8 text-center text-slate-400">No checkpoints yet.</div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add New Checkpoint"
        eyebrow="Checkpoint Transaction"
        description="Register a scan point and generate its unique QR identifier."
        footer={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-create" onClick={save}><span className="btn-icon">+</span>Create QR Point</button>
        </>}
      >
        <div className="mb-4 rounded-lg border border-cyan-100 bg-cyan-50/70 p-3">
          <div className="text-sm font-semibold text-cyan-950">QR checkpoint identity</div>
          <p className="mt-1 text-xs text-cyan-800">A unique code is generated after saving and can be printed from the checkpoint card.</p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="label">Checkpoint Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lobby Entrance" />
          </div>
          <div className="field">
            <label className="label">Site</label>
            <select className="input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
              <option value="">Select a site...</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="field"><label className="label">Latitude</label><input className="input" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="14.5547" /></div>
            <div className="field"><label className="label">Longitude</label><input className="input" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="121.0244" /></div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!qrOpen}
        onClose={() => setQrOpen(null)}
        title={qrOpen?.name || 'Checkpoint QR'}
        eyebrow="Printable QR"
        description="Use this code at the physical checkpoint location."
        footer={<button className="btn-primary" onClick={() => window.print()}>Print</button>}
      >
        {qrOpen && (
          <div className="text-center">
            <div className="inline-block rounded-lg border border-slate-200 bg-white p-4">
              <QRCodeSVG value={qrOpen.qrCode} size={220} />
            </div>
            <div className="mt-4 font-mono text-sm text-slate-700">{qrOpen.qrCode}</div>
            <p className="mt-2 text-xs text-slate-500">Print and mount this QR code at <b>{qrOpen.name}</b>. Guards scan it from the Android app to log a patrol visit.</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
