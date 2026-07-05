import { useState } from 'react';
import { Toggle } from '../components/FormControls';
import { useToast } from '../components/Toast';
import { request } from '../api';

// ── Ad type definitions ───────────────────────────────────────────────────────

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
    frequencyHint: 'Show every N screens / actions (0 = every time)',
  },
  {
    key: 'rewarded',
    label: 'Rewarded',
    emoji: '🎁',
    description: 'User watches an ad in exchange for an in-app reward.',
    showFrequency: false,
  },
  {
    key: 'native',
    label: 'Native',
    emoji: '📰',
    description: "In-feed native ad that matches the app's look and feel.",
    showFrequency: true,
    frequencyHint: 'Show every N list items (0 = every item)',
  },
];

const DEFAULT_ADS = {
  bottom:      { enabled: false, unit_id: '', frequency: 0 },
  app_open:    { enabled: false, unit_id: '', frequency: 0 },
  full_screen: { enabled: false, unit_id: '', frequency: 5 },
  rewarded:    { enabled: false, unit_id: '', frequency: 0 },
  native:      { enabled: false, unit_id: '', frequency: 3 },
};

// Google's official test unit IDs (Android)
const TEST_IDS = {
  bottom:      'ca-app-pub-3940256099942544/6300978111',
  app_open:    'ca-app-pub-3940256099942544/9257395921',
  full_screen: 'ca-app-pub-3940256099942544/1033173712',
  rewarded:    'ca-app-pub-3940256099942544/5224354917',
  native:      'ca-app-pub-3940256099942544/2247696110',
};

function hydrateAds(raw) {
  const out = {};
  for (const [key, defaults] of Object.entries(DEFAULT_ADS)) {
    out[key] = { ...defaults, ...(raw?.[key] || {}) };
  }
  return out;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdMobManager({ entry, reload }) {
  const toast = useToast();
  const [ads, setAds] = useState(() => hydrateAds(entry.ads_settings));
  const [saving, setSaving] = useState(false);

  function updateAd(type, field, value) {
    setAds((current) => ({
      ...current,
      [type]: { ...current[type], [field]: value },
    }));
  }

  function useTestIds() {
    setAds((current) => {
      const next = { ...current };
      for (const key of Object.keys(DEFAULT_ADS)) {
        next[key] = { ...next[key], enabled: true, unit_id: TEST_IDS[key] };
      }
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Build FormData — reuse the same field names the backend expects
      const payload = new FormData();
      payload.append('_method', 'PUT');

      // We only want to update ads_settings, so we must re-send required fields too.
      // Send the current entry values for the required title / entry_type fields.
      payload.append('title',           entry.title          || '');
      payload.append('entry_type',      entry.entry_type     || 'app');
      payload.append('status',          entry.status         || 'pending');
      payload.append('application_id',  entry.application_id || '');
      payload.append('cache_ttl_hours', String(entry.cache_ttl_hours || 24));
      payload.append('show_in_apps_gallery', entry.show_in_apps_gallery ? '1' : '0');
      payload.append('force_update',    entry.force_update ? '1' : '0');
      payload.append('remove_logo',     '0');

      for (const type of Object.keys(DEFAULT_ADS)) {
        const ad = ads[type] || {};
        payload.append(`ads[${type}][enabled]`,   ad.enabled ? '1' : '0');
        payload.append(`ads[${type}][unit_id]`,   ad.unit_id || '');
        payload.append(`ads[${type}][frequency]`, String(ad.frequency ?? 0));
      }

      await request(`/admin-api/entries/${entry.id}`, { method: 'POST', body: payload });
      toast.showToast('success', 'AdMob settings saved.');
      reload?.();
    } catch (err) {
      toast.showToast('error', err.message || 'Failed to save AdMob settings.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ' +
    'placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 ' +
    'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 ' +
    'dark:focus:border-violet-400';

  return (
    <form onSubmit={handleSave} className="p-5 space-y-5">

      {/* Header hint */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
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

      {/* Ad type cards */}
      {AD_TYPES.map(({ key, label, emoji, description, showFrequency, frequencyHint }) => {
        const ad = ads[key];
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ad Unit ID</label>
                  <input
                    type="text"
                    value={ad.unit_id || ''}
                    onChange={(e) => updateAd(key, 'unit_id', e.target.value)}
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                    className={inputCls}
                  />
                </div>
                {showFrequency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Frequency
                      {frequencyHint && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400">({frequencyHint})</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ad.frequency ?? 0}
                      onChange={(e) => updateAd(key, 'frequency', Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className={inputCls}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Google test IDs reference */}
      <details>
        <summary className="cursor-pointer text-xs text-violet-500 hover:text-violet-700 font-medium select-none">
          📋 Show Google test Ad Unit IDs
        </summary>
        <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Type</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Android Test Unit ID</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                ['Banner',       'bottom',      'ca-app-pub-3940256099942544/6300978111'],
                ['App Open',     'app_open',    'ca-app-pub-3940256099942544/9257395921'],
                ['Interstitial', 'full_screen', 'ca-app-pub-3940256099942544/1033173712'],
                ['Rewarded',     'rewarded',    'ca-app-pub-3940256099942544/5224354917'],
                ['Native',       'native',      'ca-app-pub-3940256099942544/2247696110'],
              ].map(([type, key, id]) => (
                <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{type}</td>
                  <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400 select-all">{id}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateAd(key, 'unit_id', id);
                        updateAd(key, 'enabled', true);
                      }}
                      className="rounded-md bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25 transition-colors whitespace-nowrap"
                    >
                      Use
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Save */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save AdMob Settings'}
        </button>
        <button
          type="button"
          onClick={useTestIds}
          className="px-5 py-2 rounded-lg border border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 text-sm font-semibold transition-colors"
        >
          🧪 Use Google Test IDs
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Fills all fields with test IDs and enables all ad types. Don't forget to save.
        </span>
      </div>
    </form>
  );
}
