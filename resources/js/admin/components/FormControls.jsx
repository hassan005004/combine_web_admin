export function Input({ label, value, onChange, type = 'text', required = false, name }) {
  const inputProps = onChange ? { value: value ?? '', onChange: (event) => onChange(event.target.value) } : {};

  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        {...inputProps}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
      />
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
      >
        {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select>
    </label>
  );
}

export function Textarea({ label, value, onChange }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows="4"
        className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
      />
    </label>
  );
}

export function Toggle({ label, checked, onChange, onText = 'Active', offText = 'Inactive' }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 md:self-end">
      <span className="block mb-2">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-10 w-36 items-center rounded-full px-1 transition ${
          checked
            ? 'bg-green-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`grid h-8 w-8 place-items-center rounded-full bg-white shadow transition ${
            checked ? 'translate-x-[6.25rem]' : 'translate-x-0'
          }`}
        />
        <span className={`absolute ml-10 text-sm font-semibold ${checked ? 'text-white' : 'text-gray-700 dark:text-gray-100'}`}>
          {checked ? onText : offText}
        </span>
      </button>
    </label>
  );
}
