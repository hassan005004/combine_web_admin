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
      const serverAds = entry.ads_settings || {};
      const ads = {
        bottom:      { enabled: false, unit_id: '', frequency: 0, ...(serverAds.bottom      || {}) },
        app_open:    { enabled: false, unit_id: '', frequency: 0, ...(serverAds.app_open    || {}) },
        full_screen: { enabled: false, unit_id: '', frequency: 5, ...(serverAds.full_screen || {}) },
        rewarded:    { enabled: false, unit_id: '', frequency: 0, ...(serverAds.rewarded    || {}) },
        native:      { enabled: false, unit_id: '', frequency: 3, ...(serverAds.native      || {}) },
      };
      setEntryForm({ ...blankEntry, ...entry, ads });
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
    const urls = { dashboard: '/dashboard', settings: '/settings', roles: '/roles', 'staff-users': '/staff-users', entries: '/domains' };
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

  async function saveEntry(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const method = 'POST';
      const url    = editingEntryId ? `/admin-api/entries/${editingEntryId}` : '/admin-api/entries';
      await request(url, { method, body: entryFormPayload(entryForm, editingEntryId) });
      const savedId = editingEntryId;
      await refresh(); // refresh entries list so sidebar select is up-to-date
      if (savedId) {
        await loadDetails(savedId); // reload details so latest values are live
        setEntryForm(blankEntry);
        setEditingEntryId(null);
        // Stay on dashboard so user sees the updated entry
        applyRoute(
          { page: 'dashboard', selectedEntryId: savedId, detailTab: 'plans', editingEntryId: null },
          true,
          `/domains/${savedId}/dashboard`,
        );
      } else {
        setEntryForm(blankEntry);
        setEditingEntryId(null);
        applyRoute({ page: 'entries', selectedEntryId: null, detailTab: 'plans', editingEntryId: null }, true, '/domains');
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
      'about_us',
      'app_version',
      'min_build_code',
    ].forEach((key) => payload.append(key, form[key] ?? ''));

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

    return payload;
  }

  function editEntry(entry) {
    const serverAds = entry.ads_settings || {};
    const ads = {
      bottom:      { enabled: false, unit_id: '', frequency: 0, ...(serverAds.bottom      || {}) },
      app_open:    { enabled: false, unit_id: '', frequency: 0, ...(serverAds.app_open    || {}) },
      full_screen: { enabled: false, unit_id: '', frequency: 5, ...(serverAds.full_screen || {}) },
      rewarded:    { enabled: false, unit_id: '', frequency: 0, ...(serverAds.rewarded    || {}) },
      native:      { enabled: false, unit_id: '', frequency: 3, ...(serverAds.native      || {}) },
    };
    setEntryForm({ ...blankEntry, ...entry, ads });
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
          {page === 'settings' && <Settings />}
          {page === 'roles' && <RolesPage />}
          {page === 'staff-users' && <StaffUsersPage />}
        </main>
      </div>
    </div>
  );
}
