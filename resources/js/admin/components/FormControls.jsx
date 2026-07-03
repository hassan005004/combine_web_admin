import { useEffect, useRef, useState } from 'react';

// ─── Shared style tokens ──────────────────────────────────────────────────────

const inputCls =
  'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ' +
  'placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 ' +
  'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 ' +
  'dark:focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-50';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

// ─── Label wrapper ────────────────────────────────────────────────────────────

function FieldWrap({ label, hint, required, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={labelCls}>
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">({hint})</span>}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({ label, value, onChange, type = 'text', required = false, name, placeholder, hint, disabled }) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={type === 'color'
          ? 'mt-1 h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-900'
          : inputCls}
      />
    </FieldWrap>
  );
}

// ─── DateInput (datetime-local, date, time) ───────────────────────────────────

export function DateInput({ label, value, onChange, type = 'datetime-local', required = false, hint }) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <input
        type={type}
        required={required}
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={inputCls}
      />
    </FieldWrap>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

export function Select({ label, value, onChange, options, hint, required }) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <select
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>{text}</option>
        ))}
      </select>
    </FieldWrap>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea({ label, value, onChange, rows = 4, required = false, placeholder, hint }) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <textarea
        required={required}
        rows={rows}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={inputCls + ' resize-y'}
      />
    </FieldWrap>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export function Toggle({ label, checked, onChange, onText = 'Active', offText = 'Inactive' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={labelCls}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-10 w-36 items-center rounded-full px-1 transition-colors ${
          checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`grid h-8 w-8 place-items-center rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[6.25rem]' : 'translate-x-0'
          }`}
        />
        <span className={`absolute ml-10 text-sm font-semibold select-none ${checked ? 'text-white' : 'text-gray-700 dark:text-gray-100'}`}>
          {checked ? onText : offText}
        </span>
      </button>
    </div>
  );
}

// ─── ImageInput (URL paste + file upload with preview) ────────────────────────

export function ImageInput({ label = 'Image', hint = 'optional', urlValue, fileValue, onUrlChange, onFileChange }) {
  const fileRef = useRef(null);
  const previewSrc = fileValue ? URL.createObjectURL(fileValue) : urlValue || null;

  function handleFile(e) {
    const picked = e.target.files?.[0] || null;
    onFileChange(picked);
    if (picked) onUrlChange('');
  }

  function clear() {
    onFileChange(null);
    onUrlChange('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <FieldWrap label={label} hint={hint}>
      <div className="flex items-stretch gap-2">
        <input
          type="url"
          placeholder="https://example.com/image.png"
          value={fileValue ? '' : (urlValue ?? '')}
          disabled={Boolean(fileValue)}
          onChange={(e) => { onUrlChange(e.target.value); onFileChange(null); }}
          className={inputCls + ' flex-1'}
        />
        <button
          type="button"
          title="Upload image file"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </div>
      {previewSrc && (
        <div className="mt-2 flex items-center gap-3">
          <img src={previewSrc} alt="Preview" className="h-14 w-14 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
          <p className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {fileValue ? fileValue.name : urlValue}
          </p>
          <button type="button" onClick={clear} className="text-xs text-red-500 hover:text-red-700">Remove</button>
        </div>
      )}
    </FieldWrap>
  );
}

// ─── FilePicker ───────────────────────────────────────────────────────────────

export function FilePicker({ label = 'File', hint, required, savedFile, fileName, onChange }) {
  return (
    <FieldWrap label={label} hint={hint} required={required}>
      <label className="block cursor-pointer">
        <span className="mt-1 flex min-h-10 items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900">
          <span className="shrink-0 rounded-md bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            Browse
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
            {fileName || (savedFile ? 'Current file saved' : 'No file chosen')}
          </span>
        </span>
        <input
          type="file"
          required={required && !savedFile}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
      {savedFile && !fileName && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Leave empty to keep the saved file.</p>
      )}
    </FieldWrap>
  );
}

// ─── HtmlEditor ───────────────────────────────────────────────────────────────

export function HtmlEditor({ label, value, onChange }) {
  const editorRef = useRef(null);
  const [sourceMode, setSourceMode] = useState(false);

  useEffect(() => {
    if (!editorRef.current || sourceMode) return;
    if (editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, sourceMode]);

  function runCommand(command, commandValue = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || '');
  }

  function addLink() {
    const url = window.prompt('Enter link URL');
    if (!url) return;
    runCommand('createLink', url);
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-3">
        <span className={labelCls}>{label}</span>
        <button
          type="button"
          onClick={() => setSourceMode((c) => !c)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
        >
          {sourceMode ? 'Editor' : 'HTML'}
        </button>
      </div>

      {!sourceMode && (
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
          <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
            {[
              ['Bold', 'bold', 'B'],
              ['Italic', 'italic', 'I'],
              ['Underline', 'underline', 'U'],
            ].map(([title, cmd, ch]) => (
              <EditorButton key={cmd} label={title} onClick={() => runCommand(cmd)}>{ch}</EditorButton>
            ))}
            <EditorButton label="Heading" onClick={() => runCommand('formatBlock', 'h2')}>H</EditorButton>
            <EditorButton label="Paragraph" onClick={() => runCommand('formatBlock', 'p')}>P</EditorButton>
            <EditorButton label="Bulleted list" onClick={() => runCommand('insertUnorderedList')}>UL</EditorButton>
            <EditorButton label="Numbered list" onClick={() => runCommand('insertOrderedList')}>1.</EditorButton>
            <EditorButton label="Link" onClick={addLink}>Link</EditorButton>
            <EditorButton label="Clear formatting" onClick={() => runCommand('removeFormat')}>Tx</EditorButton>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            className="min-h-44 w-full px-3 py-2 text-sm text-gray-900 outline-none dark:text-gray-100 [&_a]:text-violet-600 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc"
          />
        </div>
      )}

      {sourceMode && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className={inputCls + ' font-mono text-xs'}
        />
      )}
    </div>
  );
}

function EditorButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-sm dark:text-gray-100 dark:hover:bg-gray-700"
    >
      {children}
    </button>
  );
}
