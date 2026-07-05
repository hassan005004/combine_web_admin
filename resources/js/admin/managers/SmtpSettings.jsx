import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Select, Toggle } from '../components/FormControls';

const blank = {
  admin_email: '',
  host: '',
  port: 587,
  encryption: 'tls',
  username: '',
  password: '',
  from_email: '',
  from_name: '',
  is_active: true,
};

export function SmtpSettings({ entry, setting, reload, setHeaderAction }) {
  const [form, setForm] = useState({ ...blank, ...(setting || {}), password: '' });
  const [testEmail, setTestEmail] = useState(setting?.admin_email || '');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setForm({ ...blank, ...(setting || {}), password: '' });
    setTestEmail(setting?.admin_email || '');
  }, [setting]);

  useEffect(() => {
    setHeaderAction?.(null);
    return () => setHeaderAction?.(null);
  }, [setHeaderAction]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await request(`/admin-api/entries/${entry.id}/smtp-setting`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      await request(`/admin-api/entries/${entry.id}/smtp-setting/test`, {
        method: 'POST',
        body: JSON.stringify({ to_email: testEmail || form.admin_email }),
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-5">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input label="Admin Email" type="email" value={form.admin_email} onChange={(value) => update('admin_email', value)} required />
          <Input label="SMTP Host" value={form.host} onChange={(value) => update('host', value)} required />
          <Input label="Port" type="number" value={form.port} onChange={(value) => update('port', Number(value))} required />
          <Select
            label="Encryption"
            value={form.encryption || ''}
            onChange={(value) => update('encryption', value)}
            options={[['tls', 'TLS'], ['ssl', 'SSL'], ['', 'None']]}
          />
          <Input label="Username" value={form.username} onChange={(value) => update('username', value)} />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) => update('password', value)}
            required={!setting}
            hint={setting ? 'leave empty to keep saved' : ''}
          />
          <Input label="From Email" type="email" value={form.from_email} onChange={(value) => update('from_email', value)} required />
          <Input label="From Name" value={form.from_name} onChange={(value) => update('from_name', value)} />
          <Toggle
            label="SMTP Status"
            checked={Boolean(form.is_active)}
            onChange={(value) => update('is_active', value)}
            onText="Enabled"
            offText="Disabled"
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-white disabled:opacity-60">
            {busy ? 'Saving...' : 'Save SMTP Setting'}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-700">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <Input label="Test Email" type="email" value={testEmail} onChange={setTestEmail} hint="defaults to admin email" />
          <div className="flex items-end">
            <button
              type="button"
              disabled={testing || !setting}
              onClick={test}
              className="min-h-10 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
            >
              {testing ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
