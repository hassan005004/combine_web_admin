import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Select, Textarea } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

const VISIBILITY_OPTIONS = [
  ['only_me', 'Only Me'],
  ['all', 'For All'],
];

export function NotesManager({ entry, items, reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const [screen, setScreen] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', visibility: 'only_me' });

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={createNote} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
        Add Note
      </button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen, setHeaderAction]);

  useEffect(() => {
    if (moduleAction === 'create') {
      setForm({ title: '', body: '', visibility: 'only_me' });
      setEditingId(null);
      setScreen('form');
      return;
    }
    if (moduleAction === 'edit' && moduleItemId) {
      const note = items.find((item) => String(item.id) === String(moduleItemId));
      if (note) editNote(note, false);
      return;
    }
    setScreen('list');
    setEditingId(null);
  }, [moduleAction, moduleItemId, items]);

  function createNote() {
    setForm({ title: '', body: '', visibility: 'only_me' });
    setEditingId(null);
    navigateModule?.('create');
  }

  function editNote(note, push = true) {
    setForm({ title: note.title || '', body: note.body || '', visibility: note.visibility || 'only_me' });
    setEditingId(note.id);
    setScreen('form');
    if (push) navigateModule?.('edit', note.id);
  }

  async function submit(event) {
    event.preventDefault();
    const url = editingId ? `/admin-api/entries/${entry.id}/notes/${editingId}` : `/admin-api/entries/${entry.id}/notes`;
    await request(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await reload();
    navigateModule?.();
  }

  if (screen === 'form') {
    return (
      <div className="p-5 max-w-2xl">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit Note' : 'Add Note'}</h2>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
          <Textarea label="Note" value={form.body} onChange={(value) => setForm((current) => ({ ...current, body: value }))} />
          <Select label="Visibility" value={form.visibility} onChange={(value) => setForm((current) => ({ ...current, visibility: value }))} options={VISIBILITY_OPTIONS} />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update Note' : 'Save Note'}</button>
            <button type="button" onClick={() => navigateModule?.()} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <DataRows
      items={items}
      columns={['title', 'body', 'visibility', 'user', 'created_at']}
      renderers={{
        title: (item) => item.title || '-',
        body: (item) => <span className="line-clamp-2">{item.body}</span>,
        visibility: (item) => item.visibility === 'all' ? 'For All' : 'Only Me',
        user: (item) => item.user?.name || item.user?.email || '-',
      }}
      actions={(item) => (
        <ActionGroup>
          <EditButton label="Edit note" onClick={() => editNote(item)} />
          <DeleteButton url={`/admin-api/entries/${entry.id}/notes/${item.id}`} reload={reload} />
        </ActionGroup>
      )}
    />
  );
}
