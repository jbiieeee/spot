import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Clock, UserCheck, Plus } from 'lucide-react';

export default function Schedules() {
  const { guards, schedules, saveSchedule, addToast } = useSpot();
  const [form, setForm] = useState({ guardId: '', siteName: '', shift: 'Day Shift', date: '' });
  const { role } = useAuth();

  const createSchedule = async () => {
    const guard = guards.find((item) => item.id === form.guardId);
    if (!guard || !form.date) return;
    await saveSchedule({ ...form, guardName: guard.name, siteId: guard.siteId, siteName: form.siteName || guard.siteName });
    setForm({ guardId: '', siteName: '', shift: 'Day Shift', date: '' });
    addToast('Schedule Saved', `${guard.name} was assigned a ${form.shift}.`, 'success');
  };

  return (
    <Layout
      title="Guard Duty Roster & Shift Schedules"
      subtitle="Operational Shift Assignments, Day/Night Roster & Guard Allocation"
    >
      <div className="space-y-6">
        {role === 'admin' && <div className="card-spot grid grid-cols-1 gap-3 sm:grid-cols-4"><select className="input-spot" value={form.guardId} onChange={(event) => setForm({ ...form, guardId: event.target.value })}><option value="">Select guard</option>{guards.map((guard) => <option key={guard.id} value={guard.id}>{guard.name}</option>)}</select><input className="input-spot" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /><select className="input-spot" value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value })}><option>Day Shift</option><option>Night Shift</option><option>Relief</option></select><button onClick={createSchedule} className="btn-primary">Assign guard</button></div>}
        <div className="card-spot space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-400" /> Active Roster Assignments
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Weekly Schedule Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((schedule) => <div key={schedule.id} className="card-spot border-cyan-400/20"><div className="text-sm font-bold text-white">{schedule.guardName}</div><div className="text-xs text-slate-400">{schedule.siteName} · {schedule.date}</div><div className="mt-2 text-xs font-semibold text-cyan-300">{schedule.shift} · {schedule.status}</div></div>)}
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
