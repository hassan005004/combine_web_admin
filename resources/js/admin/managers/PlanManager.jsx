import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Toggle } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

export function PlanManager({ entry, items, reload, setHeaderAction }) {
  const blankForm = {
    domain_id: entry.id,
    name: '',
    monthly_price: '0.00',
    yearly_price: '0.00',
    tagline: '',
    yearly_benefit: '',
    sorting: 0,
    is_active: true,
  };
  const [screen, setScreen] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={createPlan} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">Add Plan</button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  function createPlan() {
    setForm({ ...blankForm, domain_id: entry.id });
    setEditingId(null);
    setScreen('form');
  }

  function editPlan(plan) {
    setForm({ ...blankForm, ...plan, domain_id: entry.id });
    setEditingId(plan.id);
    setScreen('form');
  }

  async function submit(event) {
    event.preventDefault();
    const url = editingId ? `/admin-api/membership-plans/${editingId}` : '/admin-api/membership-plans';
    await request(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await reload();
    setScreen('list');
  }

  if (screen === 'form') {
    return (
      <PlanForm
        form={form}
        setForm={setForm}
        editingId={editingId}
        submit={submit}
        cancel={() => setScreen('list')}
      />
    );
  }

  return (
    <>
      <DataRows
        items={items}
        columns={['name', 'monthly_price', 'yearly_price', 'tagline', 'yearly_benefit']}
        actions={(item) => (
          <ActionGroup>
            <EditButton label={`Edit ${item.name}`} onClick={() => editPlan(item)} />
            <DeleteButton url={`/admin-api/membership-plans/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}

function PlanForm({ form, setForm, editingId, submit, cancel }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit Plan' : 'Add Plan'}</h2>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Name" value={form.name} onChange={(value) => update('name', value)} required />
        <Input label="Monthly Price" value={form.monthly_price} onChange={(value) => update('monthly_price', value)} required />
        <Input label="Yearly Price" value={form.yearly_price} onChange={(value) => update('yearly_price', value)} required />
        <Input label="Tagline" value={form.tagline || ''} onChange={(value) => update('tagline', value)} />
        <Input label="Yearly Benefit" value={form.yearly_benefit || ''} onChange={(value) => update('yearly_benefit', value)} />
        <Input label="Sorting" type="number" value={form.sorting ?? 0} onChange={(value) => update('sorting', Number(value))} />
        <Toggle label="Status" checked={!!form.is_active} onChange={(value) => update('is_active', value)} />
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update Plan' : 'Create Plan'}</button>
          <button type="button" onClick={cancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  );
}
