import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { subscribeCollection } from '../lib/dataSource';
import { formatDateTime, timeAgo, toMillis } from '../lib/time';

export default function GuardTracking() {
  const [guards, setGuards] = useState([]);
  const [locations, setLocations] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedGuard, setSelectedGuard] = useState('');

  useEffect(() => {
    const u1 = subscribeCollection('users', setGuards);
    const u2 = subscribeCollection('guardLocations', setLocations);
    const u3 = subscribeCollection('locationHistory', setHistory);
    return () => { u1(); u2(); u3(); };
  }, []);

  const guardMap = Object.fromEntries(guards.map((g) => [g.id, g.name]));
  const activeGuards = guards.filter((g) => g.role !== 'supervisor');

  const latestByGuard = useMemo(() => {
    const rows = [...locations, ...history].sort((a, b) => toMillis(b.timestamp || b.createdAt) - toMillis(a.timestamp || a.createdAt));
    const map = new Map();
    rows.forEach((row) => {
      if (row.guardId && !map.has(row.guardId)) map.set(row.guardId, row);
    });
    return [...map.entries()].map(([guardId, row]) => ({ guardId, ...row }));
  }, [locations, history]);

  const filteredHistory = useMemo(() => {
    return [...history]
      .filter((row) => !selectedGuard || row.guardId === selectedGuard)
      .sort((a, b) => toMillis(b.timestamp || b.createdAt) - toMillis(a.timestamp || a.createdAt));
  }, [history, selectedGuard]);

  return (
    <Layout
      title="Guard Tracking"
      subtitle="Live guard location snapshots and full location history"
      actions={
        <select className="input max-w-xs" value={selectedGuard} onChange={(e) => setSelectedGuard(e.target.value)}>
          <option value="">All guards</option>
          {activeGuards.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card border-cyan-100 bg-cyan-50/40 p-5">
          <div className="text-xs font-semibold uppercase text-cyan-800">Tracked Guards</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{latestByGuard.length}</div>
          <div className="mt-1 text-xs text-slate-500">with recent location records</div>
        </div>
        <div className="card border-emerald-100 bg-emerald-50/40 p-5">
          <div className="text-xs font-semibold uppercase text-emerald-800">History Points</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{history.length}</div>
          <div className="mt-1 text-xs text-slate-500">stored movement records</div>
        </div>
        <div className="card border-amber-100 bg-amber-50/40 p-5">
          <div className="text-xs font-semibold uppercase text-amber-800">Collection</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">locationHistory</div>
          <div className="mt-1 text-xs text-slate-500">guard app writes every movement point here</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {latestByGuard.map((row) => (
          <div key={row.guardId} className="card border-cyan-100 p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-950">{guardMap[row.guardId] || row.guardId}</div>
                <div className="text-xs text-slate-500">Last seen {timeAgo(row.timestamp || row.createdAt)}</div>
              </div>
              <span className="badge-ok">Live</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-slate-50 p-2"><span className="text-slate-500">Lat</span><div className="font-mono">{row.lat ?? '-'}</div></div>
              <div className="rounded-md bg-slate-50 p-2"><span className="text-slate-500">Lng</span><div className="font-mono">{row.lng ?? '-'}</div></div>
            </div>
          </div>
        ))}
        {latestByGuard.length === 0 && (
          <div className="card col-span-full p-8 text-center text-slate-400">No guard location records yet.</div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Timestamp</th>
              <th className="th">Guard</th>
              <th className="th">Latitude</th>
              <th className="th">Longitude</th>
              <th className="th">Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="td whitespace-nowrap">{formatDateTime(row.timestamp || row.createdAt)}</td>
                <td className="td font-medium text-slate-950">{guardMap[row.guardId] || row.guardId || '-'}</td>
                <td className="td font-mono text-xs">{row.lat ?? '-'}</td>
                <td className="td font-mono text-xs">{row.lng ?? '-'}</td>
                <td className="td">{row.source || 'mobile'}</td>
              </tr>
            ))}
            {filteredHistory.length === 0 && <tr><td colSpan="5" className="td py-8 text-center text-slate-400">No location history found.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
