import { Input, Select, Textarea } from '../components/FormControls';
import { labelize } from '../utils';

export function EntryFormScreen({ form, setForm, editingId, cancelEdit, saveEntry, busy }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">{editingId ? 'Edit Entry' : 'Add Entry'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure app, website, legal content, cache, and branding.</p>
        </div>
      </div>
      <form onSubmit={saveEntry} className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Title" value={form.title} onChange={(value) => update('title', value)} required />
          <Select label="Type" value={form.entry_type} onChange={(value) => update('entry_type', value)} options={[['app', 'App'], ['website', 'Website'], ['both', 'Both']]} />
          <Input label="Application ID" value={form.application_id} onChange={(value) => update('application_id', value)} required />
          <Input label="Website URL" value={form.url || ''} onChange={(value) => update('url', value)} />
          <Input label="Google Play URL" value={form.google_play_url || ''} onChange={(value) => update('google_play_url', value)} />
          <Input label="App Store URL" value={form.app_store_url || ''} onChange={(value) => update('app_store_url', value)} />
          <Select label="Cache" value={String(form.cache_ttl_hours)} onChange={(value) => update('cache_ttl_hours', Number(value))} options={[['24', 'Daily'], ['168', 'Weekly'], ['336', 'Bi Weekly'], ['720', 'Monthly']]} />
          <Input label="Primary Color" type="color" value={form.primary_color} onChange={(value) => update('primary_color', value)} />
          <Input label="Secondary Color" type="color" value={form.secondary_color} onChange={(value) => update('secondary_color', value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {['privacy_policy', 'terms_conditions', 'support_policy', 'about_us'].map((key) => (
            <Textarea key={key} label={labelize(key)} value={form[key] || ''} onChange={(value) => update(key, value)} />
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-violet-600 text-white" type="submit">
            {editingId ? 'Update Entry' : 'Create Entry'}
          </button>
          <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
