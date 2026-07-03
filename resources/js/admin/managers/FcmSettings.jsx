import { request } from '../api';
import { Input } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton } from '../components/DataRows';

export function FcmSettings({ entry, items, reload }) {
  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('domain_id', entry.id);
    await request('/admin-api/notification-settings', { method: 'POST', body: formData });
    event.currentTarget.reset();
    reload();
  }

  return (
    <>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 border-b border-gray-100 dark:border-gray-700/60">
        <Input label="Token" name="token" />
        <Input label="Token Expiry" type="datetime-local" name="token_expiry" />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Services File
          <input className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700" type="file" name="services_file" required />
        </label>
        <button className="px-4 py-2 rounded-lg bg-violet-600 text-white" type="submit">Save FCM Setting</button>
      </form>
      <DataRows
        items={items}
        columns={['services_file', 'token', 'token_expiry']}
        actions={(item) => (
          <ActionGroup>
            <DeleteButton url={`/admin-api/notification-settings/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}
