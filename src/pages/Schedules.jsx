import React from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { CalendarDays, Clock, UserCheck, Plus } from 'lucide-react';

export default function Schedules() {
  const { guards } = useSpot();

  return (
    <Layout
      title="Guard Duty Roster & Shift Schedules"
      subtitle="Operational Shift Assignments, Day/Night Roster & Guard Allocation"
    >
      <div className="space-y-6">
        <div className="card-spot space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-400" /> Active Roster Assignments
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Weekly Schedule Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guards.map((guard) => (
              <div key={guard.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={guard.photo} alt={guard.name} className="h-10 w-10 rounded-full object-cover border border-blue-500/40" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{guard.name}</h4>
                    <span className="text-xs text-slate-400">{guard.siteName}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Assigned Shift:</span>
                    <span className="font-semibold text-blue-400">{guard.shift}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold text-emerald-400">{guard.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
