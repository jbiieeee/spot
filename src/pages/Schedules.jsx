import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { addItem, removeItem, subscribeCollection } from '../lib/dataSource';

const fmt = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [guards, setGuards] = useState([]);
  const [sites, setSites] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ guardId: '', siteId: '', routeId: '', startTime: '', endTime: '' });

  useEffect(() => {
    const u1 = subscribeCollection('schedules', setSchedules);
    const u2 = subscribeCollection('users', setGuards);
    const u3 = subscribeCollection('sites', setSites);
    const u4 = subscribeCollection('routes', setRoutes);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const save = async () => {
    if (!form.guardId || !form.siteId || !form.routeId || !form.startTime || !form.endTime) return;
    await addItem('schedules', form);
    setForm({ guardId: '', siteId: '', routeId: '', startTime: '', endTime: '' });
    setOpen(false);
  };

  const guardMap = Object.fromEntries(guards.map((g) => [g.id, g.name]));
  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.name]));
  const routeMap = Object.fromEntries(routes.map((r) => [r.id, r.name]));
  const siteRoutes = routes.filter((r) => r.siteId === form.siteId);

  // Get current datetime string in ISO format for min attribute (YYYY-MM-DDThh:mm)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const currentDateTime = now.toISOString().slice(0, 16);

  return (
    <Layout
      title="Schedules"
      subtitle="Assign guards to sites, routes, and shifts"
      actions={<button className="btn-create" onClick={() => setOpen(true)}><span className="btn-icon">+</span>New Schedule</button>}
    >
      <div className="card border-cyan-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Guard</th>
              <th className="th">Site</th>
              <th className="th">Route</th>
              <th className="th">Start</th>
              <th className="th">End</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-slate-50">
                <td className="td font-medium text-slate-950">{guardMap[s.guardId] || '-'}</td>
                <td className="td">{siteMap[s.siteId] || '-'}</td>
                <td className="td">{routeMap[s.routeId] || '-'}</td>
                <td className="td">{fmt(s.startTime)}</td>
                <td className="td">{fmt(s.endTime)}</td>
                <td className="td text-right">
                  <button className="text-xs font-medium text-rose-600 hover:text-rose-800" onClick={() => { if (confirm('Remove schedule?')) removeItem('schedules', s.id); }}>Delete</button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && <tr><td colSpan="6" className="td py-8 text-center text-slate-400">No schedules yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Schedule"
        eyebrow="Shift Transaction"
        description="Assign a guard to a specific site and patrol route within an active window."
        footer={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-create" onClick={save}><span className="btn-icon">+</span>Save Schedule</button>
        </>}
      >
        <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50/70 p-3">
          <div className="text-sm font-semibold text-amber-950">Shift assignment</div>
          <p className="mt-1 text-xs text-amber-800">Schedules appear in realtime once saved and can be used by the guard app for assignments.</p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="label">Guard</label>
            <select className="input" value={form.guardId} onChange={(e) => setForm({ ...form, guardId: e.target.value })}>
              <option value="">Select guard...</option>
              {guards.filter((g) => g.role !== 'supervisor').map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field">
              <label className="label">Site</label>
              <select className="input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value, routeId: '' })}>
                <option value="">Select site...</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Route</label>
              <select className="input" value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} disabled={!form.siteId}>
                <option value="">Select route...</option>
                {siteRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="field">
              <label className="label">Start</label>
              <input className="input" type="datetime-local" min={currentDateTime} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">End</label>
              <input className="input" type="datetime-local" min={form.startTime || currentDateTime} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
