import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { subscribeCollection } from '../lib/dataSource';

const fmt = (ts) => new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' });

export default function PatrolLogs() {
  const [logs, setLogs] = useState([]);
  const [guards, setGuards] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [filterGuard, setFilterGuard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const u1 = subscribeCollection('patrolLogs', setLogs);
    const u2 = subscribeCollection('users', setGuards);
    const u3 = subscribeCollection('checkpoints', setCheckpoints);
    return () => { u1(); u2(); u3(); };
  }, []);

  const guardMap = Object.fromEntries(guards.map((g) => [g.id, g.name]));
  const cpMap = Object.fromEntries(checkpoints.map((c) => [c.id, c.name]));

  const filtered = useMemo(() => {
    return [...logs]
      .filter((l) => !filterGuard || l.guardId === filterGuard)
      .filter((l) => !filterStatus || l.status === filterStatus)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, filterGuard, filterStatus]);

  const exportCSV = () => {
    const rows = [['Timestamp', 'Guard', 'Checkpoint', 'Lat', 'Lng', 'Status']];
    filtered.forEach((l) => rows.push([fmt(l.timestamp), guardMap[l.guardId] || '', cpMap[l.checkpointId] || '', l.lat, l.lng, l.status]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patrol-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout
      title="Patrol Logs"
      subtitle="Real-time feed of checkpoint scans from the field"
      actions={<button className="btn-ghost" onClick={exportCSV}>Export CSV</button>}
    >
      <div className="card mb-4 flex flex-wrap gap-3 border-cyan-100 bg-cyan-50/30 p-4">
        <select className="input max-w-xs" value={filterGuard} onChange={(e) => setFilterGuard(e.target.value)}>
          <option value="">All guards</option>
          {guards.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select className="input max-w-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ok">On time</option>
          <option value="late">Late</option>
        </select>
        <div className="self-center text-sm text-slate-500 sm:ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Timestamp</th>
              <th className="th">Guard</th>
              <th className="th">Checkpoint</th>
              <th className="th">Location</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-slate-50">
                <td className="td whitespace-nowrap font-mono text-xs">{fmt(l.timestamp)}</td>
                <td className="td font-medium text-slate-950">{guardMap[l.guardId] || '-'}</td>
                <td className="td">{cpMap[l.checkpointId] || '-'}</td>
                <td className="td font-mono text-xs text-slate-500">{l.lat?.toFixed?.(4)}, {l.lng?.toFixed?.(4)}</td>
                <td className="td">
                  {l.status === 'late' ? <span className="badge-warn">Late</span> : <span className="badge-ok">On time</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="td py-8 text-center text-slate-400">No logs match your filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
