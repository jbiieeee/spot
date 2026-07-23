import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { subscribeCollection } from '../lib/dataSource';

const fmt = (ts) => new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' });

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    const u1 = subscribeCollection('adminLogs', setLogs);
    const u2 = subscribeCollection('users', setUsers);
    return () => { u1(); u2(); };
  }, []);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name || u.email]));

  const filtered = useMemo(() => {
    return [...logs]
      .filter((l) => !filterUser || l.userId === filterUser)
      .filter((l) => !filterAction || l.action === filterAction)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, filterUser, filterAction]);

  const exportCSV = () => {
    const rows = [['Timestamp', 'User', 'Action', 'Target Collection', 'Target ID', 'Details']];
    filtered.forEach((l) => rows.push([
      fmt(l.timestamp), 
      userMap[l.userId] || l.userId || 'System', 
      l.action, 
      l.collection,
      l.targetId,
      JSON.stringify(l.details || {})
    ]));
    const csv = rows.map((r) => r.map((c) => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actions = [...new Set(logs.map(l => l.action))];

  return (
    <Layout
      title="Admin Activity Logs"
      subtitle="System audit trail of administrative actions"
      actions={<button className="btn-ghost" onClick={exportCSV}>Export CSV</button>}
    >
      <div className="card mb-4 flex flex-wrap gap-3 border-cyan-100 bg-cyan-50/30 p-4">
        <select className="input max-w-xs" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
          <option value="">All users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
        <select className="input max-w-xs" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
          <option value="">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="self-center text-sm text-slate-500 sm:ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Timestamp</th>
              <th className="th">User</th>
              <th className="th">Action</th>
              <th className="th">Target</th>
              <th className="th">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-slate-50">
                <td className="td whitespace-nowrap font-mono text-xs">{fmt(l.timestamp)}</td>
                <td className="td font-medium text-slate-950">{userMap[l.userId] || l.userId || 'System'}</td>
                <td className="td">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    l.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                    l.action === 'UPDATE' ? 'bg-amber-100 text-amber-800' :
                    l.action === 'DELETE' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {l.action}
                  </span>
                </td>
                <td className="td text-xs text-slate-600">
                  <span className="font-semibold">{l.collection}</span> ({l.targetId})
                </td>
                <td className="td font-mono text-[10px] text-slate-500 max-w-xs truncate" title={JSON.stringify(l.details)}>
                  {JSON.stringify(l.details)}
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
