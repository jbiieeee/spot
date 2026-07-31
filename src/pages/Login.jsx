import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Radio, KeyRound, ArrowRight } from 'lucide-react';

const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

const saveAttemptState = (state) => {
  window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify(state));
};

const clearAttemptState = () => {
  window.localStorage.removeItem(ATTEMPT_KEY);
};

const formatRemaining = (ms) => {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  if (minutes >= 60) return '1 hour';
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

export default function Login() {
  const { login, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [attemptState, setAttemptState] = useState(() => readAttemptState());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const currentAttempts = readAttemptState();
    if (currentAttempts.lockedUntil > Date.now()) {
      const remaining = formatRemaining(currentAttempts.lockedUntil - Date.now());
      setAttemptState(currentAttempts);
      setError(`This device is locked for ${remaining}. Try again later.`);
      return;
    }

    setBusy(true);
    try {
      await login(email, password, rememberDevice);
      clearAttemptState();
      setAttemptState({ count: 0, lockedUntil: 0 });
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
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setBusy(false);
    }
  };

  const locked = attemptState.lockedUntil > now.getTime();
  const signInDisabled = busy || locked;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F172A] p-4 text-slate-100 flex items-center justify-center">
      <div className="security-grid absolute inset-0 opacity-95" />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        {/* Left Branding */}
        <section className="hidden text-white lg:block">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-400 backdrop-blur">
            <Shield className="h-4 w-4 text-blue-400" />
            S.P.O.T Security Patrol Operations Tracker
          </div>

          <h1 className="text-4xl font-bold leading-tight text-white tracking-tight">
            Web Command Center
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
            Real-time supervisor operations for patrol monitoring, guard GPS telemetry, checkpoint integrity, and incident response.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[10px] uppercase font-bold text-slate-400">Authentication</div>
              <div className="mt-1 text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Lock className="h-4 w-4" /> Credentials Required
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[10px] uppercase font-bold text-slate-400">System Time</div>
              <div className="mt-1 text-sm font-bold text-blue-400 font-mono">{formatTime(now)}</div>
            </div>
          </div>
        </section>

        {/* Right Form Card */}
        <div className="w-full">
          <form
            onSubmit={submit}
            aria-busy={busy}
            className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B] shadow-2xl p-6 text-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Supervisor Sign In</h2>
                <p className="text-xs text-slate-400">Enter credentials to open command console</p>
              </div>
              <span className="badge-info text-[10px]">AUTH REQUIRED</span>
            </div>

            {configError && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                {configError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email Address</label>
              <input
                className="input-spot"
                type="email"
                required
                placeholder="supervisor@spot.security"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={signInDisabled}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Password</label>
              <input
                className="input-spot"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={signInDisabled}
              />
            </div>

            {error && <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-2.5 text-xs text-rose-300 font-medium">{error}</div>}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">
                Remember session on this browser
              </label>
            </div>

            <button type="submit" disabled={signInDisabled} className="btn-primary w-full py-2.5 text-xs font-bold justify-center">
              {busy ? (
                'Verifying Credentials...'
              ) : (
                <>
                  Sign In to Command Center <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
