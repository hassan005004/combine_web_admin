import { useEffect, useState } from 'react';
import { Input, Select, Toggle } from '../components/FormControls';

const TYPE_OPTIONS = [
  ['app',     'App (Android / iOS)'],
  ['website', 'Website'],
  ['both',    'App + Website'],
  ['other',   'Other (no app / website)'],
];

const STATUS_OPTIONS = [
  ['pending', 'Pending'],
  ['started', 'Started'],
  ['working', 'Working'],
];

// Ad type metadata — label, icon emoji, description, frequency label
const AD_TYPES = [
  {
    key: 'bottom',
    label: 'Banner (Bottom)',
    emoji: '📢',
    description: 'Persistent banner shown at the bottom of the screen.',
    showFrequency: false,
  },
  {
    key: 'app_open',
    label: 'App Open',
    emoji: '🚪',
    description: 'Full-screen ad shown when the app is opened or resumed.',
    showFrequency: false,
  },
  {
    key: 'full_screen',
    label: 'Interstitial (Full Screen)',
    emoji: '🖥️',
    description: 'Full-screen ad shown at natural transition points.',
    showFrequency: true,
    frequencyHint: 'Show every N screens/actions (0 = every time)',
  },
  {
    key: 'rewarded',
    label: 'Rewarded',
    emoji: '🎁',
    description: 'User watches an ad in exchange for in-app reward.',
    showFrequency: false,
  },
  {
    key: 'native',
    label: 'Native',
    emoji: '📰',
    description: 'In-feed native ad that matches the app\'s look and feel.',
    showFrequency: true,
    frequencyHint: 'Show every N list items (0 = every item)',
  },
];

// Fields to show depending on entry type
function showsApp(type)     { return type === 'app'  || type === 'both'; }
function showsWebsite(type) { return type === 'website' || type === 'both'; }

export function EntryFormScreen({ form, setForm, editingId, cancelEdit, saveEntry, busy }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateAd = (type, field, value) =>
    setForm((current) => ({
      ...current,
      ads: {
        ...current.ads,
        [type]: { ...(current.ads?.[type] || {}), [field]: value },
      },
    }));

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
            Configure identity, URLs, cache and AdMob settings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── General ─────────────────────────────────────────────────── */}
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
            <Select
              label="Status"
              value={form.status || 'pending'}
              onChange={(v) => update('status', v)}
              options={STATUS_OPTIONS}
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

            {showsWebsite(form.entry_type) && (
              <Input label="Website URL" value={form.url || ''} onChange={(v) => update('url', v)} />
            )}

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

        {/* ── AdMob Settings ───────────────────────────────────────────── */}
        {showsApp(form.entry_type) && (
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📱</span>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                AdMob Settings
              </h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
              Enter your AdMob unit IDs from the{' '}
              <a
                href="https://admob.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 hover:underline"
              >
                AdMob dashboard
              </a>
              . Use test IDs during development.
            </p>

            <div className="space-y-4">
              {AD_TYPES.map(({ key, label, emoji, description, showFrequency, frequencyHint }) => {
                const ad = form.ads?.[key] || { enabled: false, unit_id: '', frequency: 0 };
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-4 transition-colors ${
                      ad.enabled
                        ? 'border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/10'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                        </div>
                      </div>
                      <Toggle
                        label=""
                        checked={Boolean(ad.enabled)}
                        onChange={(v) => updateAd(key, 'enabled', v)}
                        onText="On"
                        offText="Off"
                      />
                    </div>

                    {/* Fields — only when enabled */}
                    {ad.enabled && (
                      <div className={`grid gap-3 ${showFrequency ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                        <div className="md:col-span-2">
                          <Input
                            label="Ad Unit ID"
                            value={ad.unit_id || ''}
                            onChange={(v) => updateAd(key, 'unit_id', v)}
                            placeholder={`ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`}
                          />
                        </div>
                        {showFrequency && (
                          <div className="flex flex-col gap-0.5">
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Frequency
                              {frequencyHint && (
                                <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                                  ({frequencyHint})
                                </span>
                              )}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={ad.frequency ?? 0}
                              onChange={(e) => updateAd(key, 'frequency', Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Test ID helper */}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-violet-500 hover:text-violet-700 font-medium select-none">
                📋 Show Google test Ad Unit IDs
              </summary>
              <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Android Test Unit ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[
                      ['Banner',        'ca-app-pub-3940256099942544/6300978111'],
                      ['App Open',      'ca-app-pub-3940256099942544/9257395921'],
                      ['Interstitial',  'ca-app-pub-3940256099942544/1033173712'],
                      ['Rewarded',      'ca-app-pub-3940256099942544/5224354917'],
                      ['Native',        'ca-app-pub-3940256099942544/2247696110'],
                    ].map(([type, id]) => (
                      <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{type}</td>
                        <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400 select-all">{id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        )}

        {/* ── Actions ─────────────────────────────────────────────────── */}
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
