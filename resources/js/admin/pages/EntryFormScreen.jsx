import { Input, Select, Toggle } from '../components/FormControls';

export function EntryFormScreen({ form, setForm, editingId, cancelEdit, saveEntry, busy }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">{editingId ? 'Edit Entry' : 'Add Entry'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure app, website, cache, and branding.</p>
        </div>
      </div>
      <form onSubmit={saveEntry} className="space-y-6">

        {/* ── General ── */}
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">General</h2>
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
        </section>

        {/* ── App Version & Force Update ── */}
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">App Version</h2>
          <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
            Set the latest Android version and build code. Enable Force Update to require users below the minimum build to upgrade before continuing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Latest Version Name"
              placeholder="e.g. 2.4.1"
              hint="optional"
              value={form.app_version || ''}
              onChange={(value) => update('app_version', value)}
            />
            <Input
              label="Minimum Build Code"
              placeholder="e.g. 24"
              hint="Android versionCode"
              value={form.min_build_code || ''}
              onChange={(value) => update('min_build_code', value)}
            />
            <Toggle
              label="Force Update"
              checked={!!form.force_update}
              onChange={(value) => update('force_update', value)}
              onText="Enabled"
              offText="Disabled"
            />
          </div>
          {form.force_update && (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Force update is ON — users with a build code below <strong>{form.min_build_code || '(not set)'}</strong> will be prompted to update before they can use the app.
            </p>
          )}
        </section>

        <div className="flex gap-2">
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-60" type="submit">
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
