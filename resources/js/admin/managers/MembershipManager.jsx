import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Toggle } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

export function MembershipManager({ entry, items, reload, setHeaderAction }) {
  const blankForm = { domain_id: entry.id, email: '', plan: 'premium', expires_at: '', is_active: true };
  const [screen, setScreen] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={createMembership} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">Add Membership</button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  function createMembership() {
    setForm({ ...blankForm, domain_id: entry.id });
    setEditingId(null);
    setScreen('form');
  }

  function editMembership(membership) {
    setForm({ ...blankForm, ...membership, domain_id: entry.id, expires_at: String(membership.expires_at || '').slice(0, 16) });
    setEditingId(membership.id);
    setScreen('form');
  }

  async function submit(event) {
    event.preventDefault();
    const url = editingId ? `/admin-api/memberships/${editingId}` : '/admin-api/memberships';
    await request(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await reload();
    setScreen('list');
  }

  if (screen === 'form') {
    return <MembershipForm form={form} setForm={setForm} editingId={editingId} submit={submit} cancel={() => setScreen('list')} />;
  }

  return (
    <>
      <DataRows
        items={items}
        columns={['email', 'plan', 'expires_at', 'is_active']}
        actions={(item) => (
          <ActionGroup>
            <EditButton label={`Edit ${item.email}`} onClick={() => editMembership(item)} />
            <DeleteButton url={`/admin-api/memberships/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}

function MembershipForm({ form, setForm, editingId, submit, cancel }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit Membership' : 'Add Membership'}</h2>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
        <Input label="Plan" value={form.plan} onChange={(value) => update('plan', value)} required />
        <Input label="Expires At" type="datetime-local" value={form.expires_at || ''} onChange={(value) => update('expires_at', value)} />
        <Toggle label="Status" checked={!!form.is_active} onChange={(value) => update('is_active', value)} />
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update Membership' : 'Create Membership'}</button>
          <button type="button" onClick={cancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  );
}
