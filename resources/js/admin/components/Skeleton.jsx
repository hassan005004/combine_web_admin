export function Shimmer({ className = '' }) {
  return <div className={`shimmer rounded-lg ${className}`} aria-hidden="true" />;
}

export function PageSkeleton({ titleWidth = 'w-64', subtitleWidth = 'w-48' }) {
  return (
    <>
      <div className="mb-8">
        <Shimmer className={`h-10 ${titleWidth}`} />
        <Shimmer className={`mt-3 h-5 ${subtitleWidth}`} />
      </div>
      <CardGridSkeleton />
      <TableSkeleton />
    </>
  );
}

export function EntryScreenSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Shimmer className="h-10 w-56" />
          <Shimmer className="mt-3 h-5 w-72" />
        </div>
        <Shimmer className="h-10 w-32" />
      </div>
      <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <TableSkeleton compact />
      </div>
    </>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="mt-4 h-9 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ compact = false }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {!compact && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <Shimmer className="h-5 w-40" />
        </div>
      )}
      <div className="p-5">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, index) => <Shimmer key={index} className="h-4" />)}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-4 gap-4 py-3 border-t border-gray-100 dark:border-gray-700/60">
            {Array.from({ length: 4 }).map((__, col) => <Shimmer key={col} className="h-4" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
