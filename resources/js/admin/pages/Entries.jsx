export function Entries({ entries, addEntry, viewEntry }) {
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
              {['Title', 'Type', 'Application ID', 'Cache'].map((col) => (
                <th key={col} className="px-4 py-3 text-left">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => viewEntry(entry.id)}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{entry.title}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.entry_type}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.application_id}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.cache_ttl_hours} hours</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan="4">No entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
