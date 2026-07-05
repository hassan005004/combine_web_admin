import { request } from '../api';
import { formatCell, labelize } from '../utils';
import { useConfirm } from './ConfirmDialog';
import { Shimmer } from './Skeleton';

export function DataRows({ items, columns, actions, loading = false, renderers = {} }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
          <tr>
            {columns.map((col) => <th key={col} className="px-3 py-2 text-left">{labelize(col)}</th>)}
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading && Array.from({ length: 5 }).map((_, row) => (
            <tr key={`loading-${row}`}>
              {columns.map((col) => <td key={col} className="px-3 py-3"><Shimmer className="h-4 w-full" /></td>)}
              <td className="px-3 py-3"><div className="flex justify-end"><Shimmer className="h-9 w-24" /></div></td>
            </tr>
          ))}
          {!loading && items.map((item) => (
            <tr key={item.id}>
              {columns.map((col) => <td key={col} className="px-3 py-2">{renderers[col] ? renderers[col](item) : formatCell(item[col])}</td>)}
              <td className="px-3 py-2 text-right">{actions(item)}</td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td className="px-3 py-3 text-center text-gray-500" colSpan={columns.length + 1}>No records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DataTable({ title, columns, rows, loading = false }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
            <tr>{columns.map((col) => <th className="px-4 py-3 text-left" key={col}>{col}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && Array.from({ length: 5 }).map((_, row) => (
              <tr key={`loading-${row}`}>
                {columns.map((col) => <td className="px-4 py-3" key={col}><Shimmer className="h-4 w-full" /></td>)}
              </tr>
            ))}
            {!loading && rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td className="px-4 py-3" key={j}>{cell}</td>)}</tr>)}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-center text-gray-500" colSpan={columns.length}>No records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DeleteButton({ url, reload }) {
  const { confirmDelete } = useConfirm();

  return (
    <IconButton
      label="Delete"
      tone="danger"
      onClick={async () => {
        const confirmed = await confirmDelete();
        if (!confirmed) return;
        await request(url, { method: 'DELETE' });
        reload();
      }}
    >
      <TrashIcon />
    </IconButton>
  );
}

export function ActionGroup({ children }) {
  return <div className="inline-flex items-center justify-end gap-2">{children}</div>;
}

export function ViewButton({ onClick, label = 'View' }) {
  return (
    <IconButton label={label} tone="primary" onClick={onClick}>
      <EyeIcon />
    </IconButton>
  );
}

export function EditButton({ onClick, label = 'Edit' }) {
  return (
    <IconButton label={label} tone="info" onClick={onClick}>
      <EditIcon />
    </IconButton>
  );
}

export function ResendButton({ onClick, label = 'Resend' }) {
  return (
    <IconButton label={label} tone="info" onClick={onClick}>
      <RefreshIcon />
    </IconButton>
  );
}

function IconButton({ children, label, onClick, tone = 'neutral' }) {
  const tones = {
    primary: 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300',
    info: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-300',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300',
    neutral: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100',
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m14 8 2 2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 9A7 7 0 0 0 6.2 6.8L4 9m2 6a7 7 0 0 0 11.8 2.2L20 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
