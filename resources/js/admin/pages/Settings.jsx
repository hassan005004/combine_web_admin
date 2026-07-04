export function Settings({ navigate }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your admin account and sign-in security.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsCard
          title="Profile"
          description="Update your display name and account email."
          action="Open Profile"
          onClick={() => navigate('profile')}
        />
        <SettingsCard
          title="Password"
          description="Change the password used to sign in to this panel."
          action="Change Password"
          onClick={() => navigate('password')}
        />
      </div>
    </div>
  );
}

function SettingsCard({ title, description, action, onClick }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      <p className="mt-2 min-h-10 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
      >
        {action}
      </button>
    </div>
  );
}
