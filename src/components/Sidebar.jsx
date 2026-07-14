import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'D', accent: 'bg-cyan-400', meta: 'Overview' },
  { to: '/guards', label: 'Personnel', icon: 'P', accent: 'bg-emerald-400', meta: 'Access' },
  { to: '/checkpoints', label: 'Checkpoints', icon: 'C', accent: 'bg-sky-400', meta: 'QR points' },
  { to: '/routes', label: 'Routes', icon: 'R', accent: 'bg-indigo-400', meta: 'Sequences' },
  { to: '/schedules', label: 'Schedules', icon: 'S', accent: 'bg-amber-400', meta: 'Shifts' },
  { to: '/logs', label: 'Patrol Logs', icon: 'L', accent: 'bg-teal-400', meta: 'Scans' },
  { to: '/incidents', label: 'Incidents', icon: 'I', accent: 'bg-rose-400', meta: 'Alerts' }
];

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function Sidebar() {
  const { user, profile, logout, updateAccountProfile, changePassword } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDisplayName(profile?.name || '');
  }, [profile?.name]);

  const resetMessages = () => {
    setNotice('');
    setError('');
  };

  const saveProfile = async () => {
    resetMessages();
    setBusy(true);
    try {
      await updateAccountProfile({ name: displayName });
      setNotice('Profile updated.');
    } catch (err) {
      setError(err.message || 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    resetMessages();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setBusy(true);
    try {
      await changePassword(passwords);
      setPasswords(emptyPasswords);
      setNotice('Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Unable to change password.');
    } finally {
      setBusy(false);
    }
  };

  const closeProfile = () => {
    setProfileOpen(false);
    setPasswords(emptyPasswords);
    resetMessages();
  };

  return (
    <aside className="flex shrink-0 flex-col border-b border-cyan-950/30 bg-slate-950 text-white md:sticky md:top-0 md:h-screen md:w-[5.25rem] md:overflow-hidden md:border-b-0 md:border-r xl:w-64">
      <div className="shrink-0 p-4 xl:p-5">
        <div className="flex items-center justify-center gap-3 xl:justify-start">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-400 text-xs font-semibold text-slate-950">SP</div>
          <div className="hidden min-w-0 xl:block">
            <div className="text-lg font-semibold text-white">S.P.O.T.</div>
            <div className="mt-0.5 text-xs text-slate-400">Security Patrol Operations & Tracking</div>
          </div>
        </div>
        <div className="mt-3 hidden items-center gap-2 rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-300 ring-1 ring-inset ring-emerald-400/20 xl:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 security-pulse" />
          Live System
        </div>
      </div>

      <nav className="scroll-invisible flex gap-1 overflow-x-auto px-3 pb-4 md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:px-3 md:py-2">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            title={n.label}
            className={({ isActive }) =>
              `group relative flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors md:justify-center xl:justify-start ${
                isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-cyan-900/30 hover:text-white'
              }`
            }
          >
            <span className={`absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-sm ${n.accent} xl:static xl:translate-y-0`} />
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-current/20 bg-white/5 text-[10px] font-semibold">{n.icon}</span>
            <span className="min-w-0 md:hidden xl:block">
              <span className="block truncate">{n.label}</span>
              <span className="hidden text-[10px] font-normal text-slate-500 group-hover:text-cyan-100 xl:block">{n.meta}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden shrink-0 border-t border-white/10 p-3 md:block xl:p-4">
        <div className="mb-4 hidden rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 xl:block">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase text-cyan-100">
            <span>System Load</span>
            <span>Nominal</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-white/10">
            <div className="h-full w-2/3 rounded bg-cyan-300" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          title="Profile settings"
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-left transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/10 xl:justify-start"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-cyan-400 text-xs font-semibold text-slate-950">
            {(profile?.name || user?.email || 'S')[0]?.toUpperCase()}
          </span>
          <span className="hidden min-w-0 xl:block">
            <span className="block truncate text-sm font-medium text-white">{profile?.name || 'Supervisor'}</span>
            <span className="block truncate text-xs capitalize text-slate-400">{profile?.role || 'supervisor'}</span>
          </span>
        </button>

        <button
          onClick={logout}
          title="Sign out"
          className="grid w-full place-items-center rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white xl:block"
        >
          <span className="xl:hidden">SO</span>
          <span className="hidden xl:inline">Sign out</span>
        </button>
      </div>

      <Modal
        open={profileOpen}
        onClose={closeProfile}
        title="Profile Settings"
        eyebrow="Account"
        description="Manage your supervisor profile, password, and current session."
        size="xl"
        footer={<>
          <button className="btn-ghost" onClick={closeProfile}>Close</button>
          <button className="btn-primary" onClick={logout}>Sign out</button>
        </>}
      >
        {(notice || error) && (
          <div className={`mb-4 rounded-md border p-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          <section className="rounded-lg border border-cyan-100 bg-cyan-50/70 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-700 text-sm font-semibold text-white">
                {(profile?.name || user?.email || 'S')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-950">{profile?.name || 'Supervisor'}</div>
                <div className="truncate text-xs text-slate-500">{user?.email}</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 rounded-md bg-white/70 px-3 py-2">
                <span className="text-slate-500">Role</span>
                <span className="font-medium capitalize text-slate-900">{profile?.role || 'supervisor'}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-md bg-white/70 px-3 py-2">
                <span className="text-slate-500">User ID</span>
                <span className="truncate font-mono text-xs text-slate-700">{user?.uid}</span>
              </div>
            </div>
          </section>

          <section className="form-grid">
            <div className="field">
              <label className="label">Display Name</label>
              <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <p className="field-hint">This updates your command center profile record.</p>
              <button className="btn-primary mt-3" onClick={saveProfile} disabled={busy}>Save Profile</button>
            </div>

            <div className="field">
              <label className="label">Change Password</label>
              <input
                className="input mb-3"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="Current password"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="New password"
                />
                <input
                  className="input"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <p className="field-hint">Firebase requires your current password before applying a new one.</p>
              <button className="btn-primary mt-3" onClick={savePassword} disabled={busy}>Update Password</button>
            </div>
          </section>
        </div>
      </Modal>
    </aside>
  );
}
