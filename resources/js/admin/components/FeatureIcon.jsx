export const featureIconOptions = [
  ['star', 'Star'],
  ['dot', 'Dot'],
  ['arrow', 'Arrow'],
  ['check', 'Check'],
  ['bolt', 'Bolt'],
  ['shield', 'Shield'],
  ['crown', 'Crown'],
  ['lock', 'Lock'],
  ['heart', 'Heart'],
  ['gift', 'Gift'],
];

export function FeatureIcon({ name, className = 'h-5 w-5' }) {
  const icons = {
    star: <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84L6.6 19.6l1.03-6-4.36-4.25 6.03-.88L12 3Z" />,
    dot: <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
    arrow: <path d="M13 5 20 12l-7 7v-4H4V9h9V5Z" />,
    check: <path d="m9.2 16.2-4.4-4.4 1.9-1.9 2.5 2.5 8.1-8.1 1.9 1.9-10 10Z" />,
    bolt: <path d="M13 2 4 13h7l-1 9 9-12h-7l1-8Z" />,
    shield: <path d="M12 2 5 5v5.5c0 4.1 2.8 7.9 7 9.5 4.2-1.6 7-5.4 7-9.5V5l-7-3Z" />,
    crown: <path d="m4 18-1-10 5 4 4-7 4 7 5-4-1 10H4Zm1 2h14v2H5v-2Z" />,
    lock: <path d="M6 10V8a6 6 0 1 1 12 0v2h1v11H5V10h1Zm3 0h6V8a3 3 0 1 0-6 0v2Z" />,
    heart: <path d="M12 21s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.1-8 11-8 11Z" />,
    gift: <path d="M20 7h-2.2A3 3 0 0 0 12 4.8 3 3 0 0 0 6.2 7H4v5h1v9h14v-9h1V7ZM9 5.5c.8 0 1.4.6 1.7 1.5H8.5A1.5 1.5 0 0 1 9 5.5Zm6 0c.5 0 1 .3 1.3.8.1.2.2.4.2.7h-3.2c.3-.9.9-1.5 1.7-1.5ZM7 12h4v7H7v-7Zm6 7v-7h4v7h-4Z" />,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {icons[name] || icons.star}
    </svg>
  );
}

export function FeatureIconBadge({ name }) {
  const label = featureIconOptions.find(([key]) => key === name)?.[1] || 'Star';

  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
        <FeatureIcon name={name || 'star'} />
      </span>
      <span>{label}</span>
    </span>
  );
}
