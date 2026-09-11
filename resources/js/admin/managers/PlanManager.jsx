import { useEffect, useState } from 'react';
import { request } from '../api';
import { Input, Toggle } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';
import { FeatureIcon, featureIconOptions } from '../components/FeatureIcon';
import { COUNTRY_PRICING_TIERS, COUNTRY_PRICE_ROWS } from '../data/countryPricingTiers';

function calculateYearlyPrice(monthlyPrice, yearlyFreeMonths = 0) {
  const monthly = Number.parseFloat(monthlyPrice) || 0;
  const freeMonths = Math.min(12, Math.max(0, Number(yearlyFreeMonths) || 0));
  return (monthly * Math.max(0, 12 - freeMonths)).toFixed(2);
}

function normalizeCountryCode(value) {
  return String(value ?? '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
}

function normalizeCurrency(value, fallback = 'USD') {
  const currency = String(value || fallback || 'USD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  return currency || 'USD';
}

function countryPricesToRows(countryPrices = {}) {
  if (Array.isArray(countryPrices)) {
    return countryPrices.map((row) => ({
      country_code: normalizeCountryCode(row.country_code),
      monthly_price: row.monthly_price ?? '',
      yearly_price: row.yearly_price ?? '',
      currency: normalizeCurrency(row.currency),
    }));
  }

  return Object.entries(countryPrices || {}).map(([countryCode, price]) => ({
    country_code: normalizeCountryCode(countryCode),
    monthly_price: price?.monthly_price ?? '',
    yearly_price: price?.yearly_price ?? '',
    currency: normalizeCurrency(price?.currency),
  }));
}

function countryRowsToPrices(rows = [], defaultCurrency = 'USD', yearlyFreeMonths = 0) {
  return rows.reduce((prices, row) => {
    const countryCode = normalizeCountryCode(row.country_code);
    const monthlyText = String(row.monthly_price ?? '').trim();
    const monthlyPrice = Number.parseFloat(monthlyText);

    if (!countryCode || monthlyText === '' || !Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
      return prices;
    }

    prices[countryCode] = {
      monthly_price: monthlyPrice.toFixed(2),
      yearly_price: calculateYearlyPrice(monthlyPrice, yearlyFreeMonths),
      currency: normalizeCurrency(row.currency, defaultCurrency),
    };

    return prices;
  }, {});
}

function countryRowsByCode(rows = []) {
  return rows.reduce((map, row) => {
    const countryCode = normalizeCountryCode(row.country_code);
    if (!countryCode) return map;

    map[countryCode] = {
      ...row,
      country_code: countryCode,
    };

    return map;
  }, {});
}

export function PlanManager({ entry, items, reload, setHeaderAction, moduleAction, moduleItemId, navigateModule }) {
  const blankForm = {
    domain_id: entry.id,
    name: '',
    monthly_price: '0.00',
    yearly_price: '0.00',
    currency: 'USD',
    free_trial_days: 7,
    yearly_free_months: 0,
    tagline: '',
    yearly_benefit: '',
    google_play_monthly_product_id: '',
    google_play_monthly_base_plan_id: '',
    google_play_monthly_offer_id: '',
    google_play_yearly_product_id: '',
    google_play_yearly_base_plan_id: '',
    google_play_yearly_offer_id: '',
    country_prices: [],
    sorting: 0,
    is_active: true,
    features: [],
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

  useEffect(() => {
    if (moduleAction === 'create') {
      setForm({ ...blankForm, domain_id: entry.id });
      setEditingId(null);
      setScreen('form');
      return;
    }
    if (moduleAction === 'edit' && moduleItemId) {
      const plan = items.find((item) => String(item.id) === String(moduleItemId));
      if (plan) editPlan(plan, false);
      return;
    }
    setScreen('list');
    setEditingId(null);
  }, [moduleAction, moduleItemId, items]);

  function createPlan() {
    setForm({ ...blankForm, domain_id: entry.id });
    setEditingId(null);
    navigateModule?.('create');
  }

  function editPlan(plan, push = true) {
    setForm({
      ...blankForm,
      ...plan,
      domain_id: entry.id,
      country_prices: countryPricesToRows(plan.country_prices || {}),
    });
    setEditingId(plan.id);
    setScreen('form');
    if (push) navigateModule?.('edit', plan.id);
  }

  async function submit(event) {
    event.preventDefault();
    const payload = { ...form };
    payload.country_prices = countryRowsToPrices(
      form.country_prices,
      payload.currency,
      payload.yearly_free_months,
    );
    payload.yearly_price = calculateYearlyPrice(payload.monthly_price, payload.yearly_free_months);
    const url = editingId ? `/admin-api/membership-plans/${editingId}` : '/admin-api/membership-plans';
    await request(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await reload();
    navigateModule?.();
  }

  if (screen === 'form') {
    return (
      <PlanForm
        form={form}
        setForm={setForm}
        editingId={editingId}
        submit={submit}
        cancel={() => navigateModule?.()}
      />
    );
  }

  return (
    <>
      <DataRows
        items={items}
        columns={['name', 'monthly_price', 'yearly_price', 'currency', 'free_trial_days', 'yearly_free_months', 'google_play_monthly_product_id', 'google_play_yearly_product_id']}
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
  const countryRows = Array.isArray(form.country_prices)
    ? form.country_prices
    : countryPricesToRows(form.country_prices || {});
  const updateBillingPrice = (key, value) => setForm((current) => {
    const next = { ...current, [key]: value };
    next.yearly_price = calculateYearlyPrice(next.monthly_price, next.yearly_free_months);
    if (Number(next.yearly_free_months || 0) > 0 && !next.yearly_benefit) {
      next.yearly_benefit = `${next.yearly_free_months} months free`;
    }
    return next;
  });

  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{editingId ? 'Edit Plan' : 'Add Plan'}</h2>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Name" value={form.name} onChange={(value) => update('name', value)} required />
        <Input label="Monthly Price" type="number" min="0" step="0.01" inputMode="decimal" value={form.monthly_price} onChange={(value) => updateBillingPrice('monthly_price', value)} required />
        <Input label="Yearly Price" value={form.yearly_price} onChange={() => {}} disabled hint="auto calculated" />
        <Input label="Currency" value={form.currency || 'USD'} onChange={(value) => update('currency', value.toUpperCase().slice(0, 3))} />
        <Input label="Free Trial Days" type="number" value={form.free_trial_days ?? 0} onChange={(value) => update('free_trial_days', Number(value))} />
        <Input label="Yearly Free Months" type="number" value={form.yearly_free_months ?? 0} onChange={(value) => updateBillingPrice('yearly_free_months', Math.min(12, Math.max(0, Number(value) || 0)))} />
        <Input label="Tagline" value={form.tagline || ''} onChange={(value) => update('tagline', value)} />
        <Input label="Yearly Benefit" value={form.yearly_benefit || ''} onChange={(value) => update('yearly_benefit', value)} />
        <Input label="Monthly Product ID" value={form.google_play_monthly_product_id || ''} onChange={(value) => update('google_play_monthly_product_id', value)} placeholder="remove_ads_monthly" />
        <Input label="Monthly Base Plan ID" value={form.google_play_monthly_base_plan_id || ''} onChange={(value) => update('google_play_monthly_base_plan_id', value)} placeholder="monthly" />
        <Input label="Monthly Offer ID" value={form.google_play_monthly_offer_id || ''} onChange={(value) => update('google_play_monthly_offer_id', value)} />
        <Input label="Yearly Product ID" value={form.google_play_yearly_product_id || ''} onChange={(value) => update('google_play_yearly_product_id', value)} placeholder="remove_ads_yearly" />
        <Input label="Yearly Base Plan ID" value={form.google_play_yearly_base_plan_id || ''} onChange={(value) => update('google_play_yearly_base_plan_id', value)} placeholder="yearly" />
        <Input label="Yearly Offer ID" value={form.google_play_yearly_offer_id || ''} onChange={(value) => update('google_play_yearly_offer_id', value)} />
        <Input label="Sorting" type="number" value={form.sorting ?? 0} onChange={(value) => update('sorting', Number(value))} />
        <Toggle label="Status" checked={!!form.is_active} onChange={(value) => update('is_active', value)} />
        <CountryPricesEditor
          rows={countryRows}
          setRows={(rows) => update('country_prices', rows)}
          defaultCurrency={form.currency || 'USD'}
          defaultMonthlyPrice={form.monthly_price || '0.00'}
          yearlyFreeMonths={form.yearly_free_months || 0}
        />
        <PlanFeatures features={form.features || []} setFeatures={(features) => update('features', features)} />
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{editingId ? 'Update Plan' : 'Create Plan'}</button>
          <button type="button" onClick={cancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function CountryPricesEditor({ rows, setRows, defaultCurrency, defaultMonthlyPrice, yearlyFreeMonths }) {
  const [query, setQuery] = useState('');
  const safeDefaultCurrency = normalizeCurrency(defaultCurrency);
  const defaultPriceText = String(defaultMonthlyPrice ?? '').trim() || '0.00';
  const overridesByCode = countryRowsByCode(rows);
  const overrideCount = rows.filter((row) => {
    const monthlyText = String(row.monthly_price ?? '').trim();
    return normalizeCountryCode(row.country_code) && monthlyText !== '';
  }).length;
  const normalizedQuery = query.trim().toLowerCase();

  const listedCountryCodes = new Set(COUNTRY_PRICE_ROWS.map((country) => country.code));
  const customRows = rows
    .filter((row) => {
      const countryCode = normalizeCountryCode(row.country_code);
      return countryCode && !listedCountryCodes.has(countryCode);
    })
    .map((row) => ({
      code: normalizeCountryCode(row.country_code),
      name: 'Custom country',
      tierId: 'custom',
      tierLabel: 'Custom',
      tierDescription: 'Saved country code that is not in the default list.',
    }));

  const updateCountry = (country, key, value) => {
    const countryCode = normalizeCountryCode(country.code);
    const current = overridesByCode[countryCode] || {
      country_code: countryCode,
      monthly_price: '',
      currency: safeDefaultCurrency,
    };
    const nextRow = {
      ...current,
      country_code: countryCode,
      [key]: key === 'currency' ? normalizeCurrency(value, safeDefaultCurrency) : value,
    };
    const otherRows = rows.filter((row) => normalizeCountryCode(row.country_code) !== countryCode);
    setRows([...otherRows, nextRow]);
  };

  const clearCountry = (countryCode) => {
    const normalizedCountryCode = normalizeCountryCode(countryCode);
    setRows(rows.filter((row) => normalizeCountryCode(row.country_code) !== normalizedCountryCode));
  };

  const tierRows = COUNTRY_PRICING_TIERS.map((tier) => ({
    ...tier,
    countries: tier.countries.filter((country) => {
      if (!normalizedQuery) return true;
      return country.code.toLowerCase().includes(normalizedQuery)
        || country.name.toLowerCase().includes(normalizedQuery)
        || country.aliases?.some((alias) => alias.toLowerCase().includes(normalizedQuery))
        || tier.title.toLowerCase().includes(normalizedQuery)
        || tier.label.toLowerCase().includes(normalizedQuery);
    }),
  })).filter((tier) => tier.countries.length > 0);

  const visibleCustomRows = customRows.filter((country) => {
    if (!normalizedQuery) return true;
    return country.code.toLowerCase().includes(normalizedQuery)
      || country.name.toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="md:col-span-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Country Price Overrides</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Default applies to all countries. Type a monthly price only where you want a country override; empty means default.
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Default now: {safeDefaultCurrency} {defaultPriceText}/month. Active overrides: {overrideCount}.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            label="Search Country"
            value={query}
            onChange={setQuery}
            placeholder="PK, Pakistan, Tier 1"
          />
        </div>
      </div>

      <div className="max-h-[680px] space-y-4 overflow-y-auto pr-1">
        {tierRows.map((tier) => (
          <div key={tier.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {tier.label}: {tier.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tier.description}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {tier.countries.length} countries
              </span>
            </div>

            <div className="space-y-2">
              {tier.countries.map((country) => (
                <CountryPriceRow
                  key={country.code}
                  country={{
                    ...country,
                    tierLabel: `${tier.label} - ${tier.title}`,
                    tierDescription: tier.description,
                  }}
                  row={overridesByCode[country.code]}
                  defaultCurrency={safeDefaultCurrency}
                  defaultMonthlyPrice={defaultPriceText}
                  yearlyFreeMonths={yearlyFreeMonths}
                  onUpdate={updateCountry}
                  onClear={clearCountry}
                />
              ))}
            </div>
          </div>
        ))}

        {visibleCustomRows.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Custom Countries</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Saved overrides outside the default country list.</p>
            </div>
            <div className="space-y-2">
              {visibleCustomRows.map((country) => (
                <CountryPriceRow
                  key={country.code}
                  country={country}
                  row={overridesByCode[country.code]}
                  defaultCurrency={safeDefaultCurrency}
                  defaultMonthlyPrice={defaultPriceText}
                  yearlyFreeMonths={yearlyFreeMonths}
                  onUpdate={updateCountry}
                  onClear={clearCountry}
                />
              ))}
            </div>
          </div>
        )}

        {tierRows.length === 0 && visibleCustomRows.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
            No country matched your search.
          </div>
        )}
      </div>
    </div>
  );
}

function CountryPriceRow({
  country,
  row,
  defaultCurrency,
  defaultMonthlyPrice,
  yearlyFreeMonths,
  onUpdate,
  onClear,
}) {
  const monthlyPrice = row?.monthly_price ?? '';
  const hasOverride = String(monthlyPrice).trim() !== '';
  const currency = row?.currency || defaultCurrency || 'USD';
  const yearlySource = hasOverride ? monthlyPrice : defaultMonthlyPrice;

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/70 md:grid-cols-[minmax(180px,1.1fr)_minmax(150px,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_120px_90px]">
      <div className="min-w-0">
        <span className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Country</span>
        <div className="mt-1 flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950">
          <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {country.code}
          </span>
          <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{country.name}</span>
        </div>
      </div>

      <div className="min-w-0">
        <span className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Paying Category</span>
        <div className="mt-1 flex min-h-10 items-center rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950">
          <span className="truncate text-sm text-gray-700 dark:text-gray-200" title={country.tierDescription}>
            {country.tierLabel}
          </span>
        </div>
      </div>

      <Input
        label="Monthly Override"
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={monthlyPrice}
        onChange={(value) => onUpdate(country, 'monthly_price', value)}
        placeholder={defaultMonthlyPrice}
        hint={hasOverride ? 'override' : 'default'}
      />

      <Input
        label="Yearly Price"
        value={calculateYearlyPrice(yearlySource, yearlyFreeMonths)}
        onChange={() => {}}
        disabled
        hint={hasOverride ? 'override auto' : 'default auto'}
      />

      <Input
        label="Currency"
        value={currency}
        onChange={(value) => onUpdate(country, 'currency', value)}
        placeholder={defaultCurrency}
        disabled={!hasOverride}
      />

      <button
        type="button"
        disabled={!hasOverride}
        onClick={() => onClear(country.code)}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {hasOverride ? 'Clear' : 'Default'}
      </button>
    </div>
  );
}
function PlanFeatures({ features, setFeatures }) {
  const addFeature = () => {
    setFeatures([
      ...features,
      { icon: 'star', text: '', sorting: features.length, is_active: true },
    ]);
  };

  const updateFeature = (index, key, value) => {
    setFeatures(features.map((feature, currentIndex) => (
      currentIndex === index ? { ...feature, [key]: value } : feature
    )));
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="md:col-span-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Plan Features</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">These features are linked to this plan.</p>
        </div>
        <button type="button" onClick={addFeature} className="px-3 py-2 rounded-lg bg-violet-100 text-violet-700 text-sm font-medium dark:bg-violet-500/15 dark:text-violet-300">
          Add Feature
        </button>
      </div>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={feature.id || index} className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)_100px_160px_44px] gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <IconSelect value={feature.icon || 'star'} onChange={(value) => updateFeature(index, 'icon', value)} />
            <Input label="Text" value={feature.text || ''} onChange={(value) => updateFeature(index, 'text', value)} />
            <Input label="Sort" type="number" value={feature.sorting ?? index} onChange={(value) => updateFeature(index, 'sorting', Number(value))} />
            <Toggle label="Status" checked={feature.is_active !== false} onChange={(value) => updateFeature(index, 'is_active', value)} />
            <button
              type="button"
              title="Remove feature"
              aria-label="Remove feature"
              onClick={() => removeFeature(index)}
              className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
        {features.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No features linked to this plan yet.
          </div>
        )}
      </div>
    </div>
  );
}

function IconSelect({ value, onChange }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Icon
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700"
      >
        {featureIconOptions.map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <span className="mt-2 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <FeatureIcon name={value} className="h-4 w-4" />
        Preview
      </span>
    </label>
  );
}
