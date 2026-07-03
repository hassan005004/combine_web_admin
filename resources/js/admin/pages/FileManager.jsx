import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../api';
import { useConfirm } from '../components/ConfirmDialog';

// ─── helpers ─────────────────────────────────────────────────────────────────

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
function isImage(name) {
  return IMAGE_EXTS.includes(name.split('.').pop().toLowerCase());
}

// ─── main component ───────────────────────────────────────────────────────────

export function FileManager({ entry, onPickUrl }) {
  const [folder, setFolder] = useState('');       // current folder path
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [copied, setCopied] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { confirmDelete } = useConfirm();

  const load = useCallback(async (f = folder) => {
    setLoading(true);
    try {
      const params = f ? `?folder=${encodeURIComponent(f)}` : '';
      const data = await request(`/admin-api/entries/${entry.id}/files${params}`);
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [entry.id, folder]);

  useEffect(() => { load(folder); }, [folder, entry.id]);

  // ── breadcrumb ──────────────────────────────────────────────────────────────
  const breadcrumbs = folder
    ? folder.split('/').reduce((acc, part, i) => {
        acc.push({ label: part, path: acc.length ? acc[acc.length - 1].path + '/' + part : part });
        return acc;
      }, [])
    : [];

  // ── upload ──────────────────────────────────────────────────────────────────
  async function upload(files) {
    for (const file of files) {
      const body = new FormData();
      body.set('file', file);
      if (folder) body.set('folder', folder);
      await request(`/admin-api/entries/${entry.id}/files/upload`, { method: 'POST', body });
    }
    await load(folder);
  }

  function onFileInput(e) {
    if (e.target.files?.length) upload(Array.from(e.target.files));
    e.target.value = '';
  }

  // ── drag & drop ─────────────────────────────────────────────────────────────
  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) upload(files);
  }

  // ── new folder ──────────────────────────────────────────────────────────────
  async function createFolder(e) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await request(`/admin-api/entries/${entry.id}/files/mkdir`, {
      method: 'POST',
      body: JSON.stringify({ name: newFolderName.trim(), folder }),
    });
    setNewFolderName('');
    setShowNewFolder(false);
    await load(folder);
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  async function deleteItem(item) {
    const confirmed = await confirmDelete({
      title: `Delete "${item.name}"`,
      message: item.type === 'folder' ? 'This will delete the folder and all its contents.' : 'This file will be permanently deleted.',
    });
    if (!confirmed) return;
    await request(`/admin-api/entries/${entry.id}/files`, {
      method: 'DELETE',
      body: JSON.stringify({ path: item.path, type: item.type }),
    });
    await load(folder);
  }

  // ── copy URL ────────────────────────────────────────────────────────────────
  function copyUrl(item) {
    navigator.clipboard.writeText(item.url);
    setCopied(item.path);
    setTimeout(() => setCopied(null), 1500);
  }

  // ── pick (when used as file picker) ─────────────────────────────────────────
  function pick(item) {
    if (onPickUrl) onPickUrl(item.url);
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
        {/* breadcrumb */}
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setFolder('')}
            className="shrink-0 font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            {entry.title}
          </button>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.path} className="flex items-center gap-1">
              <span className="text-gray-400">/</span>
              <button
                type="button"
                onClick={() => setFolder(crumb.path)}
                className="font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </nav>

        {/* actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewFolder((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <FolderPlusIcon /> New Folder
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            <UploadIcon /> Upload
          </button>
          <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={onFileInput} />
        </div>
      </div>

      {/* ── new folder form ── */}
      {showNewFolder && (
        <form
          onSubmit={createFolder}
          className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-2 dark:border-gray-700 dark:bg-gray-800/60"
        >
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="block h-8 w-48 rounded-lg border-gray-300 px-2 text-sm dark:bg-gray-900 dark:border-gray-700"
          />
          <button type="submit" className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
            Create
          </button>
          <button
            type="button"
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
        </form>
      )}

      {/* ── drop zone + grid ── */}
      <div
        className={`relative flex-1 overflow-y-auto p-5 transition-colors ${dragging ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-violet-400">
            <span className="text-sm font-semibold text-violet-600">Drop files to upload</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <UploadIcon className="h-8 w-8 opacity-40" />
            <span>Empty folder — drag files here or click Upload</span>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map((item) => (
              <FileCard
                key={item.path}
                item={item}
                copied={copied === item.path}
                pickable={Boolean(onPickUrl)}
                onOpen={() => item.type === 'folder' ? setFolder(item.path) : null}
                onCopy={() => copyUrl(item)}
                onPick={() => pick(item)}
                onDelete={() => deleteItem(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── file / folder card ───────────────────────────────────────────────────────

function FileCard({ item, copied, pickable, onOpen, onCopy, onPick, onDelete }) {
  const isFolder = item.type === 'folder';
  const isImg    = !isFolder && isImage(item.name);

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-violet-600 transition overflow-hidden">
      {/* thumbnail / icon */}
      <button
        type="button"
        onClick={isFolder ? onOpen : (pickable ? onPick : onCopy)}
        className="flex h-28 w-full items-center justify-center bg-gray-50 dark:bg-gray-900/40"
        title={isFolder ? 'Open folder' : pickable ? 'Select' : 'Copy URL'}
      >
        {isFolder ? (
          <FolderIcon className="h-12 w-12 text-yellow-400" />
        ) : isImg ? (
          <img
            src={item.url}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <FileIcon className="h-10 w-10 text-gray-400" />
        )}
      </button>

      {/* name + meta */}
      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300" title={item.name}>
          {item.name}
        </p>
        {!isFolder && (
          <p className="text-xs text-gray-400">{humanSize(item.size)}</p>
        )}
      </div>

      {/* hover actions */}
      <div className="absolute right-1.5 top-1.5 hidden flex-col gap-1 group-hover:flex">
        {!isFolder && (
          <ActionChip onClick={onCopy} title={copied ? 'Copied!' : 'Copy URL'}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </ActionChip>
        )}
        {pickable && !isFolder && (
          <ActionChip onClick={onPick} title="Select this file">
            <CheckCircleIcon />
          </ActionChip>
        )}
        <ActionChip onClick={onDelete} title="Delete" danger>
          <TrashIcon />
        </ActionChip>
      </div>
    </div>
  );
}

function ActionChip({ children, onClick, title, danger }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded-md shadow ${
        danger
          ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400'
          : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

// ─── icons ────────────────────────────────────────────────────────────────────

function FolderIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z" />
    </svg>
  );
}

function FolderPlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

function FileIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function UploadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}
