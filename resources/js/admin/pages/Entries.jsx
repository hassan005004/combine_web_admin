import { useState } from 'react';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  started: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  working: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
};

const STATUS_LABELS = {
  pending: 'Pending',
  started: 'Started',
  working: 'Working',
};

export function Entries({ entries, addEntry, viewEntry, reorderEntries }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  async function moveEntry(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= entries.length) return;

    const next = [...entries];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    await reorderEntries(next.map((entry) => entry.id));
  }

  async function dropEntry(targetId) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const fromIndex = entries.findIndex((entry) => entry.id === draggedId);
    const toIndex = entries.findIndex((entry) => entry.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...entries];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setDraggedId(null);
    setDragOverId(null);
    await reorderEntries(next.map((entry) => entry.id));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Entries</h1>
        <button
          type="button"
          onClick={addEntry}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
        >
          Add Entry
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
            <tr>
              {['Order', 'Title', 'Status', 'Type', 'Application ID', 'Cache'].map((col) => (
                <th key={col} className="px-4 py-3 text-left">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                draggable
                onDragStart={(event) => {
                  setDraggedId(entry.id);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(entry.id));
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragOverId(entry.id);
                }}
                onDragLeave={() => setDragOverId((current) => current === entry.id ? null : current)}
                onDrop={(event) => {
                  event.preventDefault();
                  dropEntry(entry.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                onClick={() => viewEntry(entry.id)}
                className={`cursor-grab hover:bg-gray-50 active:cursor-grabbing dark:hover:bg-gray-700/40 transition-colors ${
                  draggedId === entry.id ? 'opacity-50' : ''
                } ${dragOverId === entry.id && draggedId !== entry.id ? 'bg-violet-50 dark:bg-violet-500/10' : ''}`}
              >
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400" title="Drag to reorder">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M5 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9-11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm1 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                      </svg>
                    </span>
                    <button
                      type="button"
                      title="Move up"
                      disabled={index === 0}
                      onClick={() => moveEntry(index, -1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      disabled={index === entries.length - 1}
                      onClick={() => moveEntry(index, 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      <span aria-hidden="true">↓</span>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{entry.title}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[entry.status] || STATUS_STYLES.pending}`}>
                    {STATUS_LABELS[entry.status] || 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.entry_type}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.application_id}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.cache_ttl_hours} hours</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan="6">No entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
