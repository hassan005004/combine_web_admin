import { useEffect, useState } from 'react';
import { request } from '../api';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

export function FcmSettings({ entry, items, reload, setHeaderAction }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = add mode, object = edit mode

  const savedSetting = items.find((item) => item.services_file) || null;

  // Inject "Add FCM Setting" button only when no setting exists yet
  useEffect(() => {
    if (setHeaderAction) {
      setHeaderAction(
        !savedSetting ? (
          <button
            type="button"
            onClick={() => openModal(null)}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium"
          >
            Add FCM Setting
          </button>
        ) : null,
      );
      return () => setHeaderAction(null);
    }
  }, [savedSetting]);

  function openModal(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
  }

  async function handleSaved() {
    closeModal();
    await reload();
  }

  return (
    <>
      <DataRows
        items={items}
        columns={['services_file', 'token', 'token_expiry']}
        actions={(item) => (
          <ActionGroup>
            <EditButton label="Edit FCM setting" onClick={() => openModal(item)} />
            <DeleteButton url={`/admin-api/notification-settings/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />

      {modalOpen && (
        <FcmModal
          entry={entry}
          item={editingItem}
          savedSetting={savedSetting}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function FcmModal({ entry, item, savedSetting, onClose, onSaved }) {
  const isEditing = Boolean(item);
  const hasSavedSetting = Boolean(savedSetting);

  const [form, setForm] = useState({
    token: item?.token || '',
    token_expiry: toDateTimeLocal(item?.token_expiry),
    services_file: null,
  });
  const [fileName, setFileName] = useState('');

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.set('domain_id', entry.id);
    formData.set('token', form.token || '');
    if (form.token_expiry) formData.set('token_expiry', form.token_expiry);
    if (form.services_file) formData.set('services_file', form.services_file);
    await request('/admin-api/notification-settings', { method: 'POST', body: formData });
    await onSaved();
  }

  // Close on backdrop click
  function onBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
      onClick={onBackdropClick}
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit FCM Setting' : 'Add FCM Setting'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Token
            <input
              value={form.token}
              onChange={(e) => setForm((cur) => ({ ...cur, token: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Token Expiry
            <input
              type="datetime-local"
              value={form.token_expiry}
              onChange={(e) => setForm((cur) => ({ ...cur, token_expiry: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
            />
          </label>

          <FilePicker
            required={!hasSavedSetting}
            savedFile={item?.services_file ?? savedSetting?.services_file}
            fileName={fileName}
            onChange={(file) => {
              setForm((cur) => ({ ...cur, services_file: file }));
              setFileName(file?.name || '');
            }}
          />

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">
              {isEditing ? 'Update FCM Setting' : 'Save FCM Setting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── File Picker ─────────────────────────────────────────────────────────────

function FilePicker({ required, savedFile, fileName, onChange }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Services File
      <span className="mt-1 flex min-h-10 items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <span className="rounded-md bg-violet-100 px-3 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          Browse File
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-normal text-gray-500 dark:text-gray-400">
          {fileName || (savedFile ? 'Current file saved' : 'No file chosen')}
        </span>
      </span>
      <input
        type="file"
        name="services_file"
        required={required}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
        {savedFile ? 'Leave empty to keep the saved file.' : 'Upload the Firebase services file.'}
      </span>
    </label>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateTimeLocal(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}
