import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, ResendButton } from '../components/DataRows';

export function NotificationManager({ entry, items, reload, setHeaderAction }) {
  const [screen, setScreen] = useState('list');
  const [form, setForm] = useState({ domain_id: entry.id, title: '', message: '' });

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={() => setScreen('send')} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">Send Notification</button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  async function submit(event) {
    event.preventDefault();
    await request('/admin-api/notifications', { method: 'POST', body: JSON.stringify(form) });
    setForm({ domain_id: entry.id, title: '', message: '' });
    await reload();
    setScreen('list');
  }

  if (screen === 'send') {
    return (
      <div className="p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Send Notification</h2>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
          <Input label="Message" value={form.message} onChange={(value) => setForm({ ...form, message: value })} required />
          <div className="md:col-span-2 flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-violet-600 text-white" type="submit">Send Notification</button>
            <button type="button" onClick={() => setScreen('list')} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <DataRows
        items={items}
        columns={['title', 'message', 'sent_at']}
        actions={(item) => (
          <ActionGroup>
            <ResendButton
              label={`Resend ${item.title}`}
              onClick={async () => {
                await request(`/admin-api/notifications/${item.id}/resend`, { method: 'POST' });
                reload();
              }}
            />
            <DeleteButton url={`/admin-api/notifications/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}
