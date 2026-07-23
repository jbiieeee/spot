import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { addItem, removeItem, subscribeCollection, updateItem } from '../lib/dataSource';

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', description: '' });

  useEffect(() => {
    return subscribeCollection('sites', setSites);
  }, []);

  const openNew = () => {
    setEditingSite(null);
    setForm({ name: '', location: '', description: '' });
    setOpen(true);
  };

  const openEdit = (site) => {
    setEditingSite(site);
    setForm({ name: site.name, location: site.location || '', description: site.description || '' });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name) return;
    if (editingSite) {
      await updateItem('sites', editingSite.id, form);
    } else {
      await addItem('sites', form);
    }
    setOpen(false);
  };

  const remove = async (id, name) => {
    if (confirm(`Delete site ${name}?`)) {
      await removeItem('sites', id);
    }
  };

  return (
    <Layout
      title="Sites Management"
      subtitle="Manage your geographical patrol locations"
      actions={<button className="btn-create" onClick={openNew}><span className="btn-icon">+</span>Add Site</button>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div key={site.id} className="card border-cyan-100 p-5">
            <h3 className="font-semibold text-slate-950 truncate">{site.name}</h3>
            {site.location && <div className="text-xs text-slate-500 mt-1 truncate">{site.location}</div>}
            {site.description && <p className="text-sm text-slate-700 mt-3 line-clamp-2">{site.description}</p>}
            
            <div className="mt-4 flex gap-2">
              <button className="btn-ghost flex-1 justify-center text-xs" onClick={() => openEdit(site)}>Edit</button>
              <button className="btn-ghost text-xs text-rose-600" onClick={() => remove(site.id, site.name)}>Delete</button>
            </div>
          </div>
        ))}
        {sites.length === 0 && (
          <div className="card col-span-full p-8 text-center text-slate-400">No sites yet.</div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingSite ? "Edit Site" : "Add New Site"}
        eyebrow="Site Setup"
        description="Define a new operational site where patrols will take place."
        footer={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-create" onClick={save}>{editingSite ? 'Save Changes' : <><span className="btn-icon">+</span>Create Site</>}</button>
        </>}
      >
        <div className="form-grid">
          <div className="field">
            <label className="label">Site Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Corporate Campus" />
          </div>
          <div className="field">
            <label className="label">Location (Optional)</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. 123 Main St" />
          </div>
          <div className="field">
            <label className="label">Description (Optional)</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any notes about this site..."></textarea>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
