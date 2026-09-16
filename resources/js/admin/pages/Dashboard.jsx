import { DataTable } from '../components/DataRows';
import { MetricCard } from '../components/MetricCard';
import { PageSkeleton } from '../components/Skeleton';
import { useConfirm } from '../components/ConfirmDialog';
import { request } from '../api';
import { formatDate } from '../utils';

export function Dashboard({ data, details, selectedEntry, navigate, onDeleteEntry }) {
  if (selectedEntry && !details) {
    return <PageSkeleton titleWidth="w-72" subtitleWidth="w-56" />;
  }

  if (!selectedEntry && !data) {
    return <PageSkeleton />;
  }

  const scopedStats = details ? entryStats(details) : null;
  const stats = scopedStats || data?.stats || {};
  const cards = details ? [
    ['Membership Plans', stats.membership_plans],
    ['Active Memberships', stats.memberships],
    ['Total Users', stats.users],
    ['Logged In Users', stats.logged_in_users],
    ['Guest Users', stats.guest_users],
    ['Active Now', stats.active_now],
    ['Active Today', stats.active_today],
    ['Active 7 Days', stats.active_7_days],
    ['Active 30 Days', stats.active_30_days],
    // ['Notifications', stats.notifications],
    // ['Features', stats.features],
    // ['FCM Settings', stats.notification_settings],
  ] : [
    ['Total Entries', stats.entries],
    ['Total Started Entries', stats.started_entries],
    // ['Apps', stats.apps],
    // ['Websites', stats.websites],
    ['Active Memberships', stats.memberships],
    ['Membership Plans', stats.membership_plans],
    ['Total Users', stats.users],
    ['Logged In Users', stats.logged_in_users],
    ['Guest Users', stats.guest_users],
    ['Active Now', stats.active_now],
    ['Active Today', stats.active_today],
    ['Active 7 Days', stats.active_7_days],
    ['Active 30 Days', stats.active_30_days],
  ];
  const recentUsers = details ? details.devices || [] : data?.recent_users || [];

  const { confirmDelete } = useConfirm();

  async function handleDelete() {
    const confirmed = await confirmDelete({ title: `Delete "${selectedEntry.title}"`, message: 'This will permanently delete the entry and all its data. This cannot be undone.' });
    if (!confirmed) return;
    await request(`/admin-api/entries/${selectedEntry.id}`, { method: 'DELETE' });
    onDeleteEntry?.();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
            {selectedEntry ? `${selectedEntry.title} Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedEntry ? selectedEntry.application_id : 'Entry, membership, and active user summary.'}
          </p>
        </div>
        {!selectedEntry && (
          <button type="button" onClick={() => navigate('entries')} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
            Manage Entries
          </button>
        )}
        {selectedEntry && onDeleteEntry && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300 text-sm font-medium"
          >
            Delete Entry
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map(([label, value]) => <MetricCard key={label} label={label} value={value ?? 0} />)}
      </div>
      <DataTable
        title="Recent Active Users"
        columns={['User', 'Device Details', 'Activity', 'Push Token']}
        rows={recentUsers.map((device) => [
          <UserCell device={device} entryTitle={selectedEntry?.title || device.domain?.title} />,
          <DeviceCell device={device} />,
          <ActivityCell device={device} />,
          <TokenCell token={device.fcm_token} />,
        ])}
      />
    </>
  );
}

function UserCell({ device, entryTitle }) {
  return (
    <div className="min-w-52">
      <div className="font-semibold text-gray-800 dark:text-gray-100">
        {device.email || 'Guest user'}
      </div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {entryTitle || '-'}
      </div>
    </div>
  );
}

function DeviceCell({ device }) {
  return (
    <div className="min-w-80">
      <div className="font-mono text-xs text-gray-800 dark:text-gray-100 break-all">
        {device.device_id || '-'}
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Record #{device.id}</span>
        <span>Created {formatDate(device.created_at)}</span>
      </div>
    </div>
  );
}

function ActivityCell({ device }) {
  return (
    <div className="min-w-44">
      <div className="font-semibold text-gray-800 dark:text-gray-100">
        {formatRelative(device.last_seen_at)}
      </div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {formatDate(device.last_seen_at)}
      </div>
      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${activeBadgeClass(device.last_seen_at)}`}>
        {activeLabel(device.last_seen_at)}
      </span>
    </div>
  );
}

function TokenCell({ token }) {
  const value = String(token || '').trim();
  const activityOnly = value.startsWith('activity:') || value.startsWith('token:');

  return (
    <div className="min-w-52">
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        value && !activityOnly
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
      }`}>
        {value && !activityOnly ? 'FCM saved' : 'Activity only'}
      </span>
      <div className="mt-2 font-mono text-xs text-gray-500 dark:text-gray-400 break-all">
        {shortToken(value)}
      </div>
    </div>
  );
}

function entryStats(details) {
  const devices = details.devices || [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  return {
    membership_plans: (details.plans || []).filter((plan) => plan.is_active).length,
    memberships: (details.memberships || []).filter((membership) => {
      return membership.is_active && (!membership.expires_at || new Date(membership.expires_at) > now);
    }).length,
    users: devices.length,
    logged_in_users: new Set(devices.filter((device) => device.email).map((device) => device.email)).size,
    guest_users: devices.filter((device) => !device.email).length,
    active_now: countSince(devices, 30, now),
    active_today: devices.filter((device) => String(device.last_seen_at || '').slice(0, 10) === today).length,
    active_7_days: countSince(devices, 60 * 24 * 7, now),
    active_30_days: countSince(devices, 60 * 24 * 30, now),
    notifications: (details.notifications || []).length,
    features: (details.features || []).filter((feature) => feature.is_active).length,
    notification_settings: (details.notification_settings || []).length,
  };
}

function activeLabel(value) {
  const minutes = minutesSince(value);
  if (minutes == null) return 'Never seen';
  if (minutes <= 30) return 'Active now';
  if (minutes <= 60 * 24) return 'Today';
  if (minutes <= 60 * 24 * 7) return 'Last 7 days';
  return 'Older';
}

function activeBadgeClass(value) {
  const minutes = minutesSince(value);
  if (minutes == null) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  if (minutes <= 30) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (minutes <= 60 * 24) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

function formatRelative(value) {
  const minutes = minutesSince(value);
  if (minutes == null) return 'Never';
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function minutesSince(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / 60000));
}

function shortToken(value) {
  if (!value) return '-';
  if (value.startsWith('activity:')) return 'Saved from app activity ping';
  if (value.startsWith('token:')) return 'Saved from token ping';
  if (value.length <= 28) return value;
  return `${value.slice(0, 16)}...${value.slice(-8)}`;
}

function countSince(devices, minutes, now) {
  const since = now.getTime() - minutes * 60 * 1000;
  return devices.filter((device) => {
    if (!device.last_seen_at) return false;
    return new Date(device.last_seen_at).getTime() >= since;
  }).length;
}
