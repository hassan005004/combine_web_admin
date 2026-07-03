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

      {tab === 'overview' && <OverviewTab summary={data.finance_summary} campaigns={data.campaigns || []} revenue={data.revenue || []} expenses={data.expenses || []} />}
      {tab === 'campaigns' && <CampaignsTab entry={entry} items={data.campaigns || []} reload={load} setHeaderAction={setHeaderAction} />}
      {tab === 'revenue' && <RevenueTab entry={entry} items={data.revenue || []} summary={data.revenue_summary} reload={load} setHeaderAction={setHeaderAction} />}
      {tab === 'expenses' && <ExpensesTab entry={entry} campaigns={data.campaigns || []} items={data.expenses || []} reload={load} setHeaderAction={setHeaderAction} />}
    </div>
  );
}

function OverviewTab({ summary = {}, campaigns, revenue, expenses }) {
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
    </div>
  );
}

function CampaignsTab({ entry, items, reload, setHeaderAction }) {
  const [form, setForm] = useState(null);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setHeaderAction(form === null ? (
      <button
        type="button"
        onClick={() => setForm(blankCampaign())}
        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium"
      >
        Add Campaign
      </button>
    ) : null);
    return () => setHeaderAction(null);
  }, [form, setHeaderAction]);

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
  );
}

function RevenueTab({ entry, items, summary, reload, setHeaderAction }) {
  const [form, setForm] = useState(null);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setHeaderAction(form === null ? (
      <button type="button" onClick={() => setForm(blankRevenue())} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
        Add Revenue
      </button>
    ) : null);
    return () => setHeaderAction(null);
  }, [form, setHeaderAction]);

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
          <Input label="Currency" value={form.currency || 'USD'} onChange={(value) => update('currency', value)} />
          <Input label="Date" type="date" value={dateValue(form.date)} onChange={(value) => update('date', value)} required />
          <Input label="Detail / Notes" value={form.description || ''} onChange={(value) => update('description', value)} />
          <FormActions isEdit={!!form.id} onCancel={() => setForm(null)} />
        </form>
      </div>
    );
  }

  return (
    <>
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
            <EditButton label="Edit revenue" onClick={() => setForm({ ...item, date: dateValue(item.date) })} />
            <DeleteButton url={`/admin-api/entries/${entry.id}/revenue/${item.id}`} reload={reload} />
          </ActionGroup>
        )}
      />
    </>
  );
}

function ExpensesTab({ entry, campaigns, items, reload, setHeaderAction }) {
  const [form, setForm] = useState(null);
  const campaignOptions = [['', 'No campaign'], ...campaigns.map((campaign) => [String(campaign.id), campaign.name])];
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setHeaderAction(form === null ? (
      <button type="button" onClick={() => setForm(blankExpense())} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
        Add Expense
      </button>
    ) : null);
    return () => setHeaderAction(null);
  }, [form, setHeaderAction]);

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
          <Input label="Currency" value={form.currency || 'USD'} onChange={(value) => update('currency', value)} />
          <Input label="Date" type="date" value={dateValue(form.date)} onChange={(value) => update('date', value)} required />
          <Input label="Description" value={form.description || ''} onChange={(value) => update('description', value)} />
          <FormActions isEdit={!!form.id} onCancel={() => setForm(null)} />
        </form>
      </div>
    );
  }

  return (
    <DataRows
      items={items}
      columns={['date', 'category', 'amount', 'currency', 'description']}
      actions={(item) => (
        <ActionGroup>
          <EditButton label="Edit expense" onClick={() => setForm({ ...item, campaign_id: item.campaign_id || '', date: dateValue(item.date) })} />
          <DeleteButton url={`/admin-api/entries/${entry.id}/expenses/${item.id}`} reload={reload} />
        </ActionGroup>
      )}
    />
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
    currency: 'USD',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  };
}

function blankExpense() {
  return {
    campaign_id: '',
    category: 'advertising',
    amount: '',
    currency: 'USD',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  };
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
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
