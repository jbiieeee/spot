import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useSpot } from '../context/SpotContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useSpot();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'border-blue-500/40 bg-slate-900/95 text-blue-200 shadow-blue-950/50';
        let barClass = 'bg-blue-500';

        if (toast.type === 'danger') {
          Icon = AlertTriangle;
          borderClass = 'border-rose-500/50 bg-[#1A0C14]/95 text-rose-200 shadow-rose-950/50';
          barClass = 'bg-rose-500';
        } else if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-emerald-500/50 bg-[#0B1A14]/95 text-emerald-200 shadow-emerald-950/50';
          barClass = 'bg-emerald-500';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-500/50 bg-[#1A140B]/95 text-amber-200 shadow-amber-950/50';
          barClass = 'bg-amber-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-in ${borderClass}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">{toast.title}</span>
                <span className="text-[10px] opacity-70 font-mono">{toast.time}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-200 font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-100 opacity-60 rounded-lg hover:bg-white/10 transition shrink-0"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 3-second progress countdown bar */}
            <div
              className={`absolute bottom-0 left-0 h-0.5 w-full opacity-60 ${barClass}`}
              style={{
                animation: `toast-progress ${toast.duration || 3000}ms linear forwards`
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
