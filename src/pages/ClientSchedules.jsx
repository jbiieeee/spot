import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { CalendarDays, Clock, ShieldCheck } from 'lucide-react';

export default function ClientSchedules() {
  const { guards, schedules, saveSchedule, addToast } = useSpot();
  const [form, setForm] = useState({ guardId: '', shift: 'Day Shift', date: '' });

  const assign = async (event) => {
    event.preventDefault();
    const guard = guards.find((item) => item.id === form.guardId);
    if (!guard || !form.date) return;
    try {
      await saveSchedule({ ...form, guardName: guard.name, siteId: guard.siteId, siteName: guard.siteName });
      setForm({ guardId: '', shift: 'Day Shift', date: '' });
      addToast('Schedule Assigned', `${guard.name} is scheduled for ${form.date}.`, 'success');
    } catch (error) {
      addToast('Schedule Failed', error.message || 'The schedule could not be saved.', 'danger');
    }
  };

  return (
    <Layout title="Guard Scheduling" subtitle="Assign your available guards to their client facilities">
      <div className="space-y-6">
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><CalendarDays className="h-5 w-5" /></div><div><h2 className="text-base font-bold text-white">Create client schedule</h2><p className="text-xs text-slate-400">Only guards assigned to your client account are available.</p></div></div>
          <form onSubmit={assign} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <select required className="input-spot" value={form.guardId} onChange={(event) => setForm({ ...form, guardId: event.target.value })}><option value="">Select guard</option>{guards.map((guard) => <option key={guard.id} value={guard.id}>{guard.name}</option>)}</select>
            <input required className="input-spot" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            <select className="input-spot" value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value })}><option>Day Shift</option><option>Night Shift</option><option>Relief</option></select>
            <button className="btn-primary" type="submit"><ShieldCheck className="h-4 w-4" /> Assign guard</button>
          </form>
        </section>
        <section className="card-spot"><div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><Clock className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-bold text-white">Assigned schedules</h2></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">{schedules.length === 0 ? <p className="col-span-full rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">No schedules assigned yet.</p> : schedules.map((schedule) => <div key={schedule.id} className="interactive-lift rounded-xl border border-white/10 bg-slate-950/30 p-4"><p className="text-sm font-bold text-white">{schedule.guardName}</p><p className="mt-1 text-xs text-slate-400">{schedule.siteName}</p><p className="mt-3 text-xs font-semibold text-cyan-300">{schedule.date} · {schedule.shift}</p><span className="mt-2 inline-flex badge-success">{schedule.status}</span></div>)}</div></section>
      </div>
    </Layout>
  );
}
