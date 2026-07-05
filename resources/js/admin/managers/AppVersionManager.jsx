import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Toggle } from '../components/FormControls';

export function AppVersionManager({ entry, reload }) {
  const [form, setForm] = useState({
    app_version:   entry.app_version   || '',
    min_build_code: entry.min_build_code || '',
    force_update:  entry.force_update  ?? false,
  });
  const [busy, setBusy]       = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  // Keep form in sync if entry prop changes (e.g. after reload)
  useEffect(() => {
    setForm({
      app_version:    entry.app_version    || '',
      min_build_code: entry.min_build_code || '',
      force_update:   entry.force_update   ?? false,
    });
  }, [entry.app_version, entry.min_build_code, entry.force_update]);

  const update = (key, value) => setForm((c) => ({ ...c, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await request(`/admin-api/entries/${entry.id}`, {
        method: 'PUT',
        // Send only the version fields merged with the existing entry data
        body: JSON.stringify({ ...entry, ...form }),
      });
      setSaved(true);
      await reload();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-5 max-w-xl">
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Control what app version is required. When Force Update is enabled, users running
        a build code below the minimum will see an update prompt and cannot proceed until
        they upgrade.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Latest Version Name"
          placeholder="e.g. 2.4.1"
          hint="shown to users in update prompt"
          value={form.app_version}
          onChange={(v) => update('app_version', v)}
        />
        <Input
          label="Minimum Build Code"
          placeholder="e.g. 24"
          hint="Android versionCode integer"
          value={form.min_build_code}
          onChange={(v) => update('min_build_code', v)}
        />
        <Toggle
          label="Force Update"
          checked={!!form.force_update}
          onChange={(v) => update('force_update', v)}
          onText="Enabled"
          offText="Disabled"
        />

        {form.force_update && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            Users with a build code below <strong>{form.min_build_code || '(not set)'}</strong> will
            be required to update before using the app.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
            Version settings saved.
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save Version Settings'}
        </button>
      </form>
    </div>
  );
}
