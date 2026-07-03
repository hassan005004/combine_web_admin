export function MetricCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{Number(value || 0).toLocaleString()}</div>
    </div>
  );
}
