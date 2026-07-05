import { useEffect, useState } from 'react';
import { request } from '../api';
import { HtmlEditor } from '../components/FormControls';

// The "pages" are the rich-text fields stored directly on the Domain (entry).
// We show them as a list; clicking one opens a full-screen editor.
const PAGE_FIELDS = [
  { key: 'privacy_policy',    label: 'Privacy Policy' },
  { key: 'terms_conditions',  label: 'Terms & Conditions' },
  { key: 'support_policy',    label: 'Support Policy' },
  { key: 'delete_policy',     label: 'Delete Policy' },
  { key: 'about_us',          label: 'About Us' },
];

export function PagesManager({ entry, reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const [editingKey, setEditingKey] = useState(null); // null = list view
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // No header action needed for the list view
  useEffect(() => {
    if (setHeaderAction) {
      setHeaderAction(null);
      return () => setHeaderAction(null);
    }
  }, []);

  useEffect(() => {
    if (moduleAction === 'edit' && moduleItemId && PAGE_FIELDS.some((page) => page.key === moduleItemId)) {
      openPage(moduleItemId, false);
      return;
    }
    setEditingKey(null);
    setContent('');
  }, [moduleAction, moduleItemId, entry]);

  function openPage(key, push = true) {
    setContent(entry[key] || '');
    setEditingKey(key);
    if (push) navigateModule?.('edit', key);
  }

  function closePage() {
    navigateModule?.();
  }

  async function savePage(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await request(`/admin-api/entries/${entry.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...entry, [editingKey]: content }),
      });
      await reload();
      closePage();
    } finally {
      setSaving(false);
    }
  }

  // ── Editor screen ─────────────────────────────────────────────────────────
  if (editingKey) {
    const pageLabel = PAGE_FIELDS.find((p) => p.key === editingKey)?.label || editingKey;

    return (
      <div className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={closePage}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.5 3 1.5 8l5 5V9h8V7h-8V3Z" />
            </svg>
            Back to Pages
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{pageLabel}</h2>
        </div>

        <form onSubmit={savePage}>
          <HtmlEditor label={pageLabel} value={content} onChange={setContent} />
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Page'}
            </button>
            <button
              type="button"
              onClick={closePage}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── List screen ───────────────────────────────────────────────────────────
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {PAGE_FIELDS.map(({ key, label }) => {
        const hasContent = Boolean(entry[key]);
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => openPage(key)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">{label}</span>
                <span className={`ml-2 text-xs ${hasContent ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {hasContent ? 'Has content' : 'Empty'}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
