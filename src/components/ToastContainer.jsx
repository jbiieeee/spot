import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useSpot } from '../context/SpotContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useSpot();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'border-blue-500/40 bg-slate-900/90 text-blue-200';
        
        if (toast.type === 'danger') {
          Icon = AlertTriangle;
          borderClass = 'border-rose-500/50 bg-rose-950/90 text-rose-200';
        } else if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-emerald-500/50 bg-emerald-950/90 text-emerald-200';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-200 animate-slide-in ${borderClass}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">{toast.title}</span>
                <span className="text-[10px] opacity-70">{toast.time}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-100 opacity-60 rounded-md transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
