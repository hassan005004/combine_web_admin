import { useState } from 'react';
import { request } from '../api';

export function ProfileSettings() {
  const user = window.adminUser || {};
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    current_password: '',
  });
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const data = await request('/admin-api/settings/profile', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      window.adminUser = data.user || { name: form.name, email: form.email };
      setForm((current) => ({ ...current, current_password: '' }));
      setStatus('success');
      setMessage('Profile updated successfully.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to update profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 md:text-3xl">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your admin name and email address.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={submit} className="grid gap-4">
          <FieldLabel label="Name">
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            />
          </FieldLabel>

          <FieldLabel label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            />
          </FieldLabel>

          <FieldLabel label="Current Password">
            <input
              type="password"
              value={form.current_password}
              onChange={(event) => update('current_password', event.target.value)}
              placeholder="Required when changing email"
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            />
          </FieldLabel>

          {status && <StatusBanner type={status} message={message} />}

          <div>
            <button type="submit" disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
              {busy ? 'Saving...' : 'Save Profile'}
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
