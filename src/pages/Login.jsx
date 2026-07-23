import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const ATTEMPT_KEY = 'spot.auth.attempts';
const MAX_ATTEMPTS = 5;
const WARNING_AT = 3;
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
  const [securityNotice, setSecurityNotice] = useState('');
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
    setSecurityNotice('');

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
        const remaining = MAX_ATTEMPTS - nextCount;
        setError(err.message || 'Login failed');
        if (nextCount >= WARNING_AT) {
          setSecurityNotice(`Warning: ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before this device is locked for 1 hour.`);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const locked = attemptState.lockedUntil > now.getTime();
  const signInDisabled = busy || !!configError || locked;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptState.count);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-4 text-slate-900">
      <div className="security-grid absolute inset-0 opacity-95" />
      <div className="security-scanline pointer-events-none absolute inset-x-0 top-0 h-28 bg-cyan-400/10 blur-xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-300/50" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center gap-6 lg:grid-cols-[1fr_420px]">
        <section className="login-enter hidden text-white lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cyan-100 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 security-pulse" />
            Verified Command Access
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white">
            S.P.O.T. Command Center
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            Production supervisor access for patrol visibility, incident response, checkpoint integrity, and shift operations.
          </p>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-4 backdrop-blur">
              <div className="text-xs uppercase text-cyan-200">Session</div>
              <div className="mt-2 text-xl font-semibold text-white">Encrypted</div>
            </div>
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur">
              <div className="text-xs uppercase text-emerald-200">Access</div>
              <div className="mt-2 text-xl font-semibold text-white">Verified</div>
            </div>
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 backdrop-blur">
              <div className="text-xs uppercase text-amber-200">Local Time</div>
              <div className="mt-2 text-xl font-semibold text-white">{formatTime(now)}</div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="login-enter mb-8 text-white lg:hidden">
            <div className="relative mb-3 inline-grid h-12 w-12 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-400/40">
              <span className="security-pulse absolute inset-0 rounded-lg ring-1 ring-cyan-300/60" />
              <span className="relative">SP</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">S.P.O.T.</h1>
            <p className="mt-1 text-sm text-slate-300">Security Patrol Operations & Tracking</p>
          </div>

          <form
            onSubmit={submit}
            aria-busy={busy}
            className="login-card-enter overflow-hidden rounded-lg border border-cyan-100/80 bg-white/95 shadow-2xl shadow-cyan-950/25 backdrop-blur"
          >
            <div className="relative flex h-1.5 overflow-hidden bg-slate-100">
              <span className="flex-1 bg-cyan-600" />
              <span className="w-16 bg-emerald-500" />
              <span className="w-10 bg-amber-400" />
              <span className="security-sweep absolute inset-y-0 left-0 w-1/2 bg-white/45" />
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Supervisor Sign In</h2>
                  <p className="mt-1 text-sm text-slate-500">Authenticate to open the live command center</p>
                </div>
                <span className="mt-0.5 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  Secure
                </span>
              </div>

              {configError && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <b>Configuration required</b> - Add your Firebase web app values to <code className="rounded bg-amber-100 px-1">.env</code> before signing in.
                </div>
              )}

              <label className="label">Email</label>
              <input className="input mb-4" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={signInDisabled} />

              <label className="label">Password</label>
              <input className="input mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={signInDisabled} />

              {error && <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-600">{error}</div>}
              {securityNotice && <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">{securityNotice}</div>}
              {locked && (
                <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                  Device lock active. Try again in {formatRemaining(attemptState.lockedUntil - now.getTime())}.
                </div>
              )}

              <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  disabled={busy}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">Remember this device</span>
                  <span className="block text-xs text-slate-500">Keep the supervisor session active on this browser.</span>
                </span>
              </label>

              <button type="submit" disabled={signInDisabled} className="btn-primary relative w-full justify-center overflow-hidden">
                {busy && <span className="sign-in-progress absolute inset-y-0 left-0 w-2/3 bg-white/25" />}
                <span className="relative flex items-center gap-2">
                  {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                  {busy ? 'Verifying access...' : 'Sign In'}
                </span>
              </button>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] uppercase text-slate-500">
                <div className="rounded-md bg-slate-100 px-2 py-2">Auth</div>
                <div className="rounded-md bg-cyan-50 px-2 py-2 text-cyan-800">Realtime</div>
                <div className={`rounded-md px-2 py-2 ${remainingAttempts <= 2 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {remainingAttempts}/{MAX_ATTEMPTS} Tries
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
