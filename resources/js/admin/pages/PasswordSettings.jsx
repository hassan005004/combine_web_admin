import { useState } from 'react';
import { request } from '../api';

export function PasswordSettings() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

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
      await request('/admin-api/settings/password', {
        method: 'POST',
        body: JSON.stringify(form),
      });
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
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 md:text-3xl">Password Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Change the password used for your admin account.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={submit} className="grid gap-4">
          <FieldLabel label="Current Password">
            <input
              type="password"
              required
              value={form.current_password}
              onChange={(event) => update('current_password', event.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            />
          </FieldLabel>

          <FieldLabel label="New Password">
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            />
          </FieldLabel>

          <FieldLabel label="Confirm New Password">
            <input
              type="password"
              required
              value={form.password_confirmation}
              onChange={(event) => update('password_confirmation', event.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            />
          </FieldLabel>

          {status && <StatusBanner type={status} message={message} />}

          <div>
            <button type="submit" disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
              {busy ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
