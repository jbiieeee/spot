import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { subscribeCollection } from '../lib/dataSource';

function Stat({ label, value, sub, tone = 'slate' }) {
  const tones = {
    slate: 'bg-cyan-700',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };
  const panels = {
    slate: 'border-cyan-200 bg-cyan-50/40',
    emerald: 'border-emerald-200 bg-emerald-50/40',
    amber: 'border-amber-200 bg-amber-50/40',
    rose: 'border-rose-200 bg-rose-50/40'
  };

  return (
    <div className={`card p-5 ${panels[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
        </div>
        <span className={`h-2.5 w-2.5 rounded-sm ${tones[tone]}`} />
      </div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

export default function Dashboard() {
  const [guards, setGuards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    const u1 = subscribeCollection('users', setGuards);
    const u2 = subscribeCollection('patrolLogs', setLogs);
    const u3 = subscribeCollection('incidents', setIncidents);
    const u4 = subscribeCollection('checkpoints', setCheckpoints);
    const u5 = subscribeCollection('sites', setSites);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  const activeGuards = guards.filter((g) => g.active).length;
  const todaysLogs = logs.filter((l) => Date.now() - l.timestamp < 24 * 3600 * 1000);
  const openIncidents = incidents.filter((i) => !i.resolved).length;

  const recentLogs = useMemo(() =>
    [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8)
  , [logs]);

  const guardMap = Object.fromEntries(guards.map((g) => [g.id, g.name]));
  const cpMap = Object.fromEntries(checkpoints.map((c) => [c.id, c.name]));

  return (
    <Layout title="Dashboard" subtitle="Real-time overview of patrol operations">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active Guards" value={activeGuards} sub={`of ${guards.length} total`} />
        <Stat label="Patrols Today" value={todaysLogs.length} sub="checkpoint scans" tone="emerald" />
        <Stat label="Open Incidents" value={openIncidents} sub="require attention" tone="rose" />
        <Stat label="Sites Monitored" value={sites.length} sub={`${checkpoints.length} checkpoints`} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-cyan-500" />
              <h3 className="font-semibold text-slate-950">Recent Patrol Activity</h3>
            </div>
            <p className="text-xs text-slate-500">Latest checkpoint scans from the field</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLogs.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-400">No activity yet.</div>
            )}
            {recentLogs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-slate-50">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`h-2 w-2 rounded-sm ${l.status === 'late' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-950">{guardMap[l.guardId] || 'Unknown Guard'}</div>
                    <div className="truncate text-xs text-slate-500">Scanned <b className="text-cyan-800">{cpMap[l.checkpointId] || l.checkpointId}</b></div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {l.status === 'late'
                    ? <span className="badge-warn">Late</span>
                    : <span className="badge-ok">On time</span>}
                  <div className="mt-1 text-xs text-slate-400">{timeAgo(l.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-emerald-500" />
              <h3 className="font-semibold text-slate-950">Guards On Duty</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {guards.filter((g) => g.active).slice(0, 6).map((g) => (
              <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-50 text-sm font-semibold text-cyan-800 ring-1 ring-inset ring-cyan-100">
                  {g.name?.[0] || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-950">{g.name}</div>
                  <div className="text-xs text-slate-500">{g.deviceId ? `Device ${g.deviceId}` : 'No device bound'}</div>
                </div>
                <span className="badge-ok">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
