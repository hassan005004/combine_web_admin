import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Select, Toggle } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';
import { useConfirm } from '../components/ConfirmDialog';
import { COUNTRY_PRICE_ROWS } from '../data/countryPricingTiers';

const BILLING_PERIOD_OPTIONS = [
  ['monthly', 'Monthly subscriber'],
  ['yearly', 'Yearly subscriber'],
];

function normalizeCountryCode(value) {
  return String(value ?? '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
}

function normalizeCurrency(value, fallback = 'USD') {
  const currency = String(value || fallback || 'USD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  return currency || 'USD';
}

function normalizePeriod(value) {
  return value === 'yearly' ? 'yearly' : 'monthly';
}

function stringValue(value) {
  return String(value ?? '').trim();
}

function countryRowForCode(countryCode) {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;

  return COUNTRY_PRICE_ROWS.find((row) => (
    row.code === code ||
    (row.aliases || []).some((alias) => normalizeCountryCode(alias) === code)
  )) || null;
}

function planByName(plans, name) {
  return plans.find((plan) => plan.name === name) || null;
}

function calculateYearlyPrice(monthlyPrice, yearlyFreeMonths = 0) {
  const monthly = Number.parseFloat(monthlyPrice) || 0;
  const freeMonths = Math.min(12, Math.max(0, Number(yearlyFreeMonths) || 0));
  return (monthly * Math.max(0, 12 - freeMonths)).toFixed(2);
}

function countryPriceForPlan(plan, countryCode) {
  const code = normalizeCountryCode(countryCode);
  const prices = plan?.country_prices || {};

  if (!code) return null;

  if (Array.isArray(prices)) {
    return prices.find((row) => normalizeCountryCode(row.country_code) === code) || null;
  }

  return prices[code] || null;
}

function resolvePlanBilling(plan, countryCode, billingPeriod) {
  const period = normalizePeriod(billingPeriod);
  const countryRow = countryRowForCode(countryCode);
  const tierId = countryRow?.tierId || '';
  const tierSettings = tierId ? (plan?.google_play_tier_product_ids?.[tierId] || {}) : {};
  const prefix = period === 'yearly' ? 'yearly' : 'monthly';
  const productId = stringValue(tierSettings[`${prefix}_product_id`] ?? plan?.[`google_play_${prefix}_product_id`]);
  const basePlanId = stringValue(tierSettings[`${prefix}_base_plan_id`] ?? plan?.[`google_play_${prefix}_base_plan_id`]);
  const offerId = stringValue(tierSettings[`${prefix}_offer_id`] ?? plan?.[`google_play_${prefix}_offer_id`]);
  const countryPrice = countryPriceForPlan(plan, countryCode);
  const monthlyPrice = countryPrice?.monthly_price ?? tierSettings.monthly_price ?? plan?.monthly_price ?? '';
  const yearlyPrice = countryPrice?.yearly_price ?? calculateYearlyPrice(monthlyPrice, plan?.yearly_free_months);
  const amountPaid = period === 'yearly' ? yearlyPrice : monthlyPrice;
  const currency = normalizeCurrency(countryPrice?.currency ?? tierSettings.currency ?? plan?.currency, '');

  return {
    period,
    productId,
    basePlanId,
    offerId,
    amountPaid: amountPaid === '' ? '' : Number.parseFloat(amountPaid).toFixed(2),
    currency,
    tierId,
    countryRow,
    hasAnyId: Boolean(productId || basePlanId || offerId),
  };
}

function inferMembershipPeriod(membership, plans) {
  const savedPeriod = normalizePeriod(membership.billing_period);
  if (membership.billing_period) return savedPeriod;

  const selectedPlan = planByName(plans, membership.plan);
  if (!selectedPlan) return 'monthly';

  const productId = stringValue(membership.product_id);
  const basePlanId = stringValue(membership.base_plan_id);
  const yearlyMatches = [
    selectedPlan.google_play_yearly_product_id,
    selectedPlan.google_play_yearly_base_plan_id,
    ...Object.values(selectedPlan.google_play_tier_product_ids || {}).flatMap((ids) => [
      ids?.yearly_product_id,
      ids?.yearly_base_plan_id,
    ]),
  ].map(stringValue).filter(Boolean);

  return yearlyMatches.includes(productId) || yearlyMatches.includes(basePlanId) ? 'yearly' : 'monthly';
}

function periodLabel(value) {
  return normalizePeriod(value) === 'yearly' ? 'Yearly' : 'Monthly';
}

export function MembershipManager({ entry, items, plans = [], reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const blankForm = {
    domain_id: entry.id,
    email: '',
    device_id: '',
    plan: '',
    billing_period: 'monthly',
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
      billing_period: inferMembershipPeriod(membership, plans),
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
        plans={plans}
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
      columns={['email', 'device_id', 'plan', 'billing_period', 'provider', 'status', 'country_code', 'product_id', 'base_plan_id', 'offer_id', 'expires_at', 'is_active', 'cancelled_at']}
      renderers={{
        email: (item) => item.email || <span className="text-gray-400">device only</span>,
        device_id: (item) => item.device_id ? <span className="font-mono text-xs">{item.device_id}</span> : '-',
        billing_period: (item) => <span className="text-sm">{periodLabel(item.billing_period)}</span>,
        provider: (item) => <ProviderBadge value={item.provider || 'manual'} />,
        status: (item) => <StatusBadge active={item.is_active} status={item.status} />,
        product_id: (item) => item.product_id ? <span className="font-mono text-xs">{item.product_id}</span> : '-',
        base_plan_id: (item) => item.base_plan_id ? <span className="font-mono text-xs">{item.base_plan_id}</span> : '-',
        offer_id: (item) => item.offer_id ? <span className="font-mono text-xs">{item.offer_id}</span> : '-',
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

function MembershipForm({ form, setForm, editingId, plans, planOptions, submit, cancel }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectedPlan = planByName(plans, form.plan);
  const resolvedBilling = resolvePlanBilling(selectedPlan, form.country_code, form.billing_period);
  const tierText = resolvedBilling.countryRow
    ? `${resolvedBilling.countryRow.code}, ${resolvedBilling.countryRow.name}, ${resolvedBilling.countryRow.tierLabel}`
    : (form.country_code ? `${normalizeCountryCode(form.country_code)}, no pricing tier found` : 'Add country code to resolve tier');
  const idSourceText = resolvedBilling.tierId
    ? `${periodLabel(form.billing_period)} IDs from ${resolvedBilling.tierId}`
    : `${periodLabel(form.billing_period)} IDs from plan fallback`;

  useEffect(() => {
    if (!selectedPlan || form.product_id || form.base_plan_id || form.offer_id) return;
    if (!resolvedBilling.hasAnyId) return;

    setForm((current) => {
      if (current.product_id || current.base_plan_id || current.offer_id) return current;

      return {
        ...current,
        product_id: resolvedBilling.productId,
        base_plan_id: resolvedBilling.basePlanId,
        offer_id: resolvedBilling.offerId,
        currency: current.currency || resolvedBilling.currency,
        amount_paid: current.amount_paid === '' ? resolvedBilling.amountPaid : current.amount_paid,
      };
    });
  }, [form.plan, form.country_code, form.billing_period, selectedPlan?.id]);

  function applyPlanBilling() {
    setForm((current) => ({
      ...current,
      product_id: resolvedBilling.productId,
      base_plan_id: resolvedBilling.basePlanId,
      offer_id: resolvedBilling.offerId,
      currency: resolvedBilling.currency || current.currency,
      amount_paid: resolvedBilling.amountPaid || current.amount_paid,
    }));
  }

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
        <Select label="Billing Period" value={form.billing_period || 'monthly'} onChange={(value) => update('billing_period', value)} options={BILLING_PERIOD_OPTIONS} />
        <Select label="Provider" value={form.provider || 'manual'} onChange={(value) => update('provider', value)} options={providerOptions} />
        <Select label="Status" value={form.status || 'active'} onChange={(value) => update('status', value)} options={statusOptions} />
        <Input label="Amount Paid" type="number" step="0.01" min="0" value={form.amount_paid} onChange={(value) => update('amount_paid', value)} />
        <Input label="Country Code" value={form.country_code} onChange={(value) => update('country_code', value.toUpperCase().slice(0, 2))} placeholder="PK" />
        <Input label="Currency" value={form.currency} onChange={(value) => update('currency', value.toUpperCase().slice(0, 3))} placeholder="PKR" />
        <Input label="Expires At" type="datetime-local" value={form.expires_at || ''} onChange={(value) => update('expires_at', value)} />
        <Input label="Grace Expires At" type="datetime-local" value={form.grace_expires_at || ''} onChange={(value) => update('grace_expires_at', value)} />
        <div className="md:col-span-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Plan Billing IDs</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {tierText} | {idSourceText}
              </p>
            </div>
            <button
              type="button"
              onClick={applyPlanBilling}
              disabled={!resolvedBilling.hasAnyId}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            >
              Use Plan IDs
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="Product ID" value={form.product_id} onChange={(value) => update('product_id', value)} placeholder={resolvedBilling.productId} hint={periodLabel(form.billing_period)} />
            <Input label="Base Plan ID" value={form.base_plan_id} onChange={(value) => update('base_plan_id', value)} placeholder={resolvedBilling.basePlanId} hint={periodLabel(form.billing_period)} />
            <Input label="Offer ID" value={form.offer_id} onChange={(value) => update('offer_id', value)} placeholder={resolvedBilling.offerId} hint={periodLabel(form.billing_period)} />
          </div>
        </div>
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
