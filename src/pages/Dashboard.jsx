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

function OperationsPanel({ activeGuards, totalGuards, todaysLogs, openIncidents, checkpoints, sites }) {
  const guardCoverage = totalGuards ? Math.round((activeGuards / totalGuards) * 100) : 0;
  const checkpointCoverage = checkpoints ? Math.min(100, Math.round((todaysLogs / Math.max(checkpoints, 1)) * 100)) : 0;
  const risk = openIncidents > 0 ? 'Elevated' : 'Nominal';

  return (
    <div className="card overflow-hidden border-cyan-100">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Operations Health</h3>
            <p className="text-xs text-slate-400">Live readiness and patrol coverage</p>
          </div>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${openIncidents > 0 ? 'bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20' : 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20'}`}>
            {risk}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <ProgressRow label="Guard coverage" value={guardCoverage} tone="emerald" />
        <ProgressRow label="Checkpoint activity" value={checkpointCoverage} tone="cyan" />
        <div className="grid grid-cols-3 gap-3 pt-1 text-center">
          <MiniMetric label="Sites" value={sites} />
          <MiniMetric label="Points" value={checkpoints} />
          <MiniMetric label="Alerts" value={openIncidents} alert={openIncidents > 0} />
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, tone }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-slate-950">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-100">
        <div className={`h-full rounded ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, alert = false }) {
  return (
    <div className={`rounded-lg border px-3 py-3 ${alert ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] uppercase">{label}</div>
    </div>
  );
}

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return Number(value) || 0;
};

const timeAgo = (ts) => {
  const s = Math.max(0, Math.floor((Date.now() - toMillis(ts)) / 1000));
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
  const todaysLogs = logs.filter((l) => Date.now() - toMillis(l.timestamp) < 24 * 3600 * 1000);
  const openIncidents = incidents.filter((i) => !i.resolved).length;

  const recentLogs = useMemo(() =>
    [...logs].sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp)).slice(0, 8)
  , [logs]);

  const guardMap = Object.fromEntries(guards.map((g) => [g.id, g.name]));
  const cpMap = Object.fromEntries(checkpoints.map((c) => [c.id, c.name]));

  return (
    <Layout title="Dashboard" subtitle="Real-time overview of patrol operations">
      <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active Guards" value={activeGuards} sub={`of ${guards.length} total`} />
        <Stat label="Patrols Today" value={todaysLogs.length} sub="checkpoint scans" tone="emerald" />
        <Stat label="Open Incidents" value={openIncidents} sub="require attention" tone="rose" />
        <Stat label="Sites Monitored" value={sites.length} sub={`${checkpoints.length} checkpoints`} tone="amber" />
      </div>

      <div>
        <OperationsPanel
          activeGuards={activeGuards}
          totalGuards={guards.length}
          todaysLogs={todaysLogs.length}
          openIncidents={openIncidents}
          checkpoints={checkpoints.length}
          sites={sites.length}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card flex min-h-[360px] flex-col lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-cyan-500" />
              <h3 className="font-semibold text-slate-950">Recent Patrol Activity</h3>
            </div>
            <p className="text-xs text-slate-500">Latest checkpoint scans from the field</p>
          </div>
          <div className="scroll-invisible min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto lg:max-h-[44vh]">
            {recentLogs.length === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-lg border border-dashed border-cyan-200 bg-cyan-50" />
                <div className="text-sm font-medium text-slate-600">No patrol activity yet</div>
                <div className="mt-1 text-xs text-slate-400">New checkpoint scans will stream into this panel.</div>
              </div>
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

        <div className="card flex min-h-[360px] flex-col">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-emerald-500" />
              <h3 className="font-semibold text-slate-950">Guards On Duty</h3>
            </div>
          </div>
          <div className="scroll-invisible min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto lg:max-h-[44vh]">
            {guards.filter((g) => g.active).length === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-lg border border-dashed border-emerald-200 bg-emerald-50" />
                <div className="text-sm font-medium text-slate-600">No guards on duty</div>
                <div className="mt-1 text-xs text-slate-400">Active personnel will appear here.</div>
              </div>
            )}
            {guards.filter((g) => g.active).map((g) => (
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
      </div>
    </Layout>
  );
}
