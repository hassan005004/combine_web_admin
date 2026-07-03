import { ActionGroup, DeleteButton, EditButton, ViewButton } from '../components/DataRows';

export function Entries(props) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Entries</h1>
        <button type="button" onClick={props.addEntry} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
          Add Entry
        </button>
      </div>
      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
            <tr>
              {['Title', 'Type', 'Application ID', 'Cache', 'Actions'].map((col) => <th key={col} className={`px-4 py-3 ${col === 'Actions' ? 'text-right' : 'text-left'}`}>{col}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {props.entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{entry.title}</td>
                <td className="px-4 py-3">{entry.entry_type}</td>
                <td className="px-4 py-3">{entry.application_id}</td>
                <td className="px-4 py-3">{entry.cache_ttl_hours} hours</td>
                <td className="px-4 py-3 text-right">
                  <ActionGroup>
                    <ViewButton label={`View ${entry.title}`} onClick={() => props.viewEntry(entry.id)} />
                    <EditButton label={`Edit ${entry.title}`} onClick={() => props.editEntry(entry)} />
                    <DeleteButton url={`/admin-api/entries/${entry.id}`} reload={props.reloadEntries} />
                  </ActionGroup>
                </td>
              </tr>
            ))}
            {props.entries.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-center text-gray-500" colSpan="5">No entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
