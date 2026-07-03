export function Sidebar({
  page,
  navigate,
  entries = [],
  selectedMode,
  selectedEntry,
  selectedEntryId,
  detailTab,
  changeSelectedEntry,
  navigateSelected,
  leaveSelectedEntry,
  editEntry,
}) {
  const link = (key, label, icon) => (
    <button
      type="button"
      onClick={() => navigate(key)}
      className={`admin-sidebar__link w-full ${page === key || (key === 'entries' && page === 'entry-form') ? 'admin-sidebar__link--active' : ''}`}
    >
      <SidebarIcon name={icon} />
      <span className="admin-sidebar__text">{label}</span>
    </button>
  );

  const manageLink = (tab, label, icon) => (
    <button
      type="button"
      onClick={() => navigateSelected('manage', tab)}
      className={`admin-sidebar__link w-full ${page === 'manage' && detailTab === tab ? 'admin-sidebar__link--active' : ''}`}
    >
      <SidebarIcon name={icon} />
      <span className="admin-sidebar__text">{label}</span>
    </button>
  );

  return (
    <aside id="sidebar" className="admin-sidebar">
      <div className="admin-sidebar__switcher">
        <div className="admin-sidebar__switcher-row">
          {selectedMode && (
            <button
              type="button"
              onClick={leaveSelectedEntry}
              className="admin-sidebar__return"
              title="Return to main panel"
              aria-label="Return to main panel"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.5 3 1.5 8l5 5V9h8V7h-8V3Z" />
              </svg>
            </button>
          )}
          <select
            id="sidebar-entry-switcher"
            value={selectedEntryId || ''}
            onChange={(event) => changeSelectedEntry(event.target.value)}
            className="admin-sidebar__select"
          >
            <option value="">Main Panel</option>
            {entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
          </select>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {selectedMode ? (
          <>
            <button
              type="button"
              onClick={() => navigateSelected('dashboard')}
              className={`admin-sidebar__link w-full ${page === 'dashboard' ? 'admin-sidebar__link--active' : ''}`}
            >
              <SidebarIcon name="dashboard" />
              <span className="admin-sidebar__text">Dashboard</span>
            </button>
            {/* Edit current entry */}
            <button
              type="button"
              onClick={() => editEntry && editEntry(selectedEntry)}
              className={`admin-sidebar__link w-full ${page === 'entry-form' ? 'admin-sidebar__link--active' : ''}`}
            >
              <SidebarIcon name="edit" />
              <span className="admin-sidebar__text">Edit Entry</span>
            </button>

            {manageLink('plans', 'Plans', 'plans')}
            {manageLink('memberships', 'Memberships', 'memberships')}
            {manageLink('notifications', 'Notifications', 'notifications')}
            {manageLink('fcm', 'FCM Settings', 'fcm')}
            {manageLink('users', 'Active Users', 'users')}
            {manageLink('pages', 'Pages', 'pages')}
            {manageLink('files', 'Files', 'files')}
          </>
        ) : (
          <>
            <div className="admin-sidebar__section">Admin</div>
            {link('dashboard', 'Dashboard', 'dashboard')}
            {link('entries', 'Entries', 'entries')}
            {link('settings', 'Settings', 'settings')}
          </>
        )}
      </nav>
    </aside>
  );
}

function SidebarIcon({ name }) {
  const icons = {
    dashboard:     <path d="M3 8.5 8 4l5 4.5V13a1 1 0 0 1-1 1H9.5v-4h-3v4H4a1 1 0 0 1-1-1V8.5Z" />,
    entries:       <path d="M3 3h10v2H3V3Zm0 4h10v2H3V7Zm0 4h7v2H3v-2Z" />,
    edit:          <path d="M11.5 2.5a1.41 1.41 0 0 1 2 2L5 13H3v-2L11.5 2.5ZM3 14h10" />,
    plans:         <path d="M3 3h10v10H3V3Zm2 2v6h6V5H5Zm1 1h4v1H6V6Zm0 2h4v1H6V8Z" />,
    memberships:   <path d="M5.5 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm5 1a1.75 1.75 0 1 1 0-3.5A1.75 1.75 0 0 1 10.5 8ZM2 13c.35-2.35 1.65-3.5 3.5-3.5S8.65 10.65 9 13H2Zm6.5 0c.2-1.25.8-2.2 1.75-2.75 1.75.1 2.95 1.05 3.25 2.75h-5Z" />,
    features:      <path d="m8 2 1.7 3.45 3.8.55-2.75 2.68.65 3.78L8 10.68l-3.4 1.78.65-3.78L2.5 6l3.8-.55L8 2Z" />,
    notifications: <path d="M8 14a1.5 1.5 0 0 0 1.42-1H6.58A1.5 1.5 0 0 0 8 14Zm5-3H3l1.2-1.4V7a3.8 3.8 0 0 1 2.9-3.7V2h1.8v1.3A3.8 3.8 0 0 1 11.8 7v2.6L13 11Z" />,
    fcm:           <path d="M4 2h8v12H4V2Zm2 2v6h4V4H6Zm0 7v1h4v-1H6Z" />,
    users:         <path d="M6.5 7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM2 14c.45-3.05 2-4.6 4.5-4.6S10.55 10.95 11 14H2Zm9.2-5.2a2.25 2.25 0 0 0 0-4.3 3.5 3.5 0 0 1 0 4.3ZM10.5 14h3.5c-.25-1.85-1.2-3.05-2.75-3.5.55.8.95 1.95 1.15 3.5h-1.9Z" />,
    pages:         <path d="M3 2h7l3 3v9H3V2Zm2 4v1h6V6H5Zm0 2v1h6V8H5Zm0 2v1h4v-1H5Z" />,
    settings:      <path d="M8 5a3 3 0 1 0 0 6A3 3 0 0 0 8 5Zm-1 3a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM6.34 2.34l-.9 1.56A5.97 5.97 0 0 0 4 4.73L2.27 4.5l-.77 1.33.93 1.35a6.1 6.1 0 0 0 0 1.64L1.5 10.17l.77 1.33L4 11.27a5.97 5.97 0 0 0 1.44.83l.9 1.56h1.32l.9-1.56A5.97 5.97 0 0 0 10 11.27l1.73.23.77-1.33-.93-1.35a6.1 6.1 0 0 0 0-1.64l.93-1.35-.77-1.33L10 4.73a5.97 5.97 0 0 0-1.44-.83l-.9-1.56H6.34Z" />,
    files:         <path d="M2 6a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1H2V6Zm0 3h14v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" />,
  };

  return (
    <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
      {icons[name] || icons.entries}
    </svg>
  );
}
