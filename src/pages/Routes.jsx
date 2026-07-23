import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { addItem, removeItem, subscribeCollection } from '../lib/dataSource';

// Fix for default Leaflet markers in React
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

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
  const siteCheckpoints = checkpoints.filter((c) => c.siteId === form.siteId && typeof c.lat === 'number' && typeof c.lng === 'number');

  const toggleCp = (id) => {
    setForm((f) => ({
      ...f,
      checkpoints: f.checkpoints.includes(id)
        ? f.checkpoints.filter((x) => x !== id)
        : [...f.checkpoints, id]
    }));
  };

  // Calculate map center based on site checkpoints
  const mapCenter = useMemo(() => {
    if (siteCheckpoints.length === 0) return [14.5547, 121.0244]; // Default fallback
    const lats = siteCheckpoints.map(c => c.lat);
    const lngs = siteCheckpoints.map(c => c.lng);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    ];
  }, [siteCheckpoints]);

  // Coordinates for the selected polyline
  const routeLineCoords = form.checkpoints
    .map(id => checkpoints.find(c => c.id === id))
    .filter(Boolean)
    .map(c => [c.lat, c.lng]);

  return (
    <Layout
      title="Patrol Routes"
      subtitle="Ordered sequences of checkpoints guards must visit"
      actions={<button className="btn-create" onClick={() => setOpen(true)}><span className="btn-icon">+</span>Create Route</button>}
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
        eyebrow="Route Builder"
        description="Build the ordered checkpoint sequence guards will follow during patrols using the map."
        size="3xl"
        footer={<>
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-create" onClick={save}><span className="btn-icon">+</span>Create Route</button>
        </>}
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
            <div className="text-sm font-semibold text-indigo-950">Map Builder</div>
            <p className="mt-1 text-xs text-indigo-800">Click the map pins below to sequentially build your route line.</p>
          </div>
          <div className="rounded-lg border border-cyan-100 bg-cyan-50/70 p-3">
            <div className="text-sm font-semibold text-cyan-950">{form.checkpoints.length} selected</div>
            <p className="mt-1 text-xs text-cyan-800">Choose at least one checkpoint to create the route.</p>
          </div>
        </div>

        <div className="form-grid mb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field">
              <label className="label">Route Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Night Perimeter Sweep" />
            </div>
            <div className="field">
              <label className="label">Site</label>
              <select className="input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value, checkpoints: [] })}>
                <option value="">Select site...</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {form.siteId && (
          <div className="h-[400px] rounded-lg overflow-hidden border border-slate-200">
            {siteCheckpoints.length === 0 ? (
              <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
                No checkpoints with valid coordinates found at this site. Add some in the Checkpoints tab first.
              </div>
            ) : (
              <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {siteCheckpoints.map((c) => {
                  const idx = form.checkpoints.indexOf(c.id);
                  const isSelected = idx >= 0;
                  return (
                    <Marker 
                      key={c.id} 
                      position={[c.lat, c.lng]}
                      eventHandlers={{
                        click: () => toggleCp(c.id)
                      }}
                    >
                      <Popup>
                        <div className="font-semibold">{c.name}</div>
                        {isSelected ? (
                          <div className="mt-1 text-xs text-indigo-600 font-bold">Stop #{idx + 1}</div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-500">Click to add to route</div>
                        )}
                      </Popup>
                    </Marker>
                  );
                })}

                {routeLineCoords.length > 1 && (
                  <Polyline 
                    positions={routeLineCoords}
                    color="#4f46e5" 
                    weight={4}
                    opacity={0.8}
                    dashArray="10, 10"
                  />
                )}
              </MapContainer>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
