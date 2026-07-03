import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Select, Toggle } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';
import { useConfirm } from '../components/ConfirmDialog';

export function MembershipManager({ entry, items, plans = [], reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const blankForm = { domain_id: entry.id, email: '', plan: '', expires_at: '', is_active: true };
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
    setForm({ ...blankForm, ...membership, domain_id: entry.id, expires_at: String(membership.expires_at || '').slice(0, 16) });
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
      columns={['email', 'plan', 'expires_at', 'is_active', 'promo_code', 'cancelled_at', 'cancellation_source', 'cancellation_reason', 'cancellation_details']}
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

  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit Membership' : 'Add Membership'}</h2>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
        {planOptions.length > 0 ? (
          <Select label="Plan" value={form.plan} onChange={(value) => update('plan', value)} options={planOptions} />
        ) : (
          <Input label="Plan" value={form.plan} onChange={(value) => update('plan', value)} required />
        )}
        <Input label="Expires At" type="datetime-local" value={form.expires_at || ''} onChange={(value) => update('expires_at', value)} />
        <Toggle label="Status" checked={!!form.is_active} onChange={(value) => update('is_active', value)} />
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update Membership' : 'Create Membership'}</button>
          <button type="button" onClick={cancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  );
}
