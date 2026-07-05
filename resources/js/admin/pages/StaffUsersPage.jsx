import { useEffect, useMemo, useState } from 'react';
import { request } from '../api';
import { ActionGroup, DeleteButton, EditButton } from '../components/DataRows';

const blankForm = {
  name: '',
  email: '',
  password: '',
  entity_shares: [],
};

export function StaffUsersPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [screen, setScreen] = useState('list');
  const [busy, setBusy] = useState(false);

  async function load() {
    setData(await request('/admin-api/staff-users'));
  }

  useEffect(() => {
    load();
  }, []);

  function createUser() {
    setForm(blankForm);
    setEditingId(null);
    setScreen('form');
  }

  function editUser(user) {
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      entity_shares: (user.staff_entities || []).map((item) => ({
        domain_id: item.domain_id,
        share_percent: item.share_percent ?? 0,
      })),
    });
    setEditingId(user.id);
    setScreen('form');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);

    try {
      const url = editingId ? `/admin-api/staff-users/${editingId}` : '/admin-api/staff-users';
      const payload = { ...form };
      if (editingId && !payload.password) {
        delete payload.password;
      }

      await request(url, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      await load();
      setScreen('list');
      setEditingId(null);
      setForm(blankForm);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return <div className="p-6 text-sm text-gray-400">Loading...</div>;
  }

  if (screen === 'form') {
    return (
      <StaffUserForm
        form={form}
        setForm={setForm}
        entries={data.entries || []}
        editingId={editingId}
        busy={busy}
        onSubmit={submit}
        onCancel={() => setScreen('list')}
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Staff Users</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Website and panel users are separate from app users. Link each staff user to entries with their share.
          </p>
        </div>
        <button type="button" onClick={createUser} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
          Add Staff User
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Linked Entries</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {(data.users || []).map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{user.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                <td className="px-4 py-3">
                  <EntityBadges items={user.staff_entities || []} />
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionGroup>
                    <EditButton label={`Edit ${user.name}`} onClick={() => editUser(user)} />
                    <DeleteButton url={`/admin-api/staff-users/${user.id}`} reload={load} />
                  </ActionGroup>
                </td>
              </tr>
            ))}
            {(data.users || []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan="4">No staff users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StaffUserForm({ form, setForm, entries, editingId, busy, onSubmit, onCancel }) {
  const shareMap = useMemo(() => {
    return new Map((form.entity_shares || []).map((item) => [Number(item.domain_id), item]));
  }, [form.entity_shares]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function toggleEntry(entryId, checked) {
    setForm((current) => {
      const existing = current.entity_shares || [];
      if (!checked) {
        return { ...current, entity_shares: existing.filter((item) => Number(item.domain_id) !== Number(entryId)) };
      }

      if (existing.some((item) => Number(item.domain_id) === Number(entryId))) {
        return current;
      }

      return {
        ...current,
        entity_shares: [...existing, { domain_id: entryId, share_percent: 0 }],
      };
    });
  }

  function updateShare(entryId, sharePercent) {
    setForm((current) => ({
      ...current,
      entity_shares: (current.entity_shares || []).map((item) => (
        Number(item.domain_id) === Number(entryId)
          ? { ...item, share_percent: sharePercent }
          : item
      )),
    }));
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          {editingId ? 'Edit Staff User' : 'Add Staff User'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Assign entries and share values for this panel user.</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Name" value={form.name} onChange={(value) => update('name', value)} required />
          <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
          <Field
            label={editingId ? 'New Password' : 'Password'}
            type="password"
            value={form.password}
            onChange={(value) => update('password', value)}
            required={!editingId}
            hint={editingId ? 'Leave blank to keep current password.' : ''}
          />
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Linked Entries</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Use</th>
                  <th className="px-3 py-2 text-left">Entry</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry) => {
                  const selected = shareMap.has(entry.id);
                  return (
                    <tr key={entry.id}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => toggleEntry(entry.id, event.target.checked)}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800 dark:text-gray-100">{entry.title}</div>
                        <div className="text-xs text-gray-500">{entry.application_id}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{entry.entry_type}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={!selected}
                          value={shareMap.get(entry.id)?.share_percent ?? 0}
                          onChange={(event) => updateShare(entry.id, Number(event.target.value))}
                          className="w-28 rounded-lg border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-900 dark:border-gray-700"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-violet-600 text-white" type="submit">
            {editingId ? 'Update Staff User' : 'Create Staff User'}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, hint = '' }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <input
        type={type}
        required={required}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
      />
      {hint && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  );
}

function EntityBadges({ items }) {
  if (items.length === 0) {
    return <span className="text-gray-500 dark:text-gray-400">No entries linked</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.id} className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-100">
          <span>{item.domain?.title || `Entry #${item.domain_id}`}</span>
          <span className="font-semibold text-violet-700 dark:text-violet-300">{Number(item.share_percent || 0).toFixed(2)}%</span>
        </span>
      ))}
    </div>
  );
}
