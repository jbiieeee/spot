import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { addItem, removeItem, subscribeCollection, updateItem } from '../lib/dataSource';

export default function Guards() {
  const [guards, setGuards] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', deviceId: '', active: true });
  const [query, setQuery] = useState('');

  useEffect(() => subscribeCollection('users', setGuards), []);

  const save = async () => {
    if (!form.name || !form.email) return;
    await addItem('users', { ...form, role: 'guard' });
    setForm({ name: '', email: '', deviceId: '', active: true });
    setOpen(false);
  };

  const toggle = async (g) => updateItem('users', g.id, { active: !g.active });
  const unbind = async (g) => updateItem('users', g.id, { deviceId: null });
  const del = async (g) => { if (confirm(`Delete ${g.name}?`)) removeItem('users', g.id); };

  const filtered = guards.filter((g) =>
    (g.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout
      title="Guards"
      subtitle="Manage patrol officers and their device bindings"
      actions={<button className="btn-primary" onClick={() => setOpen(true)}>Add Guard</button>}
    >
      <div className="card">
        <div className="border-b border-slate-200 p-4">
          <input className="input max-w-sm" placeholder="Search by name or email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Bound Device</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="transition-colors hover:bg-slate-50">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                        {g.name?.[0] || '?'}
                      </div>
                      <span className="font-medium text-slate-950">{g.name}</span>
                    </div>
                  </td>
                  <td className="td">{g.email}</td>
                  <td className="td">
                    {g.deviceId
                      ? <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{g.deviceId}</span>
                      : <span className="text-xs text-slate-400">Not bound</span>}
                  </td>
                  <td className="td">
                    {g.active ? <span className="badge-ok">Active</span> : <span className="badge-off">Inactive</span>}
                  </td>
                  <td className="td space-x-3 text-right">
                    <button onClick={() => toggle(g)} className="text-xs font-medium text-slate-600 hover:text-slate-950">{g.active ? 'Deactivate' : 'Activate'}</button>
                    {g.deviceId && <button onClick={() => unbind(g)} className="text-xs font-medium text-amber-700 hover:text-amber-900">Unbind</button>}
                    <button onClick={() => del(g)} className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="td py-8 text-center text-slate-400">No guards found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add New Guard"
        footer={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>Create Guard</button>
        </>}
      >
        <label className="label">Full Name</label>
        <input className="input mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label className="label">Email</label>
        <input className="input mb-3" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="label">Initial Device ID <span className="font-normal text-slate-400">(optional, auto-set on first login)</span></label>
        <input className="input" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} />
      </Modal>
    </Layout>
  );
}
