export function Sidebar({
  page, navigate, entries = [], selectedMode, selectedEntry,
  selectedEntryId, detailTab, changeSelectedEntry,
  navigateSelected, leaveSelectedEntry, editEntry,
}) {
  const link = (key, label, icon) => (
    <button type="button" onClick={() => navigate(key)}
      className={`admin-sidebar__link w-full ${page === key || (key === 'entries' && page === 'entry-form') ? 'admin-sidebar__link--active' : ''}`}>
      <SidebarIcon name={icon} />
      <span className="admin-sidebar__text">{label}</span>
    </button>
  );

  const ml = (tab, label, icon) => (
    <button type="button" onClick={() => navigateSelected('manage', tab)}
      className={`admin-sidebar__link w-full ${page === 'manage' && detailTab === tab ? 'admin-sidebar__link--active' : ''}`}>
      <SidebarIcon name={icon} />
      <span className="admin-sidebar__text">{label}</span>
    </button>
  );

  return (
    <aside id="sidebar" className="admin-sidebar">
      <div className="admin-sidebar__switcher">
        <div className="admin-sidebar__switcher-row">
          {selectedMode && (
            <button type="button" onClick={leaveSelectedEntry} className="admin-sidebar__return"
              title="Return to main panel" aria-label="Return to main panel">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.5 3 1.5 8l5 5V9h8V7h-8V3Z" />
              </svg>
            </button>
          )}
          <select id="sidebar-entry-switcher" value={selectedEntryId || ''}
            onChange={(e) => changeSelectedEntry(e.target.value)} className="admin-sidebar__select">
            <option value="">Main Panel</option>
            {entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
          </select>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {selectedMode ? (
          <>
            <div className="admin-sidebar__section">Entry</div>
            <button type="button" onClick={() => navigateSelected('dashboard')}
              className={`admin-sidebar__link w-full ${page === 'dashboard' ? 'admin-sidebar__link--active' : ''}`}>
              <SidebarIcon name="dashboard" />
              <span className="admin-sidebar__text">Dashboard</span>
            </button>
            <button type="button" onClick={() => editEntry && editEntry(selectedEntry)}
              className={`admin-sidebar__link w-full ${page === 'entry-form' ? 'admin-sidebar__link--active' : ''}`}>
              <SidebarIcon name="edit" />
              <span className="admin-sidebar__text">Edit Entry</span>
            </button>
            {ml('users',        'Active Users',    'users')}

            <div className="admin-sidebar__section">Monetisation</div>
            {ml('plans',       'Plans',       'plans')}
            {ml('memberships', 'Memberships', 'memberships')}

            <div className="admin-sidebar__section">Engagement</div>
            {ml('notifications', 'Notifications', 'notifications')}
            {ml('faqs',          'FAQs',          'faq')}
            {ml('feedback',      'Feedback',      'feedback')}
            {ml('features',      'Features',      'feature_req')}

            <div className="admin-sidebar__section">Marketing</div>
            {ml('marketing', 'Marketing & Revenue', 'marketing')}

            <div className="admin-sidebar__section">Content</div>
            {ml('pages', 'Pages',    'pages')}
            {ml('notes', 'Notes',    'notes')}
            {ml('files', 'Files',    'files')}

            <div className="admin-sidebar__section">Settings</div>
            {ml('fcm',          'FCM Settings',    'fcm')}
            {ml('smtp',         'SMTP Settings',   'smtp')}
            {ml('admob',        'AdMob',           'admob')}
            {ml('app-version',  'App Version',     'version')}
          </>
        ) : (
          <>
            <div className="admin-sidebar__section">Admin</div>
            {link('dashboard', 'Dashboard', 'dashboard')}
            {link('entries',   'Entries',   'entries')}
            {link('staff-users', 'Staff Users', 'users')}
            {link('settings',  'Settings',  'settings')}
          </>
        )}
      </nav>
    </aside>
  );
}

function SidebarIcon({ name }) {
  const icons = {
    dashboard:    <path d="M3 8.5 8 4l5 4.5V13a1 1 0 0 1-1 1H9.5v-4h-3v4H4a1 1 0 0 1-1-1V8.5Z" />,
    entries:      <path d="M3 3h10v2H3V3Zm0 4h10v2H3V7Zm0 4h7v2H3v-2Z" />,
    edit:         <path d="M11.5 2.5a1.41 1.41 0 0 1 2 2L5 13H3v-2L11.5 2.5ZM3 14h10" />,
    plans:        <path d="M3 3h10v10H3V3Zm2 2v6h6V5H5Zm1 1h4v1H6V6Zm0 2h4v1H6V8Z" />,
    memberships:  <path d="M5.5 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm5 1a1.75 1.75 0 1 1 0-3.5A1.75 1.75 0 0 1 10.5 8ZM2 13c.35-2.35 1.65-3.5 3.5-3.5S8.65 10.65 9 13H2Zm6.5 0c.2-1.25.8-2.2 1.75-2.75 1.75.1 2.95 1.05 3.25 2.75h-5Z" />,
    notifications:<path d="M8 14a1.5 1.5 0 0 0 1.42-1H6.58A1.5 1.5 0 0 0 8 14Zm5-3H3l1.2-1.4V7a3.8 3.8 0 0 1 2.9-3.7V2h1.8v1.3A3.8 3.8 0 0 1 11.8 7v2.6L13 11Z" />,
    faq:          <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm0 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm.75-3.75a.75.75 0 0 1-1.5 0V7a.75.75 0 0 1 .6-.735C8.285 6.13 9 5.5 9 5a1 1 0 1 0-2 0 .75.75 0 0 1-1.5 0 2.5 2.5 0 1 1 4.25 1.765V7.75Z" />,
    feedback:     <path d="M2 2h12v9H9l-3 3v-3H2V2Zm2 3v1h8V5H4Zm0 2.5v1h6v-1H4Z" />,
    feature_req:  <path d="m8 2 1.7 3.45 3.8.55-2.75 2.68.65 3.78L8 10.68l-3.4 1.78.65-3.78L2.5 6l3.8-.55L8 2Z" />,
    marketing:    <path d="M2 11V5l5-2 4 2 3-1v6l-3 1-4-2-5 2Zm5-2V5.2L4 6.5V11l3-1.2-.02-.8Z" />,
    pages:        <path d="M3 2h7l3 3v9H3V2Zm2 4v1h6V6H5Zm0 2v1h6V8H5Zm0 2v1h4v-1H5Z" />,
    notes:        <path d="M3 2h10v12H3V2Zm2 3v1h6V5H5Zm0 2.5v1h6v-1H5Zm0 2.5v1h4v-1H5Z" />,
    files:        <path d="M2 6a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1H2V6Zm0 3h14v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" />,
    fcm:          <path d="M4 2h8v12H4V2Zm2 2v6h4V4H6Zm0 7v1h4v-1H6Z" />,
    smtp:         <path d="M2 4h12v8H2V4Zm1.5 1.5v.7L8 8.7l4.5-2.5v-.7h-9Zm0 1.9v3.1h9V7.4L8 9.9 3.5 7.4Z" />,
    version:      <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2ZM7 5h2v4H7V5Zm0 5h2v2H7v-2Z" />,
    admob:        <path d="M2 11V5l4-2 4 2 4-2v6l-4 2-4-2-4 2Zm4-2V5.5L3.5 6.8V11L6 9.8v-.8Zm4 0V6l-2-1v3.5l.5.25L10 9Zm3-1.5L11 8V9.8l2 1V7.5Z" />,
    users:        <path d="M6.5 7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM2 14c.45-3.05 2-4.6 4.5-4.6S10.55 10.95 11 14H2Zm9.2-5.2a2.25 2.25 0 0 0 0-4.3 3.5 3.5 0 0 1 0 4.3ZM10.5 14h3.5c-.25-1.85-1.2-3.05-2.75-3.5.55.8.95 1.95 1.15 3.5h-1.9Z" />,
    settings:     <path d="M8 5a3 3 0 1 0 0 6A3 3 0 0 0 8 5Zm-1 3a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM6.34 2.34l-.9 1.56A5.97 5.97 0 0 0 4 4.73L2.27 4.5l-.77 1.33.93 1.35a6.1 6.1 0 0 0 0 1.64L1.5 10.17l.77 1.33L4 11.27a5.97 5.97 0 0 0 1.44.83l.9 1.56h1.32l.9-1.56A5.97 5.97 0 0 0 10 11.27l1.73.23.77-1.33-.93-1.35a6.1 6.1 0 0 0 0-1.64l.93-1.35-.77-1.33L10 4.73a5.97 5.97 0 0 0-1.44-.83l-.9-1.56H6.34Z" />,
  };

  return (
    <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
      {icons[name] || icons.entries}
    </svg>
  );
}
