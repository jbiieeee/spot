import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { subscribeCollection, updateItem } from '../lib/dataSource';

const fmt = (ts) => new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [guards, setGuards] = useState([]);
  const [sites, setSites] = useState([]);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    const u1 = subscribeCollection('incidents', setIncidents);
    const u2 = subscribeCollection('users', setGuards);
    const u3 = subscribeCollection('sites', setSites);
    return () => { u1(); u2(); u3(); };
  }, []);

  const guardMap = Object.fromEntries(guards.map((g) => [g.id, g.name]));
  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.name]));

  const filtered = incidents
    .filter((i) => filter === 'all' || (filter === 'open' ? !i.resolved : i.resolved))
    .sort((a, b) => b.timestamp - a.timestamp);

  const resolve = (i) => updateItem('incidents', i.id, { resolved: true });

  return (
    <Layout
      title="Incidents"
      subtitle="Reports filed by guards during patrols"
      actions={
        <div className="flex gap-1 rounded-md border border-cyan-100 bg-cyan-50 p-1">
          {['open', 'resolved', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-cyan-700 text-white' : 'text-cyan-900 hover:bg-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((i) => (
          <div key={i.id} className={`card p-5 ${i.resolved ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-950">{i.type}</h3>
                <div className="mt-1 text-xs text-slate-500">
                  {fmt(i.timestamp)} / {siteMap[i.siteId] || 'Unknown site'}
                </div>
              </div>
              {i.resolved
                ? <span className="badge-ok">Resolved</span>
                : <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">Open</span>}
            </div>
            <p className="mb-4 text-sm text-slate-700">{i.description}</p>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">Reported by <b className="text-slate-700">{guardMap[i.guardId] || '-'}</b></div>
              {!i.resolved && <button onClick={() => resolve(i)} className="btn-ghost text-xs">Mark Resolved</button>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card col-span-full p-8 text-center text-slate-400">No {filter} incidents.</div>
        )}
      </div>
    </Layout>
  );
}
