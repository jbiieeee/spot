import React from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { Briefcase, Building2, Users, UserCheck, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function Clients() {
  const { clients } = useSpot();

  return (
    <Layout
      title="Client Organization Directory"
      subtitle="Contract Accounts, Security Deployment Coverage & SLA Metrics"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="card-spot flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{client.company}</h3>
                      <span className="text-xs font-mono text-blue-400">{client.id}</span>
                    </div>
                  </div>
                  <span className="badge-success text-[10px]">{client.status}</span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Contact Officer:</span>
                    <span className="font-semibold text-white">{client.contactPerson}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-200">{client.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Lead Supervisor:</span>
                    <span className="font-semibold text-blue-400">{client.supervisor}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Sites</div>
                    <div className="text-sm font-bold text-white mt-0.5">{client.deploymentsCount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Guards</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">{client.assignedGuards}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">SLA Rate</div>
                    <div className="text-sm font-bold text-blue-400 mt-0.5">{client.slaCompliance}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
