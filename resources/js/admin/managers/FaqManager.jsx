import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Textarea } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

const blank = (domainId) => ({ domain_id: domainId, question: '', answer: '', sorting: 0 });

export function FaqManager({ entry, items, reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const [screen, setScreen] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank(entry.id));

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={startCreate} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">Add FAQ</button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  useEffect(() => {
    if (moduleAction === 'create') {
      setForm(blank(entry.id));
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

  function startCreate() { setForm(blank(entry.id)); setEditingId(null); navigateModule?.('create'); }
  function startEdit(item, push = true) { setForm({ question: item.question, answer: item.answer, sorting: item.sorting ?? 0 }); setEditingId(item.id); setScreen('form'); if (push) navigateModule?.('edit', item.id); }

  async function submit(e) {
    e.preventDefault();
    const url = editingId ? `/admin-api/entries/${entry.id}/faqs/${editingId}` : `/admin-api/entries/${entry.id}/faqs`;
    await request(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await reload(); navigateModule?.();
  }

  const upd = (k, v) => setForm((c) => ({ ...c, [k]: v }));

  if (screen === 'form') {
    return (
      <div className="p-5 max-w-2xl">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit FAQ' : 'Add FAQ'}</h2>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Question" value={form.question} onChange={(v) => upd('question', v)} required />
          <Textarea label="Answer" value={form.answer} onChange={(v) => upd('answer', v)} required rows={5} />
          <Input label="Sort Order" type="number" value={form.sorting} onChange={(v) => upd('sorting', Number(v))} />
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
      columns={['question', 'answer', 'sorting']}
      actions={(item) => (
        <ActionGroup>
          <EditButton label="Edit" onClick={() => startEdit(item)} />
          <DeleteButton url={`/admin-api/entries/${entry.id}/faqs/${item.id}`} reload={reload} />
        </ActionGroup>
      )}
    />
  );
}
