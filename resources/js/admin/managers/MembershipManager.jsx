import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Select, Toggle } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';
import { useConfirm } from '../components/ConfirmDialog';

export function MembershipManager({ entry, items, plans = [], reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const blankForm = {
    domain_id: entry.id,
    email: '',
    device_id: '',
    plan: '',
    provider: 'manual',
    status: 'active',
    product_id: '',
    base_plan_id: '',
    offer_id: '',
    country_code: '',
    currency: '',
    amount_paid: '',
    expires_at: '',
    grace_expires_at: '',
    is_active: true,
  };
  const [screen, setScreen]     = useState('list');   // 'list' | 'form' | 'promo'
  const [editingId, setEditingId] = useState(null);
  const [promoId, setPromoId]   = useState(null);
  const [form, setForm]         = useState(blankForm);
  const [promoForm, setPromoForm] = useState({ promo_code: '', promo_discount: '', amount_paid: '' });
  const { confirmDelete }       = useConfirm();

  const planOptions = plans.map((p) => [p.name, p.name]);

  useEffect(() => {
    setHeaderAction(screen === 'list' ? (
      <button type="button" onClick={createMembership}
        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
        Add Membership
      </button>
    ) : null);
    return () => setHeaderAction(null);
  }, [screen]);

  useEffect(() => {
    if (moduleAction === 'create') {
      setForm({ ...blankForm, domain_id: entry.id, plan: plans[0]?.name || '' });
      setEditingId(null);
      setScreen('form');
      return;
    }
    if (moduleAction === 'edit' && moduleItemId) {
      const membership = items.find((item) => String(item.id) === String(moduleItemId));
      if (membership) editMembership(membership, false);
      return;
    }
    setScreen('list');
    setEditingId(null);
  }, [moduleAction, moduleItemId, items, plans]);

  function createMembership() {
    setForm({ ...blankForm, domain_id: entry.id, plan: plans[0]?.name || '' });
    setEditingId(null);
    navigateModule?.('create');
  }

  function editMembership(membership, push = true) {
    setForm({
      ...blankForm,
      ...membership,
      domain_id: entry.id,
      email: membership.email || '',
      device_id: membership.device_id || '',
      provider: membership.provider || 'manual',
      status: membership.status || (membership.is_active ? 'active' : 'expired'),
      country_code: membership.country_code || '',
      currency: membership.currency || '',
      amount_paid: membership.amount_paid ?? '',
      product_id: membership.product_id || '',
      base_plan_id: membership.base_plan_id || '',
      offer_id: membership.offer_id || '',
      expires_at: String(membership.expires_at || '').slice(0, 16),
      grace_expires_at: String(membership.grace_expires_at || '').slice(0, 16),
    });
    setEditingId(membership.id);
    setScreen('form');
    if (push) navigateModule?.('edit', membership.id);
  }

  async function submit(event) {
    event.preventDefault();
    const url = editingId ? `/admin-api/memberships/${editingId}` : '/admin-api/memberships';
    await request(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await reload();
    navigateModule?.();
  }

  async function cancelMembership(item) {
    const confirmed = await confirmDelete({
      title: `Cancel ${item.email}'s membership`,
      message: 'This will mark the membership as inactive and record the cancellation time.',
      confirmLabel: 'Cancel Membership',
    });
    if (!confirmed) return;
    await request(`/admin-api/memberships/${item.id}/cancel`, { method: 'POST' });
    await reload();
  }

  function openPromo(item) {
    setPromoId(item.id);
    setPromoForm({
      promo_code: item.promo_code || '',
      promo_discount: item.promo_discount || '',
      amount_paid: item.amount_paid || '',
    });
    setScreen('promo');
  }

  async function submitPromo(e) {
    e.preventDefault();
    await request(`/admin-api/memberships/${promoId}/promo`, {
      method: 'POST',
      body: JSON.stringify(promoForm),
    });
    await reload();
    setScreen('list');
  }

  // ── Promo screen ────────────────────────────────────────────────────────────
  if (screen === 'promo') {
    const updP = (k, v) => setPromoForm((c) => ({ ...c, [k]: v }));
    return (
      <div className="p-5 max-w-md">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">Apply Promo Code</h2>
        <form onSubmit={submitPromo} className="space-y-4">
          <Input label="Promo Code" value={promoForm.promo_code} onChange={(v) => updP('promo_code', v)} required />
          <Input label="Discount Amount" type="number" value={promoForm.promo_discount} onChange={(v) => updP('promo_discount', v)} required />
          <Input label="Amount Actually Paid" type="number" value={promoForm.amount_paid} onChange={(v) => updP('amount_paid', v)} required />
          {Number(promoForm.amount_paid) === 0 && (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Amount paid is $0 — the user cannot request a refund for this membership.
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">Apply Promo</button>
            <button type="button" onClick={() => setScreen('list')} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // ── Edit / Create form ──────────────────────────────────────────────────────
  if (screen === 'form') {
    return (
      <MembershipForm
        form={form}
        setForm={setForm}
        editingId={editingId}
        planOptions={planOptions}
        submit={submit}
        cancel={() => navigateModule?.()}
      />
    );
  }

  // ── List ────────────────────────────────────────────────────────────────────
  return (
    <DataRows
      items={items}
      columns={['email', 'device_id', 'plan', 'provider', 'status', 'country_code', 'product_id', 'expires_at', 'is_active', 'cancelled_at']}
      renderers={{
        email: (item) => item.email || <span className="text-gray-400">device only</span>,
        device_id: (item) => item.device_id ? <span className="font-mono text-xs">{item.device_id}</span> : '-',
        provider: (item) => <ProviderBadge value={item.provider || 'manual'} />,
        status: (item) => <StatusBadge active={item.is_active} status={item.status} />,
        product_id: (item) => item.product_id ? <span className="font-mono text-xs">{item.product_id}</span> : '-',
      }}
      actions={(item) => (
        <ActionGroup>
          <EditButton label={`Edit ${item.email}`} onClick={() => editMembership(item)} />

          {/* Promo button */}
          <button type="button" title="Apply promo code" onClick={() => openPromo(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M1 8.5 8.5 1h5.5v5.5L6.5 15 1 8.5Zm10-5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
            </svg>
          </button>

          {/* Cancel button — only if active */}
          {item.is_active && !item.cancelled_at && (
            <button type="button" title="Cancel membership" onClick={() => cancelMembership(item)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-500/15 dark:text-orange-300">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3 4.5L5.5 11l-1-1L10 4.5l1 1Z" />
              </svg>
            </button>
          )}

          <DeleteButton url={`/admin-api/memberships/${item.id}`} reload={reload} />
        </ActionGroup>
      )}
    />
  );
}

function MembershipForm({ form, setForm, editingId, planOptions, submit, cancel }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const providerOptions = [
    ['manual', 'Manual bypass'],
    ['google_play', 'Google Play'],
    ['trial', 'Free trial'],
    ['promo', 'Promo'],
  ];
  const statusOptions = [
    ['active', 'Active'],
    ['grace', 'Grace'],
    ['pending', 'Pending'],
    ['cancelled', 'Cancelled'],
    ['expired', 'Expired'],
  ];

  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit Membership' : 'Add Membership'}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          For manual ads bypass, add the user's email or app device id, keep status active, and leave expiry empty for lifetime access.
        </p>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} placeholder="user@example.com" />
        <Input label="Device ID" value={form.device_id} onChange={(value) => update('device_id', value)} placeholder="App device id" />
        {planOptions.length > 0 ? (
          <Select label="Plan" value={form.plan} onChange={(value) => update('plan', value)} options={planOptions} />
        ) : (
          <Input label="Plan" value={form.plan} onChange={(value) => update('plan', value)} required />
        )}
        <Select label="Provider" value={form.provider || 'manual'} onChange={(value) => update('provider', value)} options={providerOptions} />
        <Select label="Status" value={form.status || 'active'} onChange={(value) => update('status', value)} options={statusOptions} />
        <Input label="Amount Paid" type="number" step="0.01" min="0" value={form.amount_paid} onChange={(value) => update('amount_paid', value)} />
        <Input label="Country Code" value={form.country_code} onChange={(value) => update('country_code', value.toUpperCase().slice(0, 2))} placeholder="PK" />
        <Input label="Currency" value={form.currency} onChange={(value) => update('currency', value.toUpperCase().slice(0, 3))} placeholder="PKR" />
        <Input label="Expires At" type="datetime-local" value={form.expires_at || ''} onChange={(value) => update('expires_at', value)} />
        <Input label="Grace Expires At" type="datetime-local" value={form.grace_expires_at || ''} onChange={(value) => update('grace_expires_at', value)} />
        <Input label="Product ID" value={form.product_id} onChange={(value) => update('product_id', value)} />
        <Input label="Base Plan ID" value={form.base_plan_id} onChange={(value) => update('base_plan_id', value)} />
        <Input label="Offer ID" value={form.offer_id} onChange={(value) => update('offer_id', value)} />
        <Toggle label="Access" checked={!!form.is_active} onChange={(value) => update('is_active', value)} />
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update Membership' : 'Create Membership'}</button>
          <button type="button" onClick={cancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function ProviderBadge({ value }) {
  const label = String(value || 'manual').replaceAll('_', ' ');
  const color = value === 'google_play'
    ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
    : 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${color}`}>{label}</span>;
}

function StatusBadge({ active, status }) {
  const label = active ? (status || 'active') : 'inactive';
  const color = active
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${color}`}>{label}</span>;
}
