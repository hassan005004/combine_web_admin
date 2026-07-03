import { Input, Select } from '../components/FormControls';

const TYPE_OPTIONS = [
  ['app',     'App (Android / iOS)'],
  ['website', 'Website'],
  ['both',    'App + Website'],
  ['other',   'Other (no app / website)'],
];

// Fields to show depending on entry type
function showsApp(type)     { return type === 'app'  || type === 'both'; }
function showsWebsite(type) { return type === 'website' || type === 'both'; }

export function EntryFormScreen({ form, setForm, editingId, cancelEdit, saveEntry, busy }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    await saveEntry(e);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
            {editingId ? 'Edit Entry' : 'Add Entry'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure identity, URLs, and cache.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Title" value={form.title} onChange={(v) => update('title', v)} required />
            <Select
              label="Type"
              value={form.entry_type}
              onChange={(v) => update('entry_type', v)}
              options={TYPE_OPTIONS}
            />
            <Input
              label="Application ID"
              value={form.application_id}
              onChange={(v) => update('application_id', v)}
              hint="optional unique app identifier"
            />

            {/* Website URL — shown for website / both */}
            {showsWebsite(form.entry_type) && (
              <Input label="Website URL" value={form.url || ''} onChange={(v) => update('url', v)} />
            )}

            {/* Store URLs — shown for app / both */}
            {showsApp(form.entry_type) && (
              <>
                <Input label="Google Play URL" value={form.google_play_url || ''} onChange={(v) => update('google_play_url', v)} />
                <Input label="App Store URL"   value={form.app_store_url   || ''} onChange={(v) => update('app_store_url', v)} />
              </>
            )}

            <Select
              label="Cache TTL"
              value={String(form.cache_ttl_hours)}
              onChange={(v) => update('cache_ttl_hours', Number(v))}
              options={[['24', 'Daily (24 h)'], ['168', 'Weekly (7 d)'], ['336', 'Bi-weekly (14 d)'], ['720', 'Monthly (30 d)']]}
            />
          </div>
        </section>

        <div className="flex gap-2">
          <button
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-60"
            type="submit"
          >
            {busy ? 'Saving…' : editingId ? 'Update Entry' : 'Create Entry'}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
