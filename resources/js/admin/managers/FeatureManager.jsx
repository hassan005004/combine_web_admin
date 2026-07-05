import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Toggle } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';
import { FeatureIcon, FeatureIconBadge, featureIconOptions } from '../components/FeatureIcon';

export function FeatureManager({ entry, items, reload, setHeaderAction }) {
  const blankForm = { domain_id: entry.id, icon: 'star', text: '', sorting: 0, is_active: true };
  const [screen, setScreen] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={createFeature} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">Add Feature</button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  function createFeature() {
    setForm({ ...blankForm, domain_id: entry.id });
    setEditingId(null);
    setScreen('form');
  }

  function editFeature(feature) {
    setForm({ ...blankForm, ...feature, domain_id: entry.id });
    setEditingId(feature.id);
    setScreen('form');
  }

  async function submit(event) {
    event.preventDefault();
    const url = editingId ? `/admin-api/membership-features/${editingId}` : '/admin-api/membership-features';
    await request(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await reload();
    setScreen('list');
  }

  if (screen === 'form') {
    return <FeatureForm form={form} setForm={setForm} editingId={editingId} submit={submit} cancel={() => setScreen('list')} />;
  }

  return (
    <>
      <DataRows
        items={items}
        columns={['icon', 'text', 'sorting', 'is_active']}
        renderers={{ icon: (item) => <FeatureIconBadge name={item.icon} /> }}
        actions={(item) => (
          <ActionGroup>
            <EditButton label="Edit feature" onClick={() => editFeature(item)} />
            <DeleteButton url={`/admin-api/membership-features/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}

function FeatureForm({ form, setForm, editingId, submit, cancel }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit Feature' : 'Add Feature'}</h2>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IconPicker value={form.icon || 'star'} onChange={(value) => update('icon', value)} />
        <Input label="Text" value={form.text || ''} onChange={(value) => update('text', value)} />
        <Input label="Sorting" type="number" value={form.sorting ?? 0} onChange={(value) => update('sorting', Number(value))} />
        <Toggle label="Status" checked={!!form.is_active} onChange={(value) => update('is_active', value)} />
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update Feature' : 'Create Feature'}</button>
          <button type="button" onClick={cancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function IconPicker({ value, onChange }) {
  return (
    <div className="md:col-span-3">
      <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Icon</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {featureIconOptions.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              value === key
                ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
            }`}
          >
            <FeatureIcon name={key} className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
