import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { addItem, removeItem, subscribeCollection } from '../lib/dataSource';

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [sites, setSites] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', siteId: '', checkpoints: [] });

  useEffect(() => {
    const u1 = subscribeCollection('routes', setRoutes);
    const u2 = subscribeCollection('sites', setSites);
    const u3 = subscribeCollection('checkpoints', setCheckpoints);
    return () => { u1(); u2(); u3(); };
  }, []);

  const save = async () => {
    if (!form.name || !form.siteId || form.checkpoints.length === 0) return;
    await addItem('routes', form);
    setForm({ name: '', siteId: '', checkpoints: [] });
    setOpen(false);
  };

  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.name]));
  const cpMap = Object.fromEntries(checkpoints.map((c) => [c.id, c.name]));
  const siteCheckpoints = checkpoints.filter((c) => c.siteId === form.siteId);

  const toggleCp = (id) => {
    setForm((f) => ({
      ...f,
      checkpoints: f.checkpoints.includes(id)
        ? f.checkpoints.filter((x) => x !== id)
        : [...f.checkpoints, id]
    }));
  };

  return (
    <Layout
      title="Patrol Routes"
      subtitle="Ordered sequences of checkpoints guards must visit"
      actions={<button className="btn-primary" onClick={() => setOpen(true)}>Create Route</button>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {routes.map((r) => (
          <div key={r.id} className="card border-cyan-100 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-950">{r.name}</h3>
                <div className="mt-1 text-xs text-slate-500">Site: {siteMap[r.siteId]}</div>
              </div>
              <span className="badge-off">{r.checkpoints?.length || 0} stops</span>
            </div>
            <ol className="space-y-2">
              {(r.checkpoints || []).map((cpId, i) => (
                <li key={cpId} className="flex items-center gap-2 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-cyan-50 text-xs font-semibold text-cyan-800 ring-1 ring-inset ring-cyan-100">{i + 1}</span>
                  <span className="text-slate-700">{cpMap[cpId] || cpId}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => { if (confirm(`Delete route ${r.name}?`)) removeItem('routes', r.id); }} className="mt-4 text-xs font-medium text-rose-600 hover:text-rose-800">Delete route</button>
          </div>
        ))}
        {routes.length === 0 && <div className="card col-span-full p-8 text-center text-slate-400">No routes yet.</div>}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Patrol Route"
        footer={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>Create Route</button>
        </>}
      >
        <label className="label">Route Name</label>
        <input className="input mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Night Perimeter Sweep" />
        <label className="label">Site</label>
        <select className="input mb-3" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value, checkpoints: [] })}>
          <option value="">Select site...</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {form.siteId && (
          <>
            <label className="label">Checkpoints in visit order</label>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-3">
              {siteCheckpoints.length === 0 && <div className="text-xs text-slate-400">No checkpoints at this site yet.</div>}
              {siteCheckpoints.map((c) => {
                const idx = form.checkpoints.indexOf(c.id);
                return (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-50">
                    <input type="checkbox" checked={idx >= 0} onChange={() => toggleCp(c.id)} />
                    <span className="flex-1 text-sm">{c.name}</span>
                    {idx >= 0 && <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-800 ring-1 ring-inset ring-cyan-100">#{idx + 1}</span>}
                  </label>
                );
              })}
            </div>
          </>
        )}
      </Modal>
    </Layout>
  );
}
