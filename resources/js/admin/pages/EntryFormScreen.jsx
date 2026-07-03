import { useEffect, useState } from 'react';
import { Input, Select, Toggle } from '../components/FormControls';

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
  const [logoPreview, setLogoPreview] = useState(form.logo_url || null);

  useEffect(() => {
    if (form.logo instanceof File) {
      const previewUrl = URL.createObjectURL(form.logo);
      setLogoPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }

    setLogoPreview(form.logo_url || null);
    return undefined;
  }, [form.logo, form.logo_url]);

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
            <Toggle
              label="Apps Gallery"
              checked={Boolean(form.show_in_apps_gallery)}
              onChange={(v) => update('show_in_apps_gallery', v)}
              onText="Shown"
              offText="Hidden"
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
            <div className="md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</span>
              <label className="mt-1 flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900">
                <span className="shrink-0 rounded-md bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                  Browse
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                  {form.logo?.name || (form.logo_url && !form.remove_logo ? 'Current logo saved' : 'No logo chosen')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm((current) => ({ ...current, logo: file, remove_logo: false }));
                  }}
                />
              </label>
              {logoPreview && !form.remove_logo && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={logoPreview} alt="Logo preview" className="h-14 w-14 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, logo: null, logo_url: '', remove_logo: true }))}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
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
