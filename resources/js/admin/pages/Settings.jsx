import { useState } from 'react';
import { request } from '../api';

export function Settings() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account credentials.</p>
      </div>
      <EmailForm />
      <PasswordForm />
    </div>
  );
}

// ─── Change Email ─────────────────────────────────────────────────────────────

function EmailForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await request('/admin-api/settings/email', { method: 'POST', body: JSON.stringify(form) });
      setStatus('success');
      setMessage('Email updated successfully.');
      setForm({ email: '', password: '' });
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to update email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 font-semibold text-gray-800 dark:text-gray-100">Change Email</h2>
      <form onSubmit={submit} className="grid gap-4">
        <FieldLabel label="New Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            placeholder="new@example.com"
            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
          />
        </FieldLabel>
        <FieldLabel label="Current Password">
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
            placeholder="Enter your current password"
            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
          />
        </FieldLabel>
        {status && <StatusBanner type={status} message={message} />}
        <div>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-60">
            {busy ? 'Saving…' : 'Update Email'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────

function PasswordForm() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.password_confirmation) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await request('/admin-api/settings/password', { method: 'POST', body: JSON.stringify(form) });
      setStatus('success');
      setMessage('Password updated successfully.');
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 font-semibold text-gray-800 dark:text-gray-100">Change Password</h2>
      <form onSubmit={submit} className="grid gap-4">
        <FieldLabel label="Current Password">
          <input
            type="password"
            required
            value={form.current_password}
            onChange={(e) => setForm((c) => ({ ...c, current_password: e.target.value }))}
            placeholder="Your current password"
            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
          />
        </FieldLabel>
        <FieldLabel label="New Password">
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
            placeholder="At least 8 characters"
            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
          />
        </FieldLabel>
        <FieldLabel label="Confirm New Password">
          <input
            type="password"
            required
            value={form.password_confirmation}
            onChange={(e) => setForm((c) => ({ ...c, password_confirmation: e.target.value }))}
            placeholder="Repeat new password"
            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
          />
        </FieldLabel>
        {status && <StatusBanner type={status} message={message} />}
        <div>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-60">
            {busy ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ label, children }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {children}
    </label>
  );
}

function StatusBanner({ type, message }) {
  return (
    <div className={`rounded-lg px-4 py-2 text-sm ${type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'}`}>
      {message}
    </div>
  );
}
