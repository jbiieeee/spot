import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Lock, Radio, KeyRound, ArrowRight, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Wifi, Clock, Activity, Zap
} from 'lucide-react';

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const formatDate = (date) =>
  date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const ATTEMPT_KEY = 'spot.auth.attempts';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60 * 60 * 1000;

const readAttemptState = () => {
  try {
    const raw = window.localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return { count: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw);
    if ((parsed.lockedUntil || 0) <= Date.now()) {
      window.localStorage.removeItem(ATTEMPT_KEY);
      return { count: 0, lockedUntil: 0 };
    }
    return { count: parsed.count || 0, lockedUntil: parsed.lockedUntil || 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
};

const saveAttemptState = (state) =>
  window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify(state));
const clearAttemptState = () =>
  window.localStorage.removeItem(ATTEMPT_KEY);

const formatRemaining = (ms) => {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  if (minutes >= 60) return '1 hour';
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

// Animated floating orb component
function FloatingOrb({ cx, cy, r, color, delay = '0s' }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: cx,
        top: cy,
        width: r * 2,
        height: r * 2,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
        animation: `float 6s ease-in-out infinite`,
        animationDelay: delay,
        filter: 'blur(40px)',
      }}
    />
  );
}

// Feature stat card for the left panel
function FeatureCard({ icon: Icon, label, value, color, delay = '0s' }) {
  return (
    <div
      className="rounded-2xl border p-4 animate-fade-up"
      style={{
        background: 'rgba(13, 21, 40, 0.8)',
        borderColor: 'rgba(36, 51, 84, 0.8)',
        backdropFilter: 'blur(12px)',
        animationDelay: delay,
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className="text-lg font-black text-white leading-tight">{value}</div>
    </div>
  );
}

export default function Login() {
  const { login, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [attemptState, setAttemptState] = useState(() => readAttemptState());
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
      return;
    }

    const currentAttempts = readAttemptState();
    if (currentAttempts.lockedUntil > Date.now()) {
      const remaining = formatRemaining(currentAttempts.lockedUntil - Date.now());
      setAttemptState(currentAttempts);
      setError(`This device is locked for ${remaining}. Try again later.`);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
      return;
    }

    setBusy(true);
    try {
      await login(email, password, rememberDevice);
      clearAttemptState();
      setAttemptState({ count: 0, lockedUntil: 0 });
      setLoginSuccess(true);
    } catch (err) {
      const nextCount = currentAttempts.count + 1;
      if (nextCount >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCK_MS;
        const nextState = { count: nextCount, lockedUntil };
        saveAttemptState(nextState);
        setAttemptState(nextState);
        setError('Too many failed attempts. This device is locked for 1 hour.');
      } else {
        const nextState = { count: nextCount, lockedUntil: 0 };
        saveAttemptState(nextState);
        setAttemptState(nextState);
        setError(err.message || 'Invalid credentials. Please try again.');
      }
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
    } finally {
      setBusy(false);
    }
  };

  const locked = attemptState.lockedUntil > now.getTime();
  const signInDisabled = busy || locked || loginSuccess;
  const attemptsLeft = MAX_ATTEMPTS - attemptState.count;

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 lg:p-8"
      style={{ background: 'linear-gradient(135deg, #040810 0%, #080E1A 40%, #0a1020 70%, #060d18 100%)' }}
    >
      {/* Animated background layer */}
      <div className="absolute inset-0 hex-grid opacity-100" />

      {/* Floating ambient orbs */}
      <FloatingOrb cx="10%" cy="20%" r={180} color="rgba(37,99,235,0.15)" delay="0s" />
      <FloatingOrb cx="85%" cy="70%" r={220} color="rgba(99,102,241,0.12)" delay="2s" />
      <FloatingOrb cx="60%" cy="10%" r={140} color="rgba(16,185,129,0.08)" delay="4s" />
      <FloatingOrb cx="20%" cy="85%" r={160} color="rgba(37,99,235,0.1)" delay="1s" />

      {/* Subtle top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }}
      />

      {/* Main content grid */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_460px]">

        {/* ── LEFT — Branding panel ── */}
        <section className="hidden lg:flex flex-col text-white">

          {/* Brand badge */}
          <div className="mb-8 animate-fade-up">
            <div
              className="inline-flex items-center gap-3 rounded-2xl px-4 py-2.5"
              style={{
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
              >
                <Shield className="h-4.5 w-4.5 text-white" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">
                S.P.O.T Security Patrol Operations Tracker
              </span>
            </div>
          </div>

          {/* Main heading */}
          <div className="animate-fade-up delay-100">
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight">
              <span className="text-white">Web Command</span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Center
              </span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
              Real-time supervisor operations platform for patrol monitoring, guard GPS telemetry,
              biometric checkpoint verification, and incident response command.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="mt-10 grid grid-cols-2 gap-3 max-w-lg">
            <FeatureCard
              icon={Activity}
              label="System Status"
              value="All Systems Online"
              color="#34d399"
              delay="0.1s"
            />
            <FeatureCard
              icon={Clock}
              label="System Time"
              value={formatTime(now)}
              color="#60a5fa"
              delay="0.2s"
            />
            <FeatureCard
              icon={Radio}
              label="Live Feed"
              value="Firebase Connected"
              color="#818cf8"
              delay="0.3s"
            />
            <FeatureCard
              icon={Zap}
              label="Uptime"
              value="99.97% Reliable"
              color="#fbbf24"
              delay="0.4s"
            />
          </div>

          {/* Bottom date display */}
          <div className="mt-8 animate-fade-up delay-500">
            <p className="text-xs text-slate-500 font-medium">{formatDate(now)}</p>
          </div>
        </section>

        {/* ── RIGHT — Login form card ── */}
        <div className="w-full animate-scale-in">
          <form
            onSubmit={submit}
            aria-busy={busy}
            className={`relative overflow-hidden rounded-3xl p-7 transition-all duration-200 ${shakeForm ? 'animate-shake' : ''}`}
            style={{
              background: 'rgba(13, 21, 40, 0.90)',
              border: '1px solid rgba(36, 51, 84, 0.9)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Card top glow line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), rgba(99,102,241,0.6), transparent)' }}
            />

            {/* Inner corner glow */}
            <div
              className="absolute -top-10 -right-10 h-40 w-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
            />

            {/* Card header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                {/* Mobile logo */}
                <div className="flex lg:hidden items-center gap-2.5 mb-3">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                  >
                    <Shield className="h-4.5 w-4.5 text-white" />
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <span className="text-sm font-black tracking-widest text-white">S.P.O.T.</span>
                </div>

                <h2 className="text-2xl font-black text-white leading-tight">Supervisor Sign In</h2>
                <p className="mt-1 text-sm text-slate-400">Enter your credentials to access command console</p>
              </div>
              <span className="badge-info shrink-0 mt-1 text-[10px]">AUTH REQUIRED</span>
            </div>

            {/* Config / Firebase warning */}
            {configError && (
              <div
                className="mb-4 rounded-2xl p-3.5 text-xs"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{configError}</span>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="mb-5 h-px" style={{ background: 'rgba(36, 51, 84, 0.8)' }} />

            {/* Email field */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <input
                  className="input-spot pr-10"
                  type="email"
                  required
                  placeholder="supervisor@spot.security"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={signInDisabled}
                  autoComplete="email"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-600" />
                </div>
              </div>
            </div>

            {/* Password field */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  className="input-spot pr-10"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={signInDisabled}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                  disabled={signInDisabled}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="mb-4 rounded-2xl p-3.5 text-xs animate-fade-up"
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Attempts warning */}
            {attemptState.count > 0 && !locked && (
              <div
                className="mb-4 rounded-2xl px-3.5 py-2.5 text-xs"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                }}
              >
                {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining before lockout
              </div>
            )}

            {/* Success message */}
            {loginSuccess && (
              <div
                className="mb-4 rounded-2xl p-3.5 text-xs animate-fade-up"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  color: '#34d399',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Authentication successful — Loading command center...</span>
                </div>
              </div>
            )}

            {/* Remember session */}
            <div className="mb-5 flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberDevice}
                onClick={() => setRememberDevice((v) => !v)}
                disabled={signInDisabled}
                className={`relative h-5 w-9 rounded-full transition-all duration-200 shrink-0 border ${
                  rememberDevice
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    rememberDevice ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-400 select-none cursor-pointer"
                onClick={() => !signInDisabled && setRememberDevice((v) => !v)}
              >
                Remember session on this browser
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={signInDisabled}
              className="btn-glow w-full py-3.5 text-sm font-bold justify-center rounded-2xl"
              style={{ fontSize: '0.875rem' }}
            >
              {loginSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Access Granted
                </>
              ) : busy ? (
                <>
                  <span
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    style={{ animation: 'spin-fast 0.6s linear infinite' }}
                  />
                  Verifying Credentials...
                </>
              ) : locked ? (
                <>
                  <Lock className="h-4 w-4" />
                  Device Locked
                </>
              ) : (
                <>
                  Sign In to Command Center
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>

            {/* Footer status row */}
            <div className="mt-5 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Firebase Authentication Active
              </div>
              <div className="flex items-center gap-1 font-mono">
                <Wifi className="h-3 w-3" />
                {formatTime(now)}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
