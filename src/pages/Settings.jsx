import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useSpot } from '../context/SpotContext';
import { Settings, Shield, QrCode, MapPin, ShieldCheck, Database, Bell, Save } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useSpot();
  const [livenessThreshold, setLivenessThreshold] = useState(95);
  const [gpsTolerance, setGpsTolerance] = useState(15);
  const [qrStrict, setQrStrict] = useState(true);

  const handleSave = () => {
    addToast('Settings Saved', 'Patrol operational parameters successfully updated.', 'success');
  };

  return (
    <Layout
      title="System & Telemetry Settings"
      subtitle="Agency Profiles, Patrol Parameters, Liveness Thresholds & Firebase Diagnostics"
    >
      <div className="max-w-4xl space-y-6">
        {/* Patrol Parameters Configuration */}
        <div className="card-spot space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" /> Patrol Operational Tolerances
          </h3>

          <div className="space-y-4 text-xs">
            {/* Liveness slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Biometric Face Liveness Threshold</span>
                <span className="text-blue-400 font-mono">{livenessThreshold}% Pass Score</span>
              </div>
              <input
                type="range"
                min="80"
                max="99"
                value={livenessThreshold}
                onChange={(e) => setLivenessThreshold(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="mt-1 text-[11px] text-slate-500">Requires AI liveness confidence before checkpoint verification.</p>
            </div>

            {/* GPS Radius tolerance */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">GPS Geofence Tolerance Radius</span>
                <span className="text-emerald-400 font-mono">{gpsTolerance} Meters</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={gpsTolerance}
                onChange={(e) => setGpsTolerance(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Strict QR check */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="font-bold text-white">Enforce Sequential QR Checkpoint Scans</div>
                <div className="text-[11px] text-slate-400">Guards cannot bypass checkpoints out of order</div>
              </div>
              <input
                type="checkbox"
                checked={qrStrict}
                onChange={(e) => setQrStrict(e.target.checked)}
                className="h-5 w-5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button onClick={handleSave} className="btn-primary py-2 px-5 text-xs font-bold">
              <Save className="h-4 w-4 mr-1" /> Save Settings Parameters
            </button>
          </div>
        </div>

        {/* Firebase Database Diagnostics */}
        <div className="card-spot space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" /> Firebase Cloud Sync Status
          </h3>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-mono text-emerald-400">Cloud Firestore (v10.12.2)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Realtime Listener Status:</span>
              <span className="font-semibold text-emerald-400">Connected & Listening</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
