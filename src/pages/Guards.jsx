import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { addItem, removeItem, setItem, subscribeCollection, updateItem } from '../lib/dataSource';

const initialForm = { name: '', email: '', deviceId: '', active: true, role: 'guard', authUid: '' };

export default function Guards() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => subscribeCollection('users', setUsers), []);

  const resetForm = () => {
    setForm(initialForm);
    setFormError('');
  };

  const save = async () => {
    setFormError('');
    if (!form.name || !form.email) {
      setFormError('Name and email are required.');
      return;
    }

    if (form.role === 'supervisor' && !form.authUid.trim()) {
      setFormError('Supervisor profiles need the Firebase Auth UID so login can match users/{uid}.');
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      active: form.active,
      deviceId: form.role === 'guard' ? (form.deviceId || null) : null
    };

    if (form.authUid.trim()) {
      await setItem('users', form.authUid.trim(), payload);
    } else {
      await addItem('users', payload);
    }

    resetForm();
    setOpen(false);
  };

  const toggle = async (g) => updateItem('users', g.id, { active: !g.active });
  const unbind = async (g) => updateItem('users', g.id, { deviceId: null });
  const del = async (g) => { if (confirm(`Delete ${g.name}?`)) removeItem('users', g.id); };

  const filtered = users.filter((g) =>
    (g.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(query.toLowerCase()) ||
    (g.role || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout
      title="Personnel"
      subtitle="Manage guards, supervisors, access roles, and device bindings"
      actions={<button className="btn-create" onClick={() => setOpen(true)}><span className="btn-icon">+</span>Add Personnel</button>}
    >
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input className="input max-w-sm" placeholder="Search by name, email, or role..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="text-xs text-slate-500">{filtered.length} record{filtered.length === 1 ? '' : 's'}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Device / Access</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="transition-colors hover:bg-slate-50">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-8 w-8 place-items-center rounded-md text-sm font-semibold ${g.role === 'supervisor' ? 'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100' : 'bg-slate-100 text-slate-700'}`}>
                        {g.name?.[0] || '?'}
                      </div>
                      <span className="font-medium text-slate-950">{g.name}</span>
                    </div>
                  </td>
                  <td className="td">{g.email}</td>
                  <td className="td">
                    {g.role === 'supervisor'
                      ? <span className="badge bg-cyan-50 text-cyan-800 ring-1 ring-inset ring-cyan-100">Supervisor</span>
                      : <span className="badge-off">Guard</span>}
                  </td>
                  <td className="td">
                    {g.role === 'supervisor'
                      ? <span className="text-xs text-cyan-700">Command access</span>
                      : g.deviceId
                        ? <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{g.deviceId}</span>
                        : <span className="text-xs text-slate-400">Not bound</span>}
                  </td>
                  <td className="td">
                    {g.active ? <span className="badge-ok">Active</span> : <span className="badge-off">Inactive</span>}
                  </td>
                  <td className="td space-x-3 text-right">
                    <button onClick={() => toggle(g)} className="text-xs font-medium text-slate-600 hover:text-slate-950">{g.active ? 'Deactivate' : 'Activate'}</button>
                    {g.role !== 'supervisor' && g.deviceId && <button onClick={() => unbind(g)} className="text-xs font-medium text-amber-700 hover:text-amber-900">Unbind</button>}
                    <button onClick={() => del(g)} className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="td py-8 text-center text-slate-400">No personnel found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm(); }}
        title="Add Personnel"
        eyebrow="Access Transaction"
        description="Create a guard profile or register another supervisor profile for command center access."
        footer={<>
          <button className="btn-ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancel</button>
          <button className="btn-create" onClick={save}><span className="btn-icon">+</span>Create {form.role === 'supervisor' ? 'Supervisor' : 'Guard'}</button>
        </>}
      >
        <div className="mb-4 rounded-lg border border-cyan-100 bg-cyan-50/70 p-3">
          <div className="text-sm font-semibold text-cyan-950">Personnel access profile</div>
          <p className="mt-1 text-xs text-cyan-800">For supervisors, first create the Firebase Auth account, then paste that account UID here.</p>
        </div>

        {formError && <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-600">{formError}</div>}

        <div className="form-grid">
          <div className="field">
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {['guard', 'supervisor'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role, deviceId: role === 'supervisor' ? '' : form.deviceId })}
                  className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${form.role === role ? 'border-cyan-500 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field">
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maria Santos" />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="person@company.com" />
            </div>
          </div>

          <div className="field">
            <label className="label">Firebase Auth UID {form.role === 'supervisor' && <span className="text-rose-500">*</span>}</label>
            <input className="input font-mono" value={form.authUid} onChange={(e) => setForm({ ...form, authUid: e.target.value })} placeholder="Paste UID from Firebase Authentication" />
            <p className="field-hint">Using the UID creates the profile at <code className="rounded bg-slate-200 px-1">users/uid</code>, which login requires.</p>
          </div>

          {form.role === 'guard' && (
            <div className="field">
              <label className="label">Initial Device ID <span className="font-normal text-slate-400">(optional)</span></label>
              <input className="input" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} placeholder="Auto-set on first login" />
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
