import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Select, Textarea } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

const STATUS_OPTS = [['open','Open'],['in_progress','In Progress'],['resolved','Resolved'],['closed','Closed']];
const TYPE_OPTS   = [['feedback','Feedback'],['bug','Bug Report']];

export function FeedbackManager({ entry, items, reload, setHeaderAction }) {
  const [tab, setTab] = useState('feedback'); // 'feedback' | 'bug'
  const [screen, setScreen] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ type: 'feedback', email: '', subject: '', body: '', status: 'open' });
  const upd = (k, v) => setForm((c) => ({ ...c, [k]: v }));

  const filtered = items.filter((i) => i.type === tab);

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={startCreate} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
        Add {tab === 'bug' ? 'Bug Report' : 'Feedback'}
      </button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen, tab]);

  function startCreate() {
    setForm({ type: tab, email: '', subject: '', body: '', status: 'open' });
    setEditingId(null); setScreen('form');
  }
  function startEdit(item) {
    setForm({ status: item.status, admin_notes: item.admin_notes || '' });
    setEditingId(item.id); setScreen('form');
  }

  async function submit(e) {
    e.preventDefault();
    if (editingId) {
      await request(`/admin-api/entries/${entry.id}/feedbacks/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await request(`/admin-api/entries/${entry.id}/feedbacks`, { method: 'POST', body: JSON.stringify(form) });
    }
    await reload(); setScreen('list');
  }

  if (screen === 'form') {
    return (
      <div className="p-5 max-w-2xl">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Update Status' : `New ${tab === 'bug' ? 'Bug Report' : 'Feedback'}`}</h2>
        <form onSubmit={submit} className="space-y-4">
          {!editingId && (
            <>
              <Select label="Type" value={form.type} onChange={(v) => upd('type', v)} options={TYPE_OPTS} />
              <Input label="Email" type="email" value={form.email} onChange={(v) => upd('email', v)} />
              <Input label="Subject" value={form.subject} onChange={(v) => upd('subject', v)} />
              <Textarea label="Body" value={form.body} onChange={(v) => upd('body', v)} required rows={4} />
            </>
          )}
          <Select label="Status" value={form.status} onChange={(v) => upd('status', v)} options={STATUS_OPTS} />
          {editingId && <Textarea label="Admin Notes" value={form.admin_notes || ''} onChange={(v) => upd('admin_notes', v)} rows={3} />}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update' : 'Save'}</button>
            <button type="button" onClick={() => setScreen('list')} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* Tab switcher */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {[['feedback','Feedback'],['bug','Bug Reports']].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${tab === key ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>
      <DataRows
        items={filtered}
        columns={['email', 'subject', 'status', 'created_at']}
        actions={(item) => (
          <ActionGroup>
            <EditButton label="Update status" onClick={() => startEdit(item)} />
            <DeleteButton url={`/admin-api/entries/${entry.id}/feedbacks/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}
