import { useState } from 'react';
import { csrf } from '../api';

export function Header() {
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const [profileOpen, setProfileOpen] = useState(false);
  const user = window.adminUser || {};

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    localStorage.setItem('dark-mode', next ? 'true' : 'false');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-900/90">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-end gap-3 py-3">
          <div className="flex shrink-0 items-center justify-end gap-2">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              type="button"
              onClick={toggleDark}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="inline-flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                aria-expanded={profileOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                  {(user.email || user.name || 'A').slice(0, 1).toUpperCase()}
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="px-3 py-2">
                    <div className="text-xs font-semibold uppercase text-gray-400">Signed in as</div>
                    {user.name && <div className="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{user.name}</div>}
                    <div className="mt-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">{user.email}</div>
                  </div>
                  <div className="my-2 border-t border-gray-100 dark:border-gray-700" />
                  <a
                    href="/account/profile"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    <ProfileIcon />
                    Profile Settings
                  </a>
                  <a
                    href="/account/password"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    <LockIcon />
                    Change Password
                  </a>
                  <div className="my-2 border-t border-gray-100 dark:border-gray-700" />
                  <form method="POST" action="/logout">
                    <input type="hidden" name="_token" value={csrf} />
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10" type="submit">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M3 2h6v2H5v8h4v2H3V2Zm8.5 3 3 3-3 3V9H7V7h4.5V5Z" />
                      </svg>
                      Logout
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 14c.45-3.2 2.3-4.8 5.5-4.8s5.05 1.6 5.5 4.8h-11Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 7V5a4 4 0 0 1 8 0v2h1v7H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Zm1 3v2h2v-2H7Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V3m0 18v-2M5 12H3m18 0h-2M6.2 6.2 4.8 4.8m14.4 14.4-1.4-1.4M17.8 6.2l1.4-1.4M4.8 19.2l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
