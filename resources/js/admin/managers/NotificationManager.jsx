import { useEffect, useRef, useState } from 'react';
import { request } from '../api';
import { Input, Textarea } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, ResendButton } from '../components/DataRows';
import { FileManager } from '../pages/FileManager';

const blankForm = (domainId) => ({
  domain_id: domainId,
  title: '',
  message: '',
  image_url: '',
  image_file: null,
  name: '',
});

export function NotificationManager({ entry, items, reload, setHeaderAction }) {
  const [screen, setScreen] = useState('list');
  const [form, setForm] = useState(blankForm(entry.id));

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button
        type="button"
        onClick={() => { setForm(blankForm(entry.id)); setScreen('send'); }}
        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium"
      >
        Send Notification
      </button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  async function submit(event) {
    event.preventDefault();
    const body = new FormData();
    body.set('domain_id', form.domain_id);
    body.set('message', form.message);
    if (form.title)      body.set('title', form.title);
    if (form.name)       body.set('name', form.name);
    if (form.image_file) body.set('image', form.image_file);
    else if (form.image_url) body.set('image_url', form.image_url);
    await request('/admin-api/notifications', { method: 'POST', body });
    setForm(blankForm(entry.id));
    await reload();
    setScreen('list');
  }

  const update = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));

  if (screen === 'send') {
    return (
      <div className="p-5 max-w-2xl">
        <h2 className="mb-6 font-semibold text-gray-800 dark:text-gray-100">Send Notification</h2>

        <form onSubmit={submit} className="space-y-4">

          <Input
            label="Notification title (optional)"
            placeholder="Enter optional title"
            value={form.title}
            onChange={(v) => update('title', v)}
          />

          <Textarea
            label="Notification text"
            placeholder="Enter notification text"
            value={form.message}
            onChange={(v) => update('message', v)}
            required
          />

          <ImageField
            entry={entry}
            url={form.image_url}
            file={form.image_file}
            onUrlChange={(v) => update('image_url', v)}
            onFileChange={(f) => update('image_file', f)}
          />

          <Input
            label="Notification name (optional)"
            placeholder="Enter optional name"
            value={form.name}
            onChange={(v) => update('name', v)}
          />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">
              Send Notification
            </button>
            <button
              type="button"
              onClick={() => setScreen('list')}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
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
  );
}

// ─── Image field ──────────────────────────────────────────────────────────────

function ImageField({ entry, url, file, onUrlChange, onFileChange }) {
  const fileRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const previewSrc = file ? URL.createObjectURL(file) : url || null;

  function handleFile(e) {
    const picked = e.target.files?.[0] || null;
    onFileChange(picked);
    if (picked) onUrlChange('');
  }

  function clearImage() {
    onFileChange(null);
    onUrlChange('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function handlePick(pickedUrl) {
    onUrlChange(pickedUrl);
    onFileChange(null);
    setPickerOpen(false);
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Notification image <span className="text-xs text-gray-400 dark:text-gray-500">(optional)</span>
      </span>

      <div className="flex items-center gap-2">
        {/* reuse Input styling via raw input with same classes */}
        <input
          type="url"
          placeholder="Paste URL or pick from file manager"
          value={file ? '' : url}
          disabled={Boolean(file)}
          onChange={(e) => { onUrlChange(e.target.value); onFileChange(null); }}
          className="block flex-1 rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700 disabled:opacity-50"
        />
        <button
          type="button"
          title="Pick from file manager"
          onClick={() => setPickerOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-violet-50 hover:text-violet-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:text-violet-400"
        >
          <FolderIcon />
        </button>
        <button
          type="button"
          title="Upload from computer"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        >
          <UploadIcon />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </div>

      {previewSrc && (
        <div className="mt-2 flex items-center gap-3">
          <img src={previewSrc} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
          <span className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">{file ? file.name : url}</span>
          <button type="button" onClick={clearImage} className="text-xs text-red-500 hover:text-red-700">Remove</button>
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="flex w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl dark:bg-gray-800" style={{ height: '80vh' }}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Pick an image</h2>
              <button type="button" onClick={() => setPickerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <FileManager entry={entry} onPickUrl={handlePick} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FolderIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
