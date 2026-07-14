import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { addItem, subscribeCollection } from '../lib/dataSource';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, toMillis } from '../lib/time';

export default function Incidents() {
  const { user, profile } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [guards, setGuards] = useState([]);
  const [sites, setSites] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    const u1 = subscribeCollection('incidents', setIncidents);
    const u2 = subscribeCollection('users', setGuards);
    const u3 = subscribeCollection('sites', setSites);
    const u4 = subscribeCollection('approvalRequests', setApprovals);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const guardMap = Object.fromEntries(guards.map((g) => [g.id, g.name]));
  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.name]));

  const pendingByIncident = Object.fromEntries(
    approvals
      .filter((a) => a.targetCollection === 'incidents' && a.status !== 'approved')
      .map((a) => [a.targetId, a])
  );

  const filtered = incidents
    .filter((i) => filter === 'all' || (filter === 'open' ? !i.resolved : i.resolved))
    .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

  const requestResolve = async (incident) => {
    if (pendingByIncident[incident.id]) return;

    await addItem('approvalRequests', {
      type: 'report_change',
      targetCollection: 'incidents',
      targetId: incident.id,
      requestedChange: { resolved: true, resolvedAt: Date.now() },
      requestedBy: user.uid,
      requestedByName: profile?.name || user.email,
      approvals: [user.uid],
      status: 'pending',
      summary: `Resolve incident: ${incident.type || incident.id}`,
      reason: 'Supervisor requested incident resolution. Requires 3 supervisor approvals including requester.'
    });

    await addItem('auditLogs', {
      actorId: user.uid,
      actorName: profile?.name || user.email,
      action: 'requested_report_change',
      targetCollection: 'incidents',
      targetId: incident.id
    });
  };

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
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Report modifications are approval-controlled. Resolving an incident creates a request that needs 3 supervisor approvals.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((i) => {
          const pending = pendingByIncident[i.id];
          return (
            <div key={i.id} className={`card p-5 ${i.resolved ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-950">{i.type}</h3>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatDateTime(i.timestamp)} / {siteMap[i.siteId] || 'Unknown site'}
                  </div>
                </div>
                {i.resolved
                  ? <span className="badge-ok">Resolved</span>
                  : pending
                    ? <span className="badge-warn">Approval pending</span>
                    : <span className="badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">Open</span>}
              </div>
              <p className="mb-4 text-sm text-slate-700">{i.description}</p>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">Reported by <b className="text-slate-700">{guardMap[i.guardId] || '-'}</b></div>
                {!i.resolved && (
                  <button onClick={() => requestResolve(i)} className="btn-ghost text-xs" disabled={!!pending}>
                    {pending ? 'Waiting Approval' : 'Request Resolve'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card col-span-full p-8 text-center text-slate-400">No {filter} incidents.</div>
        )}
      </div>
    </Layout>
  );
}
