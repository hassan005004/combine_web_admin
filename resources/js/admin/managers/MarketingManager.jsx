import { useCallback, useEffect, useMemo, useState } from 'react';
import { request } from '../api';
import { Input, Select, Textarea } from '../components/FormControls';
import { ActionGroup, DataRows, DeleteButton, EditButton } from '../components/DataRows';

const TABS = [
  ['overview', 'Overview'],
  ['campaigns', 'Campaigns'],
  ['revenue', 'Revenue'],
  ['expenses', 'Expenses'],
];

const CAMPAIGN_TYPE_OPTS = [
  ['facebook', 'Facebook Ads'],
  ['google', 'Google Ads'],
  ['tiktok', 'TikTok Ads'],
  ['instagram', 'Instagram Ads'],
  ['push', 'Push'],
  ['email', 'Email'],
  ['sms', 'SMS'],
  ['other', 'Other'],
];

const CAMPAIGN_STATUS_OPTS = [
  ['draft', 'Draft'],
  ['scheduled', 'Scheduled'],
  ['sent', 'Sent'],
  ['cancelled', 'Cancelled'],
];

const REVENUE_SOURCE_OPTS = [
  ['google_ads', 'Google Ads Withdrawal'],
  ['subscription', 'Subscription Earning'],
  ['membership', 'Membership Manual Entry'],
  ['ads', 'Other Ads'],
  ['campaign', 'Campaign'],
  ['affiliate', 'Affiliate'],
  ['other', 'Other'],
];

const EXPENSE_CATEGORY_OPTS = [
  ['advertising', 'Advertising'],
  ['creative', 'Creative'],
  ['tools', 'Tools'],
  ['agency', 'Agency'],
  ['other', 'Other'],
];

export function MarketingManager({ entry, setHeaderAction }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setData(await request(`/admin-api/entries/${entry.id}/marketing`));
  }, [entry.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setHeaderAction(null); }, [tab, setHeaderAction]);

  if (!data) return <div className="p-5 text-sm text-gray-400">Loading marketing data...</div>;

  return (
    <div>
      <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === key ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab summary={data.finance_summary} campaigns={data.campaigns || []} revenue={data.revenue || []} expenses={data.expenses || []} allocations={data.allocations || []} />}
      {tab === 'campaigns' && <CampaignsTab entry={entry} items={data.campaigns || []} reload={load} setHeaderAction={setHeaderAction} />}
      {tab === 'revenue' && <RevenueTab entry={entry} items={data.revenue || []} summary={data.revenue_summary} allocationUsers={data.allocation_users || []} allocations={data.allocations || []} reload={load} setHeaderAction={setHeaderAction} />}
      {tab === 'expenses' && <ExpensesTab entry={entry} campaigns={data.campaigns || []} items={data.expenses || []} allocationUsers={data.allocation_users || []} allocations={data.allocations || []} reload={load} setHeaderAction={setHeaderAction} />}
    </div>
  );
}

function OverviewTab({ summary = {}, campaigns, revenue, expenses, allocations }) {
  const topCampaigns = useMemo(() => {
    return [...campaigns]
      .map((campaign) => ({
        ...campaign,
        net: Number(campaign.earned_amount || 0) - Number(campaign.spent_amount || 0),
      }))
      .sort((a, b) => b.net - a.net)
      .slice(0, 5);
  }, [campaigns]);

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Total Revenue" value={money(summary.total_revenue)} tone="good" />
        <SummaryCard label="Total Expense" value={money(summary.total_expenses)} tone="bad" />
        <SummaryCard label="Final Earning" value={money(summary.net_earning)} tone={Number(summary.net_earning || 0) >= 0 ? 'good' : 'bad'} />
        <SummaryCard label="Campaign Profit" value={money(Number(summary.campaign_revenue || 0) - Number(summary.campaign_spend || 0))} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel title="Breakdown">
          <SummaryLine label="Manual revenue" value={money(summary.manual_revenue)} />
          <SummaryLine label="Campaign revenue" value={money(summary.campaign_revenue)} />
          <SummaryLine label="Campaign ad spend" value={money(summary.campaign_spend)} negative />
          <SummaryLine label="Other expenses" value={money(summary.other_expenses)} negative />
        </Panel>

        <Panel title="Quick Counts">
          <SummaryLine label="Campaigns" value={campaigns.length} />
          <SummaryLine label="Revenue entries" value={revenue.length} />
          <SummaryLine label="Expense entries" value={expenses.length} />
        </Panel>
      </div>

      <Panel title="Top Campaigns">
        {topCampaigns.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No campaign data yet.</p>
        ) : (
          <div className="space-y-3">
            {topCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">{campaign.name}</div>
                  <div className="text-xs text-gray-500">{campaign.type} / spent {money(campaign.spent_amount)} / earned {money(campaign.earned_amount)}</div>
                </div>
                <div className={`text-sm font-semibold ${campaign.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{money(campaign.net)}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Staff allocation breakdown">
        <AllocationBreakdown allocations={allocations} />
      </Panel>
    </div>
  );
}

function CampaignsTab({ entry, items, reload, setHeaderAction }) {
  const [form, setForm] = useState(null);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setHeaderAction(null);
    return () => setHeaderAction(null);
  }, [setHeaderAction]);

  async function submit(event) {
    event.preventDefault();
    const url = form.id ? `/admin-api/entries/${entry.id}/campaigns/${form.id}` : `/admin-api/entries/${entry.id}/campaigns`;
    await request(url, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) });
    setForm(null);
    await reload();
  }

  if (form) {
    return (
      <div className="p-5">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">{form.id ? 'Edit Campaign' : 'Add Campaign'}</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Campaign Name" value={form.name} onChange={(value) => update('name', value)} required />
          <Select label="Campaign Type" value={form.type} onChange={(value) => update('type', value)} options={CAMPAIGN_TYPE_OPTS} />
          <Input label="Platform" value={form.platform || ''} onChange={(value) => update('platform', value)} />
          <Input label="Campaign Objective" value={form.objective || ''} onChange={(value) => update('objective', value)} />
          <Input label="Planned Budget" type="number" value={form.budget_amount || 0} onChange={(value) => update('budget_amount', value)} />
          <Input label="Amount Spent" type="number" value={form.spent_amount || 0} onChange={(value) => update('spent_amount', value)} />
          <Input label="Amount Earned" type="number" value={form.earned_amount || 0} onChange={(value) => update('earned_amount', value)} />
          <Select label="Status" value={form.status || 'draft'} onChange={(value) => update('status', value)} options={CAMPAIGN_STATUS_OPTS} />
          <Input label="Schedule At" type="datetime-local" value={dateTimeValue(form.scheduled_at)} onChange={(value) => update('scheduled_at', value)} />
          <Input label="Subject / Title" value={form.subject || ''} onChange={(value) => update('subject', value)} />
          <div className="md:col-span-3">
            <Textarea label="Campaign Detail" value={form.body || ''} onChange={(value) => update('body', value)} />
          </div>
          <FormActions isEdit={!!form.id} onCancel={() => setForm(null)} />
        </form>
      </div>
    );
  }

  return (
    <>
      <TabActionBar
        title="Campaigns"
        description="Create and track marketing campaigns for this app."
        actionLabel="Add Campaign"
        onAction={() => setForm(blankCampaign())}
      />
      <DataRows
        items={items}
        columns={['name', 'type', 'platform', 'objective', 'spent_amount', 'earned_amount', 'status']}
        actions={(item) => (
          <ActionGroup>
            <EditButton label="Edit campaign" onClick={() => setForm({ ...blankCampaign(), ...item })} />
            <DeleteButton url={`/admin-api/entries/${entry.id}/campaigns/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}

function RevenueTab({ entry, items, summary, allocationUsers, allocations, reload, setHeaderAction }) {
  const [form, setForm] = useState(null);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setHeaderAction(null);
    return () => setHeaderAction(null);
  }, [setHeaderAction]);

  async function submit(event) {
    event.preventDefault();
    const url = form.id ? `/admin-api/entries/${entry.id}/revenue/${form.id}` : `/admin-api/entries/${entry.id}/revenue`;
    await request(url, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) });
    setForm(null);
    await reload();
  }

  if (form) {
    return (
      <div className="p-5 max-w-2xl">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">{form.id ? 'Edit Revenue' : 'Add Manual Revenue'}</h2>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Source" value={form.source} onChange={(value) => update('source', value)} options={REVENUE_SOURCE_OPTS} />
          <Input label="Withdraw / Received Amount" type="number" value={form.amount} onChange={(value) => update('amount', value)} required />
          <Input label="Currency" value={form.currency || 'PKR'} onChange={(value) => update('currency', value)} />
          <Input label="Date" type="date" value={dateValue(form.date)} onChange={(value) => update('date', value)} required />
          <Input label="Detail / Notes" value={form.description || ''} onChange={(value) => update('description', value)} />
          <AllocationEditor
            users={allocationUsers}
            total={form.amount}
            allocations={form.allocations || []}
            onChange={(value) => update('allocations', value)}
          />
          <FormActions isEdit={!!form.id} onCancel={() => setForm(null)} />
        </form>
      </div>
    );
  }

  return (
    <>
      <TabActionBar
        title="Revenue"
        description="Add withdrawals, subscriptions, memberships, affiliate income, and other earnings."
        actionLabel="Add Revenue"
        onAction={() => setForm(blankRevenue())}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100 p-5 dark:border-gray-700">
        <SummaryCard label="Manual Revenue" value={money(summary?.total)} tone="good" />
        {Object.entries(summary?.by_source || {}).map(([source, amount]) => (
          <SummaryCard key={source} label={source} value={money(amount)} />
        ))}
      </div>
      <DataRows
        items={items}
        columns={['date', 'source', 'amount', 'currency', 'description']}
        renderers={{ source: (item) => sourceLabel(item.source) }}
        actions={(item) => (
          <ActionGroup>
            <EditButton label="Edit revenue" onClick={() => setForm({ ...item, date: dateValue(item.date), allocations: allocationsFor(allocations, 'revenue', item.id) })} />
            <DeleteButton url={`/admin-api/entries/${entry.id}/revenue/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}

function ExpensesTab({ entry, campaigns, items, allocationUsers, allocations, reload, setHeaderAction }) {
  const [form, setForm] = useState(null);
  const campaignOptions = [['', 'No campaign'], ...campaigns.map((campaign) => [String(campaign.id), campaign.name])];
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setHeaderAction(null);
    return () => setHeaderAction(null);
  }, [setHeaderAction]);

  async function submit(event) {
    event.preventDefault();
    const payload = { ...form, campaign_id: form.campaign_id || null };
    const url = form.id ? `/admin-api/entries/${entry.id}/expenses/${form.id}` : `/admin-api/entries/${entry.id}/expenses`;
    await request(url, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    setForm(null);
    await reload();
  }

  if (form) {
    return (
      <div className="p-5 max-w-2xl">
        <h2 className="mb-5 font-semibold text-gray-800 dark:text-gray-100">{form.id ? 'Edit Expense' : 'Add Expense'}</h2>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Category" value={form.category} onChange={(value) => update('category', value)} options={EXPENSE_CATEGORY_OPTS} />
          <Select label="Linked Campaign" value={String(form.campaign_id || '')} onChange={(value) => update('campaign_id', value)} options={campaignOptions} />
          <Input label="Amount Spent" type="number" value={form.amount} onChange={(value) => update('amount', value)} required />
          <Input label="Currency" value={form.currency || 'PKR'} onChange={(value) => update('currency', value)} />
          <Input label="Date" type="date" value={dateValue(form.date)} onChange={(value) => update('date', value)} required />
          <Input label="Description" value={form.description || ''} onChange={(value) => update('description', value)} />
          <AllocationEditor
            users={allocationUsers}
            total={form.amount}
            allocations={form.allocations || []}
            onChange={(value) => update('allocations', value)}
          />
          <FormActions isEdit={!!form.id} onCancel={() => setForm(null)} />
        </form>
      </div>
    );
  }

  return (
    <>
      <TabActionBar
        title="Expenses"
        description="Record ad spend, tools, creative work, agency fees, and other costs."
        actionLabel="Add Expense"
        onAction={() => setForm(blankExpense())}
      />
      <DataRows
        items={items}
        columns={['date', 'category', 'amount', 'currency', 'description']}
        actions={(item) => (
          <ActionGroup>
            <EditButton label="Edit expense" onClick={() => setForm({ ...item, campaign_id: item.campaign_id || '', date: dateValue(item.date), allocations: allocationsFor(allocations, 'expense', item.id) })} />
            <DeleteButton url={`/admin-api/entries/${entry.id}/expenses/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}

function AllocationEditor({ users, total, allocations, onChange }) {
  const totalAmount = Number(total || 0);

  useEffect(() => {
    const next = allocations.map((row) => {
      if (row.mode !== 'percentage' || row.percentage === '' || row.percentage == null) return row;
      const amount = (totalAmount * Number(row.percentage) / 100).toFixed(2);
      return String(row.amount ?? '') === amount ? row : { ...row, amount };
    });

    if (next.some((row, index) => row !== allocations[index])) {
      onChange(next);
    }
  }, [totalAmount]);

  function addUser() {
    const selected = new Set(allocations.map((item) => Number(item.user_id)));
    const nextUser = users.find((user) => !selected.has(Number(user.id)));
    if (!nextUser) return;

    onChange([
      ...allocations,
      { user_id: nextUser.id, mode: 'percentage', percentage: '', amount: '', notes: '' },
    ]);
  }

  function updateRow(index, key, value) {
    onChange(allocations.map((row, rowIndex) => {
      if (rowIndex !== index) return row;

      if (key === 'percentage' && row.mode === 'percentage') {
        const percentage = value === '' ? '' : Number(value);
        return { ...row, percentage: value, amount: value === '' ? '' : (totalAmount * percentage / 100).toFixed(2) };
      }

      if (key === 'amount') {
        return { ...row, mode: 'fixed', percentage: '', amount: value };
      }

      if (key === 'mode') {
        const percentage = row.percentage === '' ? '' : Number(row.percentage);
        return {
          ...row,
          mode: value,
          amount: value === 'percentage' && percentage !== '' ? (totalAmount * percentage / 100).toFixed(2) : (value === 'fixed' ? row.amount : ''),
        };
      }

      return { ...row, [key]: value };
    }));
  }

  function removeRow(index) {
    onChange(allocations.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="md:col-span-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Allocate to staff users</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Percentage calculates automatically from the total. Editing the amount converts that row to a fixed amount.
          </p>
        </div>
        <button
          type="button"
          onClick={addUser}
          disabled={users.length === allocations.length}
          className="rounded-lg bg-violet-100 px-3 py-2 text-sm font-medium text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add user
        </button>
      </div>

      {users.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">No staff users are assigned to this entry yet.</p>
      )}

      <div className="mt-4 space-y-3">
        {allocations.map((row, index) => (
          <div key={`${row.user_id}-${index}`} className="grid grid-cols-1 gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800 md:grid-cols-12 md:items-end">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-3">
              User
              <select
                value={row.user_id}
                onChange={(event) => updateRow(index, 'user_id', Number(event.target.value))}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              >
                {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
              Type
              <select
                value={row.mode || 'percentage'}
                onChange={(event) => updateRow(index, 'mode', event.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
              Percentage
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                disabled={row.mode === 'fixed'}
                value={row.percentage ?? ''}
                onChange={(event) => updateRow(index, 'percentage', event.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.amount ?? ''}
                onChange={(event) => updateRow(index, 'amount', event.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
              Note
              <input
                type="text"
                value={row.notes || ''}
                onChange={(event) => updateRow(index, 'notes', event.target.value)}
                placeholder="Optional"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <button type="button" onClick={() => removeRow(index)} className="rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 md:col-span-1">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function allocationsFor(allocations, type, sourceId) {
  return allocations
    .filter((item) => item.allocation_type === type && Number(item.source_id) === Number(sourceId))
    .map((item) => ({
      user_id: item.user_id,
      mode: item.mode || 'percentage',
      percentage: item.percentage ?? '',
      amount: item.amount ?? '',
      notes: item.notes || '',
    }));
}

function AllocationBreakdown({ allocations = [] }) {
  const rows = useMemo(() => {
    const grouped = new Map();
    allocations.forEach((item) => {
      const key = `${item.allocation_type}:${item.user_id}`;
      const current = grouped.get(key) || { type: item.allocation_type, user: item.user?.name || 'User', amount: 0 };
      current.amount += Number(item.amount || 0);
      grouped.set(key, current);
    });
    return [...grouped.values()];
  }, [allocations]);

  if (rows.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">No allocations saved yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {rows.map((row) => (
        <div key={`${row.type}-${row.user}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
          <span className="text-sm text-gray-600 dark:text-gray-300">{row.user} · {row.type}</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{money(row.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function TabActionBar({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function SummaryCard({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-gray-800 dark:text-gray-100',
    good: 'text-green-700 dark:text-green-300',
    bad: 'text-red-700 dark:text-red-300',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
      <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  );
}

function SummaryLine({ label, value, negative = false }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0 dark:border-gray-700">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${negative ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>{value}</span>
    </div>
  );
}

function FormActions({ onCancel, isEdit }) {
  return (
    <div className="md:col-span-3 flex gap-2 pt-1">
      <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white">{isEdit ? 'Update' : 'Save'}</button>
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">Cancel</button>
    </div>
  );
}

function blankCampaign() {
  return {
    name: '',
    type: 'facebook',
    platform: '',
    objective: '',
    budget_amount: 0,
    spent_amount: 0,
    earned_amount: 0,
    status: 'draft',
    subject: '',
    body: '',
    scheduled_at: '',
  };
}

function blankRevenue() {
  return {
    source: 'google_ads',
    amount: '',
    currency: 'PKR',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    allocations: [],
  };
}

function blankExpense() {
  return {
    campaign_id: '',
    category: 'advertising',
    amount: '',
    currency: 'PKR',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    allocations: [],
  };
}

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function sourceLabel(value) {
  return REVENUE_SOURCE_OPTS.find(([key]) => key === value)?.[1] || value;
}

function dateValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

function dateTimeValue(value) {
  return value ? String(value).replace(' ', 'T').slice(0, 16) : '';
}
