import { useEffect, useMemo, useState } from 'react';
import { request } from './api';
import { Header } from './components/Header';
import { ConfirmProvider } from './components/ConfirmDialog';
import { Sidebar } from './components/Sidebar';
import { EntryScreenSkeleton, PageSkeleton } from './components/Skeleton';
import { Dashboard } from './pages/Dashboard';
import { Entries } from './pages/Entries';
import { EntryDetails } from './pages/EntryDetails';
import { EntryFormScreen } from './pages/EntryFormScreen';
import { blankEntry } from './utils';

const tabSlugByKey = {
  plans: 'plans',
  memberships: 'memberships',
  features: 'features',
  notifications: 'notifications',
  fcm: 'fcm-settings',
  users: 'active-users',
};

const tabKeyBySlug = Object.fromEntries(Object.entries(tabSlugByKey).map(([key, slug]) => [slug, key]));

function routeFromPath(pathname = window.location.pathname) {
  const editMatch = pathname.match(/^\/domains\/(\d+)\/edit$/);
  if (editMatch) {
    return { page: 'entry-form', selectedEntryId: null, detailTab: 'plans', editingEntryId: Number(editMatch[1]) };
  }

  if (pathname === '/domains/create') {
    return { page: 'entry-form', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
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
    };
  }

  if (pathname === '/domains') {
    return { page: 'entries', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
  }

  return { page: 'dashboard', selectedEntryId: null, detailTab: 'plans', editingEntryId: null };
}

export function App() {
  return (
    <ConfirmProvider>
      <AdminApp />
    </ConfirmProvider>
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
      setEntryForm({ ...blankEntry, ...entry });
    }
  }, [entries, editingEntryId, page]);

  function applyRoute(route, push = true, url = null) {
    setDetails((current) => {
      if (!route.selectedEntryId) return null;
      return current?.entry?.id === route.selectedEntryId ? current : null;
    });

    setPage(route.page);
    setSelectedEntryId(route.selectedEntryId);
    setDetailTab(route.detailTab || 'plans');
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
    applyRoute(
      { page: next, selectedEntryId: null, detailTab: 'plans', editingEntryId: null },
      true,
      next === 'dashboard' ? '/dashboard' : '/domains',
    );
  }

  function addEntry() {
    applyRoute({ page: 'entry-form', selectedEntryId: null, detailTab: 'plans', editingEntryId: null }, true, '/domains/create');
  }

  function openEntryTab(entryId, tab) {
    applyRoute({ page: 'manage', selectedEntryId: entryId, detailTab: tab, editingEntryId: null }, true, selectedUrl(entryId, 'manage', tab));
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

  async function saveEntry(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const method = editingEntryId ? 'PUT' : 'POST';
      const url = editingEntryId ? `/admin-api/entries/${editingEntryId}` : '/admin-api/entries';
      await request(url, { method, body: JSON.stringify(entryForm) });
      setEntryForm(blankEntry);
      setEditingEntryId(null);
      await refresh();
      applyRoute({ page: 'entries', selectedEntryId: null, detailTab: 'plans', editingEntryId: null }, true, '/domains');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function editEntry(entry) {
    setEntryForm({ ...blankEntry, ...entry });
    applyRoute({ page: 'entry-form', selectedEntryId: null, detailTab: 'plans', editingEntryId: entry.id }, true, `/domains/${entry.id}/edit`);
  }

  function cancelEntryForm() {
    applyRoute({ page: 'entries', selectedEntryId: null, detailTab: 'plans', editingEntryId: null }, true, '/domains');
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
            />
          )}
          {page === 'dashboard' && selectedEntryId && !selectedEntry && (
            <PageSkeleton titleWidth="w-72" subtitleWidth="w-56" />
          )}
          {page === 'entries' && (
            <Entries
              entries={entries}
              addEntry={addEntry}
              editEntry={editEntry}
              reloadEntries={refresh}
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
              reloadDetails={() => selectedEntryId && loadDetails(selectedEntryId)}
              reloadAll={refresh}
            />
          )}
          {page === 'manage' && selectedEntry && !details && (
            <EntryScreenSkeleton />
          )}
        </main>
      </div>
    </div>
  );
}
