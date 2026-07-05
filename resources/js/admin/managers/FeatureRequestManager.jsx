import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Select, Textarea } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

const STATUS_OPTS = [
  ['pending','Pending'],['under_review','Under Review'],['planned','Planned'],
  ['in_progress','In Progress'],['completed','Completed'],['rejected','Rejected'],
];

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  planned: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

export function FeatureRequestManager({ entry, items, reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const [screen, setScreen] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', email: '', description: '', status: 'pending', admin_notes: '' });
  const upd = (k, v) => setForm((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={startCreate} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">Add Request</button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  useEffect(() => {
    if (moduleAction === 'create') {
      setForm({ title: '', email: '', description: '', status: 'pending', admin_notes: '' });
      setEditingId(null);
      setScreen('form');
      return;
    }
    if (moduleAction === 'edit' && moduleItemId) {
      const item = items.find((row) => String(row.id) === String(moduleItemId));
      if (item) startEdit(item, false);
      return;
    }
    setScreen('list');
    setEditingId(null);
  }, [moduleAction, moduleItemId, items]);

  function startCreate() { setForm({ title: '', email: '', description: '', status: 'pending', admin_notes: '' }); setEditingId(null); navigateModule?.('create'); }
  function startEdit(item, push = true) { setForm({ status: item.status, admin_notes: item.admin_notes || '' }); setEditingId(item.id); setScreen('form'); if (push) navigateModule?.('edit', item.id); }

  async function submit(e) {
    e.preventDefault();
    if (editingId) {
      await request(`/admin-api/entries/${entry.id}/feature-requests/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await request(`/admin-api/entries/${entry.id}/feature-requests`, { method: 'POST', body: JSON.stringify(form) });
    }
    await reload(); navigateModule?.();
  }

  if (screen === 'form') {
    return (
      <div className="p-5 max-w-2xl">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Update Request' : 'Add Feature Request'}</h2>
        <form onSubmit={submit} className="space-y-4">
          {!editingId && (
            <>
              <Input label="Title" value={form.title} onChange={(v) => upd('title', v)} required />
              <Input label="Requester Email" type="email" value={form.email} onChange={(v) => upd('email', v)} />
              <Textarea label="Description" value={form.description} onChange={(v) => upd('description', v)} rows={4} />
            </>
          )}
          <Select label="Status" value={form.status} onChange={(v) => upd('status', v)} options={STATUS_OPTS} />
          {editingId && <Textarea label="Admin Notes" value={form.admin_notes} onChange={(v) => upd('admin_notes', v)} rows={3} />}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update' : 'Save'}</button>
            <button type="button" onClick={() => navigateModule?.()} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <DataRows
      items={items}
      columns={['title', 'email', 'votes', 'status']}
      renderers={{
        status: (item) => (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
            {item.status?.replace('_', ' ')}
          </span>
        ),
      }}
      actions={(item) => (
        <ActionGroup>
          <EditButton label="Update" onClick={() => startEdit(item)} />
          <DeleteButton url={`/admin-api/entries/${entry.id}/feature-requests/${item.id}`} reload={reload} />
        </ActionGroup>
      )}
    />
  );
}
