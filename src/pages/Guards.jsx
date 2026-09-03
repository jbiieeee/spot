import React, { useState } from 'react';
import Layout from '../components/Layout';
import GuardAvatar from '../components/GuardAvatar';
import { useSpot } from '../context/SpotContext';
import { createIsolatedAuth, auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import {
  Users, Search, Battery, ShieldCheck, Eye, EyeOff, Plus, Pencil, Trash2, X,
  Check, AlertTriangle, Smartphone, Link, Unlink, KeyRound, Zap, Lock, RefreshCw, Mail
} from 'lucide-react';

// ─── Reusable Modal Shell ────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#1E293B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Field Component ─────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

// ─── Guard Form Fields ────────────────────────────────────────────────────────
function GuardFormFields({ form, onChange, sites = [], isAddMode = false }) {
  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange('photo', e.target?.result || '');
    reader.readAsDataURL(file);
  };

  const handleSiteChange = (e) => {
    const selectedId = e.target.value;
    const siteObj = sites.find((s) => s.id === selectedId);
    onChange('siteId', selectedId);
    if (siteObj) {
      onChange('siteName', siteObj.name);
      if (siteObj.client) onChange('client', siteObj.client);
    }
  };

  return (
    <div className="space-y-4">
      {isAddMode && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <KeyRound className="h-3.5 w-3.5" /> Android App Login Credentials
          </div>
          <p className="text-[11px] text-slate-400">These credentials will be used by the guard to log in to the Android app.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email *">
              <input className="input-spot" type="email" value={form.email || ''} onChange={e => onChange('email', e.target.value)} placeholder="guard@spot.com" />
            </Field>
            <Field label="Password *">
              <input className="input-spot" type="password" value={form.password || ''} onChange={e => onChange('password', e.target.value)} placeholder="min. 6 characters" />
            </Field>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *">
          <input className="input-spot" value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="e.g. Juan dela Cruz" />
        </Field>
        <Field label="Phone Number">
          <input className="input-spot" value={form.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+63 917 000 0000" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Assigned Site">
          {sites.length > 0 ? (
            <select className="input-spot" value={form.siteId || ''} onChange={handleSiteChange}>
              <option value="">— Select a site —</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : (
            <input className="input-spot" value={form.siteName} onChange={e => onChange('siteName', e.target.value)} placeholder="e.g. Eastwood Mall" />
          )}
        </Field>
        <Field label="Client">
          <input className="input-spot" value={form.client} onChange={e => onChange('client', e.target.value)} placeholder="e.g. ETON Properties" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Shift Schedule">
          <select className="input-spot" value={form.shift} onChange={e => onChange('shift', e.target.value)}>
            <option>Day Shift (06:00 - 18:00)</option>
            <option>Night Shift (18:00 - 06:00)</option>
            <option>Mid Shift (10:00 - 22:00)</option>
          </select>
        </Field>
        <Field label="Status">
          <select className="input-spot" value={form.status} onChange={e => onChange('status', e.target.value)}>
            <option>Idle</option>
            <option>On Patrol</option>
            <option>Off Duty</option>
          </select>
        </Field>
      </div>

      <Field label="Profile Photo (optional)">
        <div className="flex items-center gap-3">
          <GuardAvatar photo={form.photo} name={form.name || 'G'} size="h-12 w-12" />
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600" />
        </div>
      </Field>
    </div>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <Modal
      title="Confirm Guard Removal"
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className="btn-secondary text-xs">Cancel</button>
          <button onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition">Delete Guard</button>
        </>
      }
    >
      <p className="text-sm text-slate-300 leading-relaxed">
        Are you sure you want to remove <strong className="text-white font-bold">{label}</strong> from the roster? This action cannot be undone.
      </p>
    </Modal>
  );
}

// ─── Assign Device Modal ──────────────────────────────────────────────────────
function AssignDeviceModal({ guard, guards = [], devices = [], onClose, onAssign }) {
  const [selected, setSelected] = useState(guard.deviceId || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onAssign(guard.id, selected || null);
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      title="Assign Device to Guard"
      subtitle={`Binding a phone/device to ${guard.name}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex items-center gap-2">
            {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Link className="h-3.5 w-3.5" />}
            {selected ? 'Bind Device' : 'Remove Binding'}
          </button>
        </>
      }
    >
      <div className={`flex items-center gap-3 rounded-xl p-3 border ${guard.deviceId ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-700'}`}>
        <Smartphone className={`h-5 w-5 ${guard.deviceId ? 'text-emerald-400' : 'text-slate-500'}`} />
        <div>
          <div className="text-xs font-semibold text-slate-300">Current Device</div>
          <div className={`text-xs font-mono ${guard.deviceId ? 'text-emerald-400' : 'text-slate-500'}`}>
            {guard.deviceId || 'No device assigned'}
          </div>
        </div>
      </div>

      <Field label="Select a Registered Device">
        <select
          className="input-spot"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">— None (unassign) —</option>
          {devices.map(d => {
            const holder = guards.find(g => g.deviceId === d.deviceId && g.id !== guard.id);
            return (
              <option key={d.id} value={d.deviceId}>
                {d.deviceModel} ({d.deviceId}) {holder ? `[Held by ${holder.name}]` : '[Available]'}
              </option>
            );
          })}
        </select>
      </Field>

      {devices.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          No registered devices found. Install the app on a phone to register it.
        </div>
      )}

      {devices.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Hardware Phones</div>
          {devices.map(d => {
            const isCurrent = d.deviceId === guard.deviceId;
            const otherHolder = guards.find(g => g.deviceId === d.deviceId && g.id !== guard.id);

            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.deviceId === selected ? '' : d.deviceId)}
                className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selected === d.deviceId
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                }`}
              >
                <Smartphone className={`h-5 w-5 shrink-0 ${selected === d.deviceId ? 'text-blue-400' : 'text-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{d.deviceModel}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/30">
                        Current
                      </span>
                    )}
                    {otherHolder && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">
                        With {otherHolder.name}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{d.deviceId}</div>
                  <div className="text-[10px] text-slate-500">{d.osVersion}</div>
                </div>
                <div className="text-[10px] text-slate-500 shrink-0">
                  {d.lastActive ? d.lastActive.toLocaleDateString() : 'Active'}
                </div>
                {selected === d.deviceId && (
                  <Check className="h-4 w-4 text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ─── Admin Change Password Modal ──────────────────────────────────────────────
function ChangePasswordModal({ guard, onClose, onSave, addToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowPassword(true);
  };

  const handleSave = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave(guard.id, newPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update guard password.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!guard.email) {
      setError('Guard has no email address registered on file.');
      return;
    }
    setError('');
    setEmailStatus('sending');
    try {
      await sendPasswordResetEmail(auth, guard.email.trim());
      setEmailStatus('sent');
      addToast('Reset Email Sent', `Password reset link sent to ${guard.email}`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
      setEmailStatus('');
    }
  };

  return (
    <Modal
      title="Admin Password Management"
      subtitle={`Change or reset mobile login password for ${guard.name}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !newPassword}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            {saving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            Update Guard Password
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Guard Profile Overview */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <GuardAvatar photo={guard.photo} name={guard.name} size="h-10 w-10" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{guard.name}</div>
            <div className="text-[11px] text-slate-400 font-mono truncate">{guard.email || 'No email attached'}</div>
          </div>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-blue-400 border border-slate-700">
            {guard.id}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direct Password Form */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-blue-400" /> Set New Password
            </label>
            <button
              type="button"
              onClick={generateRandomPassword}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Auto-Generate
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-spot pr-10 font-mono text-xs"
              placeholder="Enter new password (min. 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-spot font-mono text-xs"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            When updated, the guard can use this new password immediately to log in on the Android mobile app.
          </p>
        </div>

        {/* Email Password Reset Alternative */}
        {guard.email && (
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Send Official Reset Email</div>
                <div className="text-[10px] text-slate-400">Sends a secure reset link to {guard.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={emailStatus === 'sending'}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 text-emerald-400 hover:text-white"
            >
              {emailStatus === 'sending' ? (
                'Sending...'
              ) : emailStatus === 'sent' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Sent!
                </>
              ) : (
                'Send Link'
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

const EMPTY_GUARD = {
  name: '',
  email: '',
  password: '',
  phone: '',
  siteId: '',
  siteName: '',
  client: '',
  shift: 'Day Shift (06:00 - 18:00)',
  status: 'Idle',
  photo: ''
};

// ─── Main Guards Page ─────────────────────────────────────────────────────────
export default function Guards() {
  const {
    guards,
    sites,
    devices,
    openGuardDrawer,
    addGuard,
    updateGuard,
    updateGuardPassword,
    deleteGuard,
    assignDeviceToGuard,
    addToast
  } = useSpot();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deviceTarget, setDeviceTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [addForm, setAddForm] = useState(EMPTY_GUARD);
  const [editForm, setEditForm] = useState(EMPTY_GUARD);
  const [saving, setSaving] = useState(false);
  const [authError, setAuthError] = useState('');

  const filteredGuards = guards.filter((guard) => {
    const matchesSearch =
      (guard.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guard.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guard.siteName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || guard.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setAuthError('');
    setSaving(true);

    if (addForm.email?.trim() && addForm.password?.trim()) {
      const { auth: isolatedAuth, dispose } = createIsolatedAuth();
      try {
        const cred = await createUserWithEmailAndPassword(
          isolatedAuth,
          addForm.email.trim(),
          addForm.password.trim()
        );
        await updateProfile(cred.user, { displayName: addForm.name.trim() });
        await addGuard({ ...addForm, id: cred.user.uid, email: addForm.email.trim() });
        addToast('Guard Registered', `${addForm.name} — Firebase Auth account created. Guard can now log in to the Android app.`, 'success');
      } catch (err) {
        setAuthError(err.message || 'Failed to create login account.');
        setSaving(false);
        dispose();
        return;
      } finally {
        dispose();
      }
    } else {
      await addGuard(addForm);
    }

    setSaving(false);
    setAddForm(EMPTY_GUARD);
    setAuthError('');
    setShowAdd(false);
  };

  const openEdit = (guard) => {
    setEditForm({
      name: guard.name || '',
      email: guard.email || '',
      phone: guard.phone || '',
      siteId: guard.siteId || '',
      siteName: guard.siteName || '',
      client: guard.client || '',
      shift: guard.shift || 'Day Shift (06:00 - 18:00)',
      status: guard.status || 'Idle',
      photo: guard.photo || ''
    });
    setEditTarget(guard);
  };

  const handleEdit = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    await updateGuard(editTarget.id, editForm);
    setSaving(false);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteGuard(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <Layout
      title="Security Guards Roster"
      subtitle="Enterprise Active Roster, Battery Telemetry, Face Enrollment, Device Binding & Credentials"
      actions={
        <button
          onClick={() => { setShowAdd(true); setAuthError(''); }}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Guard
        </button>
      }
    >
      <div className="space-y-6">
        {/* Top Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card-spot p-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              className="input-spot pl-10"
              placeholder="Search by guard name, ID, or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {['All', 'On Patrol', 'Idle', 'Off Duty'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Guards Table */}
        <div className="card-spot p-0 overflow-hidden border border-slate-800">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Guard Personnel</th>
                  <th className="px-6 py-4">Site & Client</th>
                  <th className="px-6 py-4">Shift Schedule</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Battery</th>
                  <th className="px-6 py-4">GPS Accuracy</th>
                  <th className="px-6 py-4">Face Biometrics</th>
                  <th className="px-6 py-4">Assigned Phone</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredGuards.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700">
                          <Users className="h-7 w-7 text-slate-500" />
                        </div>
                        <div className="text-sm text-slate-400 font-semibold">No guards found</div>
                        <div className="text-xs text-slate-500 max-w-xs text-center">
                          Add a guard or try a different search filter to view your security force.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGuards.map((guard) => (
                    <tr key={guard.id} className="hover:bg-slate-800/40 transition">
                      {/* Guard Avatar & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <GuardAvatar photo={guard.photo} name={guard.name} size="h-10 w-10" />
                          <div>
                            <div className="font-bold text-white text-sm">{guard.name}</div>
                            <div className="text-[10px] text-blue-400 font-mono">{guard.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Site & Client */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-white">{guard.siteName}</div>
                        <div className="text-[10px] text-slate-400">{guard.client}</div>
                      </td>

                      {/* Shift */}
                      <td className="px-6 py-4 text-xs text-slate-300">{guard.shift}</td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          guard.status === 'On Patrol'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : guard.status === 'Emergency'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {guard.status}
                        </span>
                      </td>

                      {/* Real-time Battery Telemetry */}
                      <td className="px-6 py-4">
                        {guard.battery != null ? (
                          <div className="flex items-center gap-1.5">
                            <Battery
                              className={`h-4 w-4 ${
                                guard.battery <= 20
                                  ? 'text-rose-400 animate-pulse'
                                  : guard.battery <= 40
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            />
                            <span
                              className={`font-bold text-xs ${
                                guard.battery <= 20
                                  ? 'text-rose-400'
                                  : guard.battery <= 40
                                  ? 'text-amber-400'
                                  : 'text-white'
                              }`}
                            >
                              {guard.battery}%
                            </span>
                            {guard.isCharging && (
                              <Zap className="h-3 w-3 text-amber-400 animate-pulse" title="Device is charging" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">—</span>
                        )}
                      </td>

                      {/* GPS Accuracy */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-300">{guard.gpsAccuracy}</td>

                      {/* Face Verified */}
                      <td className="px-6 py-4">
                        {guard.faceVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                            <ShieldCheck className="h-3 w-3" /> VERIFIED
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">PENDING</span>
                        )}
                      </td>

                      {/* Device */}
                      <td className="px-6 py-4">
                        {guard.deviceId ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 font-mono">
                            <Smartphone className="h-3 w-3" />
                            {guard.deviceId.substring(0, 10)}…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                            <Unlink className="h-3 w-3" /> Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions with Change Password Power */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openGuardDrawer(guard)}
                            title="Inspect Guard Telemetry Drawer"
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-blue-400 hover:text-white hover:border-blue-500 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(guard)}
                            title="Edit Guard Details"
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-amber-400 hover:text-white hover:border-amber-500 transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setPasswordTarget(guard)}
                            title="Admin Power: Change Guard Password"
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-cyan-400 hover:text-white hover:border-cyan-500 transition shadow-sm"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeviceTarget(guard)}
                            title="Assign Hardware Phone"
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-violet-400 hover:text-white hover:border-violet-500 transition"
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(guard)}
                            title="Delete Guard"
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-rose-400 hover:text-white hover:border-rose-500 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        {filteredGuards.length > 0 && (
          <div className="text-xs text-slate-500 text-right">
            Showing <span className="text-slate-300 font-semibold">{filteredGuards.length}</span> of{' '}
            <span className="text-slate-300 font-semibold">{guards.length}</span> guards
          </div>
        )}
      </div>

      {/* ── Add Guard Modal ───────────────────────────────────── */}
      {showAdd && (
        <Modal
          title="Register New Guard"
          subtitle="Add a new guard to the personnel roster & create app credentials"
          onClose={() => { setShowAdd(false); setAddForm(EMPTY_GUARD); setAuthError(''); }}
          footer={
            <>
              <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_GUARD); setAuthError(''); }} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAdd} disabled={saving || !addForm.name.trim()} className="btn-primary text-xs flex items-center gap-2">
                {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-3.5 w-3.5" />}
                Save Guard
              </button>
            </>
          }
        >
          {authError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}
          <GuardFormFields form={addForm} onChange={(k, v) => setAddForm(f => ({ ...f, [k]: v }))} sites={sites} isAddMode={true} />
        </Modal>
      )}

      {/* ── Edit Guard Modal ──────────────────────────────────── */}
      {editTarget && (
        <Modal
          title="Edit Guard Record"
          subtitle={`Editing: ${editTarget.name}`}
          onClose={() => setEditTarget(null)}
          footer={
            <>
              <button onClick={() => setEditTarget(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleEdit} disabled={saving || !editForm.name.trim()} className="btn-primary text-xs flex items-center gap-2">
                {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </>
          }
        >
          <GuardFormFields form={editForm} onChange={(k, v) => setEditForm(f => ({ ...f, [k]: v }))} sites={sites} isAddMode={false} />
        </Modal>
      )}

      {/* ── Admin Change Password Modal ──────────────────────── */}
      {passwordTarget && (
        <ChangePasswordModal
          guard={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSave={updateGuardPassword}
          addToast={addToast}
        />
      )}

      {/* ── Assign Device Modal ───────────────────────────────── */}
      {deviceTarget && (
        <AssignDeviceModal
          guard={deviceTarget}
          guards={guards}
          devices={devices}
          onClose={() => setDeviceTarget(null)}
          onAssign={assignDeviceToGuard}
        />
      )}

      {/* ── Delete Confirmation ───────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}
