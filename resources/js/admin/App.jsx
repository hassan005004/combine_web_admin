import { useEffect, useMemo, useState } from 'react';
import { request } from './api';
import { Header } from './components/Header';
import { ConfirmProvider } from './components/ConfirmDialog';
import { Sidebar } from './components/Sidebar';
import { EntryScreenSkeleton, PageSkeleton } from './components/Skeleton';
import { ToastProvider } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Entries } from './pages/Entries';
import { EntryDetails } from './pages/EntryDetails';
import { EntryFormScreen } from './pages/EntryFormScreen';
import { PasswordSettings } from './pages/PasswordSettings';
import { ProfileSettings } from './pages/ProfileSettings';
import { RolesPage } from './pages/RolesPage';
import { Settings } from './pages/Settings';
import { StaffUsersPage } from './pages/StaffUsersPage';
import { blankEntry } from './utils';

const tabSlugByKey = {
  plans:          'plans',
  memberships:    'memberships',
  notifications:  'notifications',
  fcm:            'fcm-settings',
  smtp:           'smtp-settings',
  admob:          'admob',
  billing:        'billing',
  users:          'active-users',
  pages:          'pages',
  files:          'files',
  notes:          'notes',
  faqs:           'faqs',
  engagement:     'feedback-features',
  feedback:       'feedback',
  features:       'feature-requests',
  marketing:      'marketing',
  'app-version':  'app-version',
};

const tabKeyBySlug = Object.fromEntries(Object.entries(tabSlugByKey).map(([key, slug]) => [slug, key]));

function formFromEntry(entry) {
  const serverAds = entry.ads_settings || {};
  const ads = {
    bottom:      { enabled: false, unit_id: '', frequency: 0, ...(serverAds.bottom      || {}) },
    app_open:    { enabled: false, unit_id: '', frequency: 0, ...(serverAds.app_open    || {}) },
    full_screen: { enabled: false, unit_id: '', frequency: 5, ...(serverAds.full_screen || {}) },
    rewarded:    { enabled: false, unit_id: '', frequency: 0, ...(serverAds.rewarded    || {}) },
    native:      { enabled: false, unit_id: '', frequency: 3, ...(serverAds.native      || {}) },
    adsense:     { enabled: false, client_id: '', slot_id: '', format: 'auto', ...(serverAds.adsense || {}) },
  };
  const serverBilling = entry.billing_settings || {};
  const serviceAccountJson = serverBilling.google_play?.service_account_json;
  const billing = {
    ...blankEntry.billing,
    ...serverBilling,
    google_play: {
      ...blankEntry.billing.google_play,
      ...(serverBilling.google_play || {}),
      service_account_json: typeof serviceAccountJson === 'string'
        ? serviceAccountJson
        : serviceAccountJson
          ? JSON.stringify(serviceAccountJson, null, 2)
          : '',
    },
  };

  return {
    ...blankEntry,
    ...entry,
    social_links: { ...blankEntry.social_links, ...(entry.social_links || {}) },
    ads,
    billing,
  };
}

function routeFromPath(pathname = window.location.pathname) {
  const editMatch = pathname.match(/^\/domains\/(\d+)\/edit$/);
  if (editMatch) {
    const id = Number(editMatch[1]);
    return { page: 'entry-form', selectedEntryId: id, detailTab: 'plans', editingEntryId: id };
  }

  if (pathname === '/domains/create') {
    return { page: 'entry-form', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  const moduleCreateMatch = pathname.match(/^\/domains\/(\d+)\/([^/]+)\/create$/);
  if (moduleCreateMatch) {
    const selectedEntryId = Number(moduleCreateMatch[1]);
    const screen = moduleCreateMatch[2];
    return {
      page: 'manage',
      selectedEntryId,
      detailTab: tabKeyBySlug[screen] || 'plans',
      editingEntryId: null,
      moduleAction: 'create',
      moduleItemId: null,
    };
  }

  const moduleEditMatch = pathname.match(/^\/domains\/(\d+)\/([^/]+)\/([^/]+)\/edit$/);
  if (moduleEditMatch) {
    const selectedEntryId = Number(moduleEditMatch[1]);
    const screen = moduleEditMatch[2];
    return {
      page: 'manage',
      selectedEntryId,
      detailTab: tabKeyBySlug[screen] || 'plans',
      editingEntryId: null,
      moduleAction: 'edit',
      moduleItemId: moduleEditMatch[3],
    };
  }

  const modulePromoMatch = pathname.match(/^\/domains\/(\d+)\/([^/]+)\/([^/]+)\/promo$/);
  if (modulePromoMatch) {
    const selectedEntryId = Number(modulePromoMatch[1]);
    const screen = modulePromoMatch[2];
    return {
      page: 'manage',
      selectedEntryId,
      detailTab: tabKeyBySlug[screen] || 'plans',
      editingEntryId: null,
      moduleAction: 'promo',
      moduleItemId: modulePromoMatch[3],
    };
  }

  const selectedMatch = pathname.match(/^\/domains\/(\d+)(?:\/([^/]+))?$/);
  if (selectedMatch) {
    const selectedEntryId = Number(selectedMatch[1]);
    const screen = selectedMatch[2] || 'dashboard';
    return {
      page: screen === 'dashboard' ? 'dashboard' : 'manage',
      selectedEntryId,
      detailTab: tabKeyBySlug[screen] || 'plans',
      editingEntryId: null,
      moduleAction: null,
      moduleItemId: null,
    };
  }

  if (pathname === '/domains') {
    return { page: 'entries', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  if (pathname === '/settings') {
    return { page: 'settings', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  if (pathname === '/account/profile') {
    return { page: 'profile', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  if (pathname === '/account/password') {
    return { page: 'password', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  if (pathname === '/roles') {
    return { page: 'roles', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  if (pathname === '/staff-users') {
    return { page: 'staff-users', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  return { page: 'dashboard', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
}

export function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminApp />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function AdminApp() {
  const initialRoute = routeFromPath();
  const [page, setPage] = useState(initialRoute.page);
  const [dashboard, setDashboard] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(initialRoute.selectedEntryId);
  const [details, setDetails] = useState(null);
  const [detailTab, setDetailTab] = useState(initialRoute.detailTab || 'plans');
  const [moduleAction, setModuleAction] = useState(initialRoute.moduleAction || null);
  const [moduleItemId, setModuleItemId] = useState(initialRoute.moduleItemId || null);
  const [entryForm, setEntryForm] = useState(blankEntry);
  const [editingEntryId, setEditingEntryId] = useState(initialRoute.editingEntryId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) || details?.entry || null,
    [entries, selectedEntryId, details],
  );
  const selectedMode = Boolean(selectedEntryId);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (selectedEntryId) loadDetails(selectedEntryId);
  }, [selectedEntryId]);

  useEffect(() => {
    function handlePopState() {
      applyRoute(routeFromPath(), false);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (page !== 'entry-form' || !editingEntryId || entries.length === 0) return;
    const entry = entries.find((item) => item.id === editingEntryId);
    if (entry) {
      // Map ads_settings (server field) → ads (form field)
      setEntryForm(formFromEntry(entry));
    }
  }, [entries, editingEntryId, page]);

  function applyRoute(route, push = true, url = null) {
    setDetails((current) => {
      if (!route.selectedEntryId) return null;
      // Keep existing details if same entry — don't wipe on entry-form navigation
      return current?.entry?.id === route.selectedEntryId ? current : null;
    });

    setPage(route.page);
    setSelectedEntryId(route.selectedEntryId);
    setDetailTab(route.detailTab || 'plans');
    setModuleAction(route.moduleAction || null);
    setModuleItemId(route.moduleItemId || null);
    setEditingEntryId(route.editingEntryId);

    if (route.page === 'entry-form' && !route.editingEntryId) {
      setEntryForm(blankEntry);
    }

    if (push && url) {
      window.history.pushState({}, '', url);
    }
  }

  function selectedUrl(entryId, next, tab = detailTab) {
    if (next === 'dashboard') {
      return `/domains/${entryId}/dashboard`;
    }

    return `/domains/${entryId}/${tabSlugByKey[tab] || tabSlugByKey.plans}`;
  }

  function moduleUrl(entryId, tab, action = null, itemId = null) {
    const base = selectedUrl(entryId, 'manage', tab);
    if (action === 'create') return `${base}/create`;
    if (action === 'edit' && itemId) return `${base}/${itemId}/edit`;
    if (action === 'promo' && itemId) return `${base}/${itemId}/promo`;
    return base;
  }

  async function refresh() {
    setError('');
    const [dashboardData, entriesData] = await Promise.all([
      request('/admin-api/dashboard'),
      request('/admin-api/entries'),
    ]);
    setDashboard(dashboardData);
    setEntries(entriesData.entries || []);
  }

  async function loadDetails(id) {
    setError('');
    setDetails(await request(`/admin-api/entries/${id}`));
  }

  function navigate(next) {
    const urls = {
      dashboard: '/dashboard',
      profile: '/account/profile',
      password: '/account/password',
      settings: '/settings',
      roles: '/roles',
      'staff-users': '/staff-users',
      entries: '/domains',
    };
    applyRoute(
      { page: next, selectedEntryId: null, detailTab: 'plans', editingEntryId: null },
      true,
      urls[next] || '/domains',
    );
  }

  function addEntry() {
    applyRoute({ page: 'entry-form', selectedEntryId: null, detailTab: 'plans', editingEntryId: null }, true, '/domains/create');
  }

  function openEntryTab(entryId, tab) {
    applyRoute({ page: 'manage', selectedEntryId: entryId, detailTab: tab, editingEntryId: null, moduleAction: null, moduleItemId: null }, true, selectedUrl(entryId, 'manage', tab));
  }

  function viewEntry(entryId) {
    applyRoute({ page: 'dashboard', selectedEntryId: entryId, detailTab: 'plans', editingEntryId: null }, true, selectedUrl(entryId, 'dashboard'));
  }

  function changeSelectedEntry(entryId) {
    if (!entryId) {
      leaveSelectedEntry();
      return;
    }
    const nextId = Number(entryId);
    applyRoute({ page: 'dashboard', selectedEntryId: nextId, detailTab: 'plans', editingEntryId: null }, true, selectedUrl(nextId, 'dashboard'));
  }

  function leaveSelectedEntry() {
    applyRoute({ page: 'dashboard', selectedEntryId: null, detailTab: 'plans', editingEntryId: null }, true, '/dashboard');
  }

  function navigateSelected(next, tab = detailTab) {
    if (!selectedEntryId) return;
    applyRoute(
      { page: next, selectedEntryId, detailTab: next === 'manage' ? tab : detailTab, editingEntryId: null },
      true,
      selectedUrl(selectedEntryId, next, tab),
    );
  }

  function navigateModule(action = null, itemId = null, tab = detailTab) {
    if (!selectedEntryId) return;
    applyRoute(
      { page: 'manage', selectedEntryId, detailTab: tab, editingEntryId: null, moduleAction: action, moduleItemId: itemId },
      true,
      moduleUrl(selectedEntryId, tab, action, itemId),
    );
  }

  async function reorderEntries(ids) {
    await request('/admin-api/entries/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    await refresh();
  }

  async function saveEntry(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const method = 'POST';
      const url    = editingEntryId ? `/admin-api/entries/${editingEntryId}` : '/admin-api/entries';
      const response = await request(url, { method, body: entryFormPayload(entryForm, editingEntryId) });
      const savedEntry = response.entry || null;
      const savedId = editingEntryId;
      await refresh(); // refresh entries list so sidebar select is up-to-date
      if (savedId) {
        await loadDetails(savedId); // reload details so latest values are live
        if (savedEntry) setEntryForm(formFromEntry(savedEntry));
        setEditingEntryId(savedId);
        applyRoute(
          { page: 'entry-form', selectedEntryId: savedId, detailTab, editingEntryId: savedId },
          true,
          `/domains/${savedId}/edit`,
        );
      } else {
        const nextId = savedEntry?.id;
        setEntryForm(nextId ? formFromEntry(savedEntry) : blankEntry);
        setEditingEntryId(nextId || null);
        applyRoute(
          nextId
            ? { page: 'entry-form', selectedEntryId: nextId, detailTab: 'plans', editingEntryId: nextId }
            : { page: 'entries', selectedEntryId: null, detailTab: 'plans', editingEntryId: null },
          true,
          nextId ? `/domains/${nextId}/edit` : '/domains',
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to save entry.');
      throw err; // re-throw so EntryFormScreen knows the save failed
    } finally {
      setBusy(false);
    }
  }

  function entryFormPayload(form, editingId) {
    const payload = new FormData();
    if (editingId) {
      payload.append('_method', 'PUT');
    }

    [
      'title',
      'entry_type',
      'status',
      'sort_order',
      'url',
      'google_play_url',
      'app_store_url',
      'application_id',
      'cache_ttl_hours',
      'seo_title',
      'seo_description',
      'seo_keywords',
      'privacy_policy',
      'terms_conditions',
      'support_policy',
      'delete_policy',
      'about_us',
      'app_version',
      'min_build_code',
    ].forEach((key) => payload.append(key, form[key] ?? ''));

    Object.entries(form.social_links || {}).forEach(([key, value]) => payload.append(`social_links[${key}]`, value || ''));

    (form.resources || []).forEach((resource) => payload.append('resources[]', resource));

    payload.append('show_in_apps_gallery', form.show_in_apps_gallery ? '1' : '0');
    payload.append('force_update', form.force_update ? '1' : '0');
    payload.append('remove_logo', form.remove_logo ? '1' : '0');

    if (form.logo instanceof File) {
      payload.append('logo', form.logo);
    }

    // AdMob settings — all 5 ad types
    const adTypes = ['bottom', 'app_open', 'full_screen', 'rewarded', 'native'];
    const ads = form.ads || {};
    adTypes.forEach((type) => {
      const adSetting = ads[type] || {};
      payload.append(`ads[${type}][enabled]`, adSetting.enabled ? '1' : '0');
      payload.append(`ads[${type}][unit_id]`, adSetting.unit_id || '');
      payload.append(`ads[${type}][frequency]`, String(adSetting.frequency ?? 0));
    });

    const adsense = ads.adsense || {};
    payload.append('ads[adsense][enabled]', adsense.enabled ? '1' : '0');
    payload.append('ads[adsense][client_id]', adsense.client_id || '');
    payload.append('ads[adsense][slot_id]', adsense.slot_id || '');
    payload.append('ads[adsense][format]', adsense.format || 'auto');

    const billing = form.billing || {};
    const googlePlay = billing.google_play || {};
    payload.append('billing[enabled]', billing.enabled ? '1' : '0');
    payload.append('billing[grace_days]', String(billing.grace_days ?? 3));
    payload.append('billing[google_play][enabled]', googlePlay.enabled ? '1' : '0');
    payload.append('billing[google_play][package_name]', googlePlay.package_name || form.application_id || '');
    payload.append('billing[google_play][service_account_json]', googlePlay.service_account_json || '');

    return payload;
  }

  function editEntry(entry) {
    setEntryForm(formFromEntry(entry));
    // Keep selectedEntryId so the entry sidebar stays visible
    applyRoute(
      { page: 'entry-form', selectedEntryId: entry.id, detailTab: detailTab, editingEntryId: entry.id },
      true,
      `/domains/${entry.id}/edit`,
    );
  }

  function cancelEntryForm() {
    if (editingEntryId) {
      // Return to the entry dashboard when cancelling an edit from within an entry
      applyRoute(
        { page: 'dashboard', selectedEntryId: editingEntryId, detailTab: 'plans', editingEntryId: null },
        true,
        `/domains/${editingEntryId}/dashboard`,
      );
    } else {
      applyRoute({ page: 'entries', selectedEntryId: null, detailTab: 'plans', editingEntryId: null }, true, '/domains');
    }
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        page={page}
        navigate={navigate}
        entries={entries}
        selectedEntry={selectedEntry}
        selectedEntryId={selectedEntryId}
        selectedMode={selectedMode}
        detailTab={detailTab}
        changeSelectedEntry={changeSelectedEntry}
        navigateSelected={navigateSelected}
        leaveSelectedEntry={leaveSelectedEntry}
        editEntry={editEntry}
      />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header />
        <main className="grow px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          {page === 'dashboard' && (!selectedEntryId || selectedEntry) && (
            <Dashboard
              data={dashboard}
              details={selectedMode ? details : null}
              selectedEntry={selectedEntry}
              navigate={selectedMode ? navigateSelected : navigate}
              onDeleteEntry={selectedMode ? async () => {
                await refresh();
                leaveSelectedEntry();
              } : null}
            />
          )}
          {page === 'dashboard' && selectedEntryId && !selectedEntry && (
            <PageSkeleton titleWidth="w-72" subtitleWidth="w-56" />
          )}
          {page === 'entries' && (
            <Entries
              entries={entries}
              addEntry={addEntry}
              viewEntry={viewEntry}
              reorderEntries={reorderEntries}
            />
          )}
          {page === 'entry-form' && (
            <EntryFormScreen
              form={entryForm}
              setForm={setEntryForm}
              editingId={editingEntryId}
              cancelEdit={cancelEntryForm}
              saveEntry={saveEntry}
              busy={busy}
            />
          )}
          {page === 'manage' && selectedEntryId && !selectedEntry && (
            <EntryScreenSkeleton />
          )}
          {page === 'manage' && selectedEntry && details && (
            <EntryDetails
              selectedEntry={selectedEntry}
              details={details}
              detailTab={detailTab}
              moduleAction={moduleAction}
              moduleItemId={moduleItemId}
              reloadDetails={() => selectedEntryId && loadDetails(selectedEntryId)}
              reloadAll={refresh}
              navigateModule={navigateModule}
            />
          )}
          {page === 'manage' && selectedEntry && !details && (
            <EntryScreenSkeleton />
          )}
          {page === 'settings' && <Settings navigate={navigate} />}
          {page === 'profile' && <ProfileSettings />}
          {page === 'password' && <PasswordSettings />}
          {page === 'roles' && <RolesPage />}
          {page === 'staff-users' && <StaffUsersPage />}
        </main>
      </div>
    </div>
  );
}
