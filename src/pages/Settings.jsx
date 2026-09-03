import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { useSpot } from "../context/SpotContext";
import { useAuth } from "../context/AuthContext";
import { db, hasFirebaseConfig } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import {
  Settings,
  Shield,
  Users,
  Bell,
  Sliders,
  Database,
  Save,
  ArrowUpRight,
  HelpCircle,
  BookOpen,
  Users2,
  GraduationCap,
  BarChart2,
  MapPin,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Building2,
  Smartphone,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Lock,
  Globe,
  Mail,
  Phone,
  Key,
  Activity,
  Server,
  Link as LinkIcon,
  ChevronRight,
  Info,
  ToggleLeft,
  ToggleRight,
  Star,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

/* ─── Tabs ─── */
const TABS = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "teams",        label: "Teams",        icon: Users2 },
  { id: "users",        label: "Users",        icon: Users },
  { id: "patrol",       label: "Patrol Config", icon: Sliders },
  { id: "notifications",label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations",  icon: Globe },
  { id: "diagnostics",  label: "Diagnostics",   icon: Database },
];

/* ─── Reusable Toggle ─── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative h-6 w-11 rounded-full border transition-all duration-200 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
        checked ? "bg-blue-600 border-blue-500" : "bg-slate-800 border-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─── Stat card with real data ─── */
function StatCard({ icon: Icon, title, value, max, unit, accent, highlight, loading }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const bars = 8;
  const filled = Math.round((percent / 100) * bars);
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
      style={{
        background: highlight
          ? "linear-gradient(135deg, #84cc16 0%, #d4f542 100%)"
          : "linear-gradient(160deg, #131D31 0%, #1A2540 100%)",
        border: highlight ? "none" : "1px solid rgba(36, 51, 84, 0.9)",
        minHeight: "160px",
        boxShadow: highlight
          ? "0 10px 30px rgba(212, 245, 66, 0.25)"
          : "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top glow */}
      {!highlight && (
        <div className="absolute inset-x-0 top-0 h-px opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold"
          style={{ color: highlight ? "#1a1a1a" : "#94a3b8" }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: highlight ? "rgba(0,0,0,0.15)" : `${accent}18` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: highlight ? "#1a1a1a" : accent }} />
          </div>
          {title}
        </div>
      </div>

      <div className="flex items-end gap-3 mb-2">
        <span className="text-5xl font-black tracking-tighter leading-none"
          style={{ color: highlight ? "#111" : "#f1f5f9" }}>
          {loading ? "—" : value}
        </span>
        <div className="mb-1 flex flex-col items-start gap-1">
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{
              background: highlight ? "rgba(0,0,0,0.2)" : `${accent}22`,
              color: highlight ? "#d4f542" : accent,
            }}>
            {loading ? "…" : `${percent}%`}
          </span>
          <span className="text-[11px] font-medium"
            style={{ color: highlight ? "#333" : "#475569" }}>
            / {max} {unit}
          </span>
        </div>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} className="flex-1 rounded-full transition-all duration-500"
            style={{
              height: "6px",
              background: i < filled
                ? (highlight ? "rgba(0,0,0,0.5)" : accent)
                : (highlight ? "rgba(0,0,0,0.2)" : "rgba(36, 51, 84, 0.8)"),
              opacity: i < filled ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Resource Link ─── */
function ResourceLink({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start justify-between p-3.5 rounded-2xl border transition-all duration-200 group text-left hover:-translate-y-0.5"
      style={{
        background: "rgba(19, 29, 49, 0.7)",
        borderColor: "rgba(36, 51, 84, 0.8)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
                        bg-slate-800/80 text-slate-400 group-hover:text-blue-400 transition-colors"
          style={{ border: "1px solid rgba(36, 51, 84, 0.9)" }}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</div>
          {description && (
            <div className="mt-0.5 text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors line-clamp-1">{description}</div>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-slate-300 transition-all mt-0.5 group-hover:translate-x-0.5" />
    </button>
  );
}

/* ─── Section wrapper ─── */
function Section({ title, icon: Icon, iconColor = "#60a5fa", children }) {
  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: "linear-gradient(160deg, #131D31 0%, #1A2540 100%)", borderColor: "rgba(36, 51, 84, 0.9)" }}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b"
        style={{ borderColor: "rgba(36, 51, 84, 0.9)" }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${iconColor}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Toggle Row ─── */
function ToggleRow({ icon: Icon, iconColor, label, description, checked, onChange, disabled }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-2xl cursor-pointer select-none
                 transition-all duration-150 hover:bg-slate-900/40 group"
      style={{ border: "1px solid rgba(36, 51, 84, 0.6)" }}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
          checked ? "" : "bg-slate-800/60"
        }`}
          style={checked ? { background: `${iconColor}18`, border: `1px solid ${iconColor}30` } : { border: "1px solid rgba(36,51,84,0.9)" }}>
          <Icon className="h-4 w-4 transition-colors" style={{ color: checked ? iconColor : "#64748b" }} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{description}</div>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: ORGANIZATION
   ══════════════════════════════════════════════════════════════ */
function OrganizationTab({ config, onSave, loading, liveData }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Live stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ShieldCheck} title="Active Guards"    value={liveData.guards}      max={60}  unit="Total" accent="#3b82f6" loading={loading} />
        <StatCard icon={MapPin}      title="QR Checkpoints"  value={liveData.checkpoints}  max={200} unit="Zones" accent="#22c55e" highlight loading={loading} />
        <StatCard icon={AlertTriangle} title="Open Incidents" value={liveData.incidents}   max={50}  unit="Max"   accent="#f59e0b" loading={loading} />
      </div>

      {/* Enterprise upgrade banner */}
      <div className="relative rounded-2xl overflow-hidden flex items-center justify-between p-5"
        style={{
          background: "linear-gradient(120deg, #0a1428 0%, #0d1e3a 60%, #111e40 100%)",
          border: "1px solid rgba(37, 99, 235, 0.3)",
        }}>
        <div className="space-y-1 z-10">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">S.P.O.T Enterprise</div>
          <div className="text-lg font-black text-white leading-tight">Scale Your<br />Security Operations</div>
          <p className="text-xs text-slate-400 max-w-xs">
            Unlock unlimited guard slots, advanced AI analytics, and predictive threat intelligence.
          </p>
        </div>
        <div className="shrink-0 ml-4 z-10">
          <button className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900
                             hover:bg-blue-50 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ boxShadow: "0 4px 20px rgba(255,255,255,0.2)" }}>
            <Star className="h-4 w-4 text-amber-500" />
            Upgrade
          </button>
        </div>
        {/* Decorative orbs */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -right-4 -bottom-6 h-28 w-28 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
      </div>

      {/* Patrol operational tolerances */}
      <Section title="Patrol Operational Tolerances" icon={Sliders}>
        <div className="space-y-6 text-xs">
          {/* Liveness threshold slider */}
          <div>
            <div className="flex justify-between font-semibold mb-3">
              <div>
                <span className="text-slate-200 text-sm">Biometric Face Liveness Threshold</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Minimum AI liveness confidence required for checkpoint verification</p>
              </div>
              <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 rounded-xl px-3 py-1 border border-blue-500/20 shrink-0 ml-3">
                {config.livenessThreshold}%
              </span>
            </div>
            <input
              type="range" min="80" max="99" value={config.livenessThreshold}
              onChange={(e) => onSave({ livenessThreshold: Number(e.target.value) })}
              className="w-full"
              style={{ background: `linear-gradient(to right, #3b82f6 ${((config.livenessThreshold - 80) / 19) * 100}%, rgba(36,51,84,0.8) ${((config.livenessThreshold - 80) / 19) * 100}%)` }}
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
              <span>80% Min</span><span>99% Max (Strict)</span>
            </div>
          </div>

          {/* GPS tolerance slider */}
          <div>
            <div className="flex justify-between font-semibold mb-3">
              <div>
                <span className="text-slate-200 text-sm">GPS Geofence Tolerance Radius</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Maximum allowed distance from checkpoint center for scan validation</p>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 rounded-xl px-3 py-1 border border-emerald-500/20 shrink-0 ml-3">
                {config.gpsTolerance}m
              </span>
            </div>
            <input
              type="range" min="5" max="50" value={config.gpsTolerance}
              onChange={(e) => onSave({ gpsTolerance: Number(e.target.value) })}
              className="w-full"
              style={{ background: `linear-gradient(to right, #22c55e ${((config.gpsTolerance - 5) / 45) * 100}%, rgba(36,51,84,0.8) ${((config.gpsTolerance - 5) / 45) * 100}%)`, accentColor: "#22c55e" }}
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
              <span>5m (Precise)</span><span>50m (Lenient)</span>
            </div>
          </div>

          {/* QR strict toggle */}
          <ToggleRow
            icon={QrCode}
            iconColor="#3b82f6"
            label="Enforce Sequential QR Checkpoint Scans"
            description="Guards cannot bypass checkpoints out of order — strict patrol route enforcement"
            checked={config.qrStrict}
            onChange={(v) => onSave({ qrStrict: v })}
          />
        </div>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: TEAMS
   ══════════════════════════════════════════════════════════════ */
function TeamsTab({ guards, sites }) {
  // Group guards by site
  const grouped = {};
  guards.forEach((g) => {
    const key = g.siteId || g.siteName || "Unassigned";
    if (!grouped[key]) grouped[key] = { site: g.siteName || "Unassigned", guards: [] };
    grouped[key].guards.push(g);
  });

  const statusColor = (s) => {
    if (s === "On Patrol") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (s === "Idle") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    if (s === "Emergency") return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    return "text-slate-400 bg-slate-800 border-slate-700";
  };

  if (guards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
        style={{ borderColor: "rgba(36,51,84,0.8)", background: "rgba(19,29,49,0.4)" }}>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(36,51,84,0.8)" }}>
          <Users2 className="h-7 w-7 text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-400">No teams synced yet</p>
        <p className="mt-1 text-xs text-slate-600">Guards will appear here once they sync from Firebase</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([key, { site, guards: teamGuards }]) => (
        <Section key={key} title={`${site} — ${teamGuards.length} Guard${teamGuards.length !== 1 ? "s" : ""}`} icon={Building2} iconColor="#818cf8">
          <div className="space-y-2">
            {teamGuards.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-slate-900/40"
                style={{ border: "1px solid rgba(36,51,84,0.6)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
                    {(g.name || "G").charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{g.name || "Unknown Guard"}</div>
                    <div className="text-[11px] text-slate-500">{g.rank || "Guard"} • {g.employeeId || g.id}</div>
                  </div>
                </div>
                <span className={`badge-spot text-[10px] ${statusColor(g.status)}`}>{g.status || "Off Duty"}</span>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: USERS (Firestore users collection)
   ══════════════════════════════════════════════════════════════ */
function UsersTab() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setUsers(profile ? [profile] : []);
      setLoading(false);
      return;
    }
    getDocs(collection(db, "users"))
      .then((snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      })
      .catch(() => {
        setUsers(profile ? [profile] : []);
        setLoading(false);
      });
  }, [profile]);

  const roleColor = (r) => {
    if (r === "admin")      return "badge-danger";
    if (r === "supervisor") return "badge-info";
    return "badge-neutral";
  };

  return (
    <Section title="Registered Supervisors & Admins" icon={Users} iconColor="#60a5fa">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="h-6 w-6 rounded-full border-2 border-blue-500/30 border-t-blue-500"
            style={{ animation: "spin-fast 0.8s linear infinite" }} />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-500">No user accounts found in Firestore.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-slate-900/40"
              style={{ border: "1px solid rgba(36,51,84,0.6)" }}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  {(u.name || u.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{u.name || "Unknown"}</div>
                  <div className="text-[11px] text-slate-500">{u.email || u.id} • {u.agency || "S.P.O.T HQ"}</div>
                </div>
              </div>
              <span className={roleColor(u.role)}>{u.role || "supervisor"}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: PATROL CONFIG
   ══════════════════════════════════════════════════════════════ */
function PatrolConfigTab({ config, onSave }) {
  return (
    <div className="space-y-4">
      <Section title="Check-in & Verification Settings" icon={ShieldCheck} iconColor="#34d399">
        <div className="space-y-3">
          <ToggleRow icon={QrCode}       iconColor="#3b82f6" label="Require QR Code Scan at Each Checkpoint" description="Guards must scan QR codes to validate presence"          checked={config.requireQrScan}        onChange={(v) => onSave({ requireQrScan: v })} />
          <ToggleRow icon={ShieldCheck}  iconColor="#34d399" label="Require Face Biometric Verification"      description="Liveness check required before marking checkpoint"     checked={config.requireFace}          onChange={(v) => onSave({ requireFace: v })} />
          <ToggleRow icon={MapPin}       iconColor="#fbbf24" label="Enforce GPS Geofence Validation"          description="Guards must be within tolerance radius of checkpoint"  checked={config.enforceGps}           onChange={(v) => onSave({ enforceGps: v })} />
          <ToggleRow icon={CalendarDays} iconColor="#818cf8" label="Allow Patrol Time Window Flexibility"     description="Permit ±15 min deviation from scheduled patrol times"  checked={config.allowTimeFlexibility} onChange={(v) => onSave({ allowTimeFlexibility: v })} />
        </div>
      </Section>

      <Section title="Incident & Emergency Response" icon={AlertTriangle} iconColor="#f59e0b">
        <div className="space-y-3">
          <ToggleRow icon={Bell}         iconColor="#f59e0b" label="Auto-escalate Missed Patrols"      description="Notify supervisors if patrol is missed by >30 minutes" checked={config.autoEscalate}     onChange={(v) => onSave({ autoEscalate: v })} />
          <ToggleRow icon={Activity}     iconColor="#fb7185" label="SOS Emergency Broadcast"           description="Send all-channel alert when a guard triggers SOS"      checked={config.sosBroadcast}    onChange={(v) => onSave({ sosBroadcast: v })} />
          <ToggleRow icon={Smartphone}   iconColor="#22d3ee" label="Mobile Device Heartbeat Monitoring" description="Alert when guard device goes offline for >5 minutes"   checked={config.heartbeatAlerts} onChange={(v) => onSave({ heartbeatAlerts: v })} />
        </div>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: NOTIFICATIONS
   ══════════════════════════════════════════════════════════════ */
function NotificationsTab({ config, onSave }) {
  return (
    <div className="space-y-4">
      <Section title="Alert Delivery Channels" icon={Bell} iconColor="#fbbf24">
        <div className="space-y-3">
          <ToggleRow icon={Bell}    iconColor="#60a5fa" label="In-App Notification Panel"         description="Show live notifications inside the web command center"  checked={config.inAppNotifs}      onChange={(v) => onSave({ inAppNotifs: v })} />
          <ToggleRow icon={Mail}    iconColor="#34d399" label="Email Incident Alerts"             description="Send email digest for new incidents and SOS events"    checked={config.emailAlerts}      onChange={(v) => onSave({ emailAlerts: v })} />
          <ToggleRow icon={Phone}   iconColor="#f59e0b" label="SMS Critical Alerts"               description="Receive SMS for Priority-1 incidents only"             checked={config.smsAlerts}        onChange={(v) => onSave({ smsAlerts: v })} />
          <ToggleRow icon={Zap}     iconColor="#818cf8" label="Push Notifications (PWA)"          description="Browser push notifications when app is in background"  checked={config.pushNotifs}       onChange={(v) => onSave({ pushNotifs: v })} />
        </div>
      </Section>

      <Section title="Notification Triggers" icon={Activity} iconColor="#60a5fa">
        <div className="space-y-3">
          <ToggleRow icon={AlertTriangle} iconColor="#fb7185" label="Missed Checkpoint Alerts"    description="Notify when a guard misses a scheduled checkpoint"     checked={config.missedCheckpoint} onChange={(v) => onSave({ missedCheckpoint: v })} />
          <ToggleRow icon={ShieldCheck}   iconColor="#34d399" label="Successful Patrol Completion" description="Notify when a guard completes a full patrol route"    checked={config.patrolComplete}   onChange={(v) => onSave({ patrolComplete: v })} />
          <ToggleRow icon={Users}         iconColor="#60a5fa" label="Guard Check-in / Check-out"  description="Notify on attendance time-in and time-out events"     checked={config.attendanceAlerts} onChange={(v) => onSave({ attendanceAlerts: v })} />
          <ToggleRow icon={Smartphone}    iconColor="#f59e0b" label="Device Battery Low Alerts"   description="Alert when a guard device drops below 20% battery"    checked={config.batteryAlerts}    onChange={(v) => onSave({ batteryAlerts: v })} />
        </div>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: INTEGRATIONS
   ══════════════════════════════════════════════════════════════ */
function IntegrationsTab() {
  const firebaseInfo = [
    { label: "Project ID",        value: "spot-f503e",                    icon: Database, color: "#60a5fa" },
    { label: "Auth Domain",       value: "spot-f503e.firebaseapp.com",    icon: Lock,     color: "#34d399" },
    { label: "Storage Bucket",    value: "spot-f503e.firebasestorage.app",icon: Server,   color: "#818cf8" },
    { label: "Region",            value: "asia-southeast1 (Primary)",     icon: Globe,    color: "#fbbf24" },
    { label: "SDK Version",       value: "Firebase JS SDK v10.x",         icon: Zap,      color: "#22d3ee" },
    { label: "Auth Provider",     value: "Firebase Authentication (Email)", icon: Key,    color: "#fb7185" },
  ];

  return (
    <div className="space-y-4">
      <Section title="Firebase Cloud Integration" icon={Database} iconColor="#60a5fa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {firebaseInfo.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(8,14,26,0.6)", border: "1px solid rgba(36,51,84,0.7)" }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${color}12` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-200 font-mono truncate">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Connected Services" icon={LinkIcon} iconColor="#34d399">
        {[
          { name: "Cloud Firestore", desc: "Realtime NoSQL database for all operational data", status: "connected", color: "#34d399" },
          { name: "Firebase Auth",   desc: "Supervisor authentication and session management",  status: "connected", color: "#34d399" },
          { name: "Cloud Functions", desc: "Serverless backend for business logic and triggers", status: "connected", color: "#34d399" },
          { name: "Face API",        desc: "Biometric liveness verification for guard check-ins", status: "active",  color: "#60a5fa" },
        ].map(({ name, desc, status, color }) => (
          <div key={name} className="flex items-center justify-between py-3 border-b last:border-0"
            style={{ borderColor: "rgba(36,51,84,0.5)" }}>
            <div>
              <div className="text-sm font-semibold text-white">{name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="text-[11px] font-semibold capitalize" style={{ color }}>{status}</span>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: DIAGNOSTICS
   ══════════════════════════════════════════════════════════════ */
function DiagnosticsTab() {
  const { dbConnected, guards, checkpoints, incidents, sites } = useSpot();
  const [latency, setLatency] = useState(null);
  const [testRunning, setTestRunning] = useState(false);

  const runLatencyTest = useCallback(async () => {
    if (!hasFirebaseConfig || !db) {
      setLatency(null);
      return;
    }
    setTestRunning(true);
    const start = performance.now();
    try {
      await getDoc(doc(db, "settings", "system"));
      setLatency(Math.round(performance.now() - start));
    } catch {
      setLatency(null);
    } finally {
      setTestRunning(false);
    }
  }, []);

  useEffect(() => { runLatencyTest(); }, [runLatencyTest]);

  const latencyColor = latency === null ? "#94a3b8" : latency < 200 ? "#34d399" : latency < 500 ? "#fbbf24" : "#fb7185";
  const latencyLabel = latency === null ? "N/A" : `${latency}ms`;

  const items = [
    { label: "Database Engine",      value: hasFirebaseConfig ? "Cloud Firestore v10.x"      : "Local Mock Data",       color: hasFirebaseConfig ? "text-emerald-400" : "text-amber-400" },
    { label: "Realtime Listener",    value: dbConnected ? "Connected & Listening"             : "Disconnected",          color: dbConnected ? "text-emerald-400" : "text-rose-400" },
    { label: "Auth Provider",        value: hasFirebaseConfig ? "Firebase Authentication"      : "Local Auth Mode",       color: hasFirebaseConfig ? "text-blue-400" : "text-amber-400" },
    { label: "Read Latency",         value: testRunning ? "Testing…" : latencyLabel,                                     color: testRunning ? "text-slate-400" : `text-[${latencyColor}]` },
    { label: "Guards Synced",        value: `${guards.length} records`,                                                  color: "text-slate-300" },
    { label: "Checkpoints Synced",   value: `${checkpoints.length} records`,                                             color: "text-slate-300" },
    { label: "Incidents Synced",     value: `${incidents.length} records`,                                               color: "text-slate-300" },
    { label: "Sites Synced",         value: `${sites.length} records`,                                                   color: "text-slate-300" },
  ];

  return (
    <Section title="Firebase Cloud Sync & System Diagnostics" icon={Database} iconColor="#34d399">
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div key={item.label}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "rgba(8,14,26,0.6)", border: "1px solid rgba(36,51,84,0.7)" }}>
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className={`font-mono text-xs font-semibold ${item.color}`}
              style={item.label === "Read Latency" ? { color: latencyColor } : {}}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Connection status banner */}
      <div className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: dbConnected ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
          border: `1px solid ${dbConnected ? "rgba(52,211,153,0.25)" : "rgba(251,113,133,0.25)"}`,
        }}>
        <div className="flex items-center gap-3">
          {dbConnected
            ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            : <XCircle className="h-5 w-5 text-rose-400" />}
          <div>
            <div className={`text-sm font-bold ${dbConnected ? "text-emerald-400" : "text-rose-400"}`}>
              {dbConnected ? "Firebase Firestore Connected" : "Firebase Connection Error"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {dbConnected
                ? "All services operational. Data is syncing in real-time."
                : "Check Firebase configuration and Firestore security rules."}
            </div>
          </div>
        </div>
        <button onClick={runLatencyTest} disabled={testRunning}
          className="btn-icon"
          title="Re-run latency test">
          <RefreshCw className={`h-4 w-4 ${testRunning ? "animate-spin" : ""}`} />
        </button>
      </div>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ══════════════════════════════════════════════════════════════ */

const DEFAULT_CONFIG = {
  // Organization sliders
  livenessThreshold: 95,
  gpsTolerance: 15,
  qrStrict: true,
  // Patrol config
  requireQrScan: true,
  requireFace: true,
  enforceGps: true,
  allowTimeFlexibility: false,
  autoEscalate: true,
  sosBroadcast: true,
  heartbeatAlerts: true,
  // Notifications
  inAppNotifs: true,
  emailAlerts: false,
  smsAlerts: false,
  pushNotifs: true,
  missedCheckpoint: true,
  patrolComplete: false,
  attendanceAlerts: true,
  batteryAlerts: true,
};

export default function SettingsPage() {
  const { addToast, guards, checkpoints, incidents, sites, dbConnected } = useSpot();
  const [activeTab, setActiveTab] = useState("organization");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveDataLoading, setLiveDataLoading] = useState(true);

  // Load config from Firestore on mount
  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setConfigLoaded(true);
      return;
    }
    getDoc(doc(db, "settings", "system"))
      .then((snap) => {
        if (snap.exists()) {
          setConfig((prev) => ({ ...prev, ...snap.data() }));
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, []);

  // Once guards load, mark live data as ready
  useEffect(() => {
    if (configLoaded) setLiveDataLoading(false);
  }, [guards, configLoaded]);

  // Partial config update + debounced save
  const handleConfigChange = useCallback((patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (hasFirebaseConfig && db) {
        await setDoc(doc(db, "settings", "system"), { ...config, updatedAt: serverTimestamp() }, { merge: true });
      }
      addToast("Settings Saved", "Patrol operational parameters successfully updated.", "success");
    } catch (err) {
      addToast("Save Failed", `Could not save settings: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const liveData = {
    guards: guards.filter((g) => g.status !== "Off Duty" && g.status !== "Inactive").length,
    checkpoints: checkpoints.length,
    incidents: incidents.filter((i) => i.status !== "Resolved" && i.status !== "Closed").length,
    sites: sites.length,
  };

  return (
    <Layout title="">
      {/* Page heading */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <Settings className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">System Configuration</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
            System Settings
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-lg">
            Agency profiles, patrol parameters, liveness thresholds & Firebase diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs"
            style={{ background: "rgba(13,21,40,0.9)", border: `1px solid ${dbConnected ? "rgba(52,211,153,0.3)" : "rgba(244,63,94,0.3)"}` }}>
            <span className="h-2 w-2 rounded-full"
              style={{ background: dbConnected ? "#34d399" : "#fb7185", boxShadow: `0 0 6px ${dbConnected ? "#34d399" : "#fb7185"}` }} />
            <span className="font-semibold" style={{ color: dbConnected ? "#34d399" : "#fb7185" }}>
              {dbConnected ? "Firebase Synced" : "Offline"}
            </span>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2">
            {saving
              ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" style={{ animation: "spin-fast 0.6s linear infinite" }} /> Saving…</>
              : <><Save className="h-3.5 w-3.5" /> Save Settings</>}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {TABS.map((tab) => {
              const TIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? "linear-gradient(135deg, #1d4ed8, #4f46e5)" : "rgba(19,29,49,0.7)",
                    color: isActive ? "#fff" : "#64748b",
                    border: isActive ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(36,51,84,0.7)",
                    boxShadow: isActive ? "0 4px 15px rgba(37,99,235,0.3)" : "none",
                  }}
                >
                  <TIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="animate-fade-up">
            {activeTab === "organization"  && <OrganizationTab config={config} onSave={handleConfigChange} loading={liveDataLoading} liveData={liveData} />}
            {activeTab === "teams"         && <TeamsTab guards={guards} sites={sites} />}
            {activeTab === "users"         && <UsersTab />}
            {activeTab === "patrol"        && <PatrolConfigTab config={config} onSave={handleConfigChange} />}
            {activeTab === "notifications" && <NotificationsTab config={config} onSave={handleConfigChange} />}
            {activeTab === "integrations"  && <IntegrationsTab />}
            {activeTab === "diagnostics"   && <DiagnosticsTab />}
          </div>

          {/* Save footer */}
          <div className="flex justify-end pt-2 pb-6">
            <button onClick={handleSave} disabled={saving}
              className="btn-primary py-2.5 px-6 text-sm font-bold flex items-center gap-2">
              {saving
                ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white" style={{ animation: "spin-fast 0.6s linear infinite" }} /> Saving…</>
                : <><Save className="h-4 w-4" /> Save All Settings</>}
            </button>
          </div>
        </div>

        {/* RIGHT sidebar panel */}
        <div className="hidden xl:flex w-64 shrink-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Users2, label: "Community", color: "#60a5fa" },
              { icon: GraduationCap, label: "Academy", color: "#818cf8" },
            ].map(({ icon: Icon, label, color }) => (
              <button key={label}
                className="flex flex-col items-center gap-2.5 rounded-2xl p-4 text-xs font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 group"
                style={{ background: "rgba(19,29,49,0.8)", border: "1px solid rgba(36,51,84,0.8)" }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl transition-all group-hover:scale-110"
                  style={{ background: `${color}12` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color }} />
                </div>
                <span className="group-hover:text-white transition-colors">{label}</span>
              </button>
            ))}
          </div>

          <ResourceLink icon={HelpCircle}   title="Help Center"       description="Documentation and setup guides" />
          <ResourceLink icon={Users2}       title="Guard Directory"   description="Manage registered security guards" />
          <ResourceLink icon={MessageSquare} title="Incident Reports"  description="Filed incidents and updates" />
          <ResourceLink icon={BarChart2}    title="Analytics"         description="Operational performance metrics" />
          <ResourceLink icon={BookOpen}     title="Use Cases"         description="How S.P.O.T protects your sites" />

          {/* Quick stats */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(13,21,40,0.9)", border: "1px solid rgba(36,51,84,0.8)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Overview</div>
            {[
              { label: "Active Guards",  value: liveData.guards,      color: "#60a5fa" },
              { label: "Open Incidents", value: liveData.incidents,    color: "#fb7185" },
              { label: "Total Sites",    value: liveData.sites,        color: "#34d399" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm font-black" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
