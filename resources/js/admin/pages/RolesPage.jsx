import { useCallback, useEffect, useState } from 'react';
import { request } from '../api';
import { useConfirm } from '../components/ConfirmDialog';

// ─── constants ────────────────────────────────────────────────────────────────

const ACTIONS = ['view', 'create', 'edit', 'delete'];

// ─── main page ────────────────────────────────────────────────────────────────

export function RolesPage() {
  const [data, setData]       = useState(null);
  const [editRole, setEdit]   = useState(null); // null = list, object = form
  const [busy, setBusy]       = useState(false);
  const { confirmDelete }     = useConfirm();

  const load = useCallback(async () => {
    setData(await request('/admin-api/roles'));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteRole(role) {
    const ok = await confirmDelete({ title: `Delete role "${role.name}"`, message: 'Users with this role will become unassigned.' });
    if (!ok) return;
    await request(`/admin-api/roles/${role.id}`, { method: 'DELETE' });
    await load();
  }

  async function assignUser(userId, roleId) {
    await request('/admin-api/roles/assign-user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role_id: roleId || null }),
    });
    await load();
  }

  if (!data) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  if (editRole !== null) {
    return (
      <RoleForm
        role={editRole}
        globalModules={data.global_modules}
        entryModules={data.entry_modules}
        allEntries={data.entries}
        onSave={async (payload) => {
          setBusy(true);
          try {
            if (payload.id) {
              await request(`/admin-api/roles/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
              await request('/admin-api/roles', { method: 'POST', body: JSON.stringify(payload) });
            }
            await load();
            setEdit(null);
          } finally {
            setBusy(false);
          }
        }}
        busy={busy}
        onCancel={() => setEdit(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Control what each admin can see and do across modules and entries.
          </p>
        </div>
        <button type="button" onClick={() => setEdit({})}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
          New Role
        </button>
      </div>

      {/* Roles list */}
      <div className="space-y-4 mb-10">
        {data.roles.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-400 dark:border-gray-700">
            No roles yet. Create one to get started.
          </div>
        )}
        {data.roles.map((role) => (
          <div key={role.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{role.name}</span>
                  {role.is_super_admin && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                      Super Admin
                    </span>
                  )}
                </div>
                {role.description && (
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {role.users_count} user{role.users_count !== 1 ? 's' : ''}
                  {role.entry_ids?.length > 0
                    ? ` · Access to ${role.entry_ids.length} entr${role.entry_ids.length !== 1 ? 'ies' : 'y'}`
                    : ' · Access to all entries'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setEdit(role)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Edit
                </button>
                <button type="button" onClick={() => deleteRole(role)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-sm text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400">
                  Delete
                </button>
              </div>
            </div>

            {/* Permission chips */}
            {!role.is_super_admin && Object.keys(role.permissions).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(role.permissions).map(([mod, perms]) => {
                  const acts = ACTIONS.filter((a) => perms[`can_${a}`]);
                  if (!acts.length) return null;
                  return (
                    <span key={mod} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {mod}: {acts.join(', ')}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User assignment */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">User Assignments</h2>
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase font-semibold text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">{user.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role_id || ''}
                      onChange={(e) => assignUser(user.id, e.target.value)}
                      className="block w-48 rounded-lg border-gray-300 text-sm dark:bg-gray-900 dark:border-gray-700"
                    >
                      <option value="">No role (Super Admin)</option>
                      {data.roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Role form ────────────────────────────────────────────────────────────────

function RoleForm({ role, globalModules, entryModules, allEntries, onSave, busy, onCancel }) {
  const isEdit = Boolean(role.id);

  // Build initial permissions map from existing role
  const initPerms = (mods) => {
    const map = {};
    Object.keys(mods).forEach((mod) => {
      map[mod] = {
        can_view:   role.permissions?.[mod]?.can_view   ?? false,
        can_create: role.permissions?.[mod]?.can_create ?? false,
        can_edit:   role.permissions?.[mod]?.can_edit   ?? false,
        can_delete: role.permissions?.[mod]?.can_delete ?? false,
      };
    });
    return map;
  };

  const [name, setName]             = useState(role.name || '');
  const [desc, setDesc]             = useState(role.description || '');
  const [isSuperAdmin, setSuper]    = useState(role.is_super_admin ?? false);
  const [globalPerms, setGlobal]    = useState(() => initPerms(globalModules));
  const [entryPerms, setEntryPerms] = useState(() => initPerms(entryModules));
  const [entryIds, setEntryIds]     = useState(role.entry_ids || []);
  const [entryScope, setScope]      = useState(
    !role.id || (role.entry_ids?.length === 0) ? 'all' : 'selected'
  );

  function togglePerm(setter, mod, action) {
    setter((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [`can_${action}`]: !prev[mod][`can_${action}`] },
    }));
  }

  function setAllActions(setter, mod, value) {
    setter((prev) => ({
      ...prev,
      [mod]: { can_view: value, can_create: value, can_edit: value, can_delete: value },
    }));
  }

  function toggleEntry(id) {
    setEntryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function buildPayload() {
    const permissions = [];
    const addPerms = (map) => {
      Object.entries(map).forEach(([mod, p]) => {
        if (p.can_view || p.can_create || p.can_edit || p.can_delete) {
          permissions.push({ module: mod, ...p });
        }
      });
    };
    addPerms(globalPerms);
    addPerms(entryPerms);

    return {
      id:             role.id,
      name,
      description:    desc,
      is_super_admin: isSuperAdmin,
      permissions,
      entry_ids:      entryScope === 'all' ? [] : entryIds,
    };
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onCancel} className="text-sm text-violet-600 hover:underline">← Back</button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {isEdit ? `Edit Role: ${role.name}` : 'New Role'}
        </h1>
      </div>

      <div className="space-y-6">

        {/* Basic info */}
        <Card title="Role Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name *
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700" />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900 dark:border-gray-700" />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={isSuperAdmin} onChange={(e) => setSuper(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600" />
            <span>
              <strong>Super Admin</strong> — bypasses all permission checks, can access everything
            </span>
          </label>
        </Card>

        {!isSuperAdmin && (
          <>
            {/* Global module permissions */}
            <Card title="Global Modules" subtitle="Permissions that apply across the whole admin panel">
              <PermissionMatrix
                modules={globalModules}
                perms={globalPerms}
                onToggle={(mod, act) => togglePerm(setGlobal, mod, act)}
                onAll={(mod, v) => setAllActions(setGlobal, mod, v)}
              />
            </Card>

            {/* Entry module permissions */}
            <Card title="Entry Modules" subtitle="Permissions for features inside each entry (domain)">
              <PermissionMatrix
                modules={entryModules}
                perms={entryPerms}
                onToggle={(mod, act) => togglePerm(setEntryPerms, mod, act)}
                onAll={(mod, v) => setAllActions(setEntryPerms, mod, v)}
              />
            </Card>

            {/* Entry scope */}
            <Card title="Entry Access" subtitle="Which entries this role can access">
              <div className="flex gap-4 mb-4">
                {[['all', 'All entries'], ['selected', 'Selected entries only']].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="scope" value={v} checked={entryScope === v}
                      onChange={() => setScope(v)} className="text-violet-600" />
                    {l}
                  </label>
                ))}
              </div>
              {entryScope === 'selected' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allEntries.map((entry) => (
                    <label key={entry.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={entryIds.includes(entry.id)}
                        onChange={() => toggleEntry(entry.id)}
                        className="h-4 w-4 rounded border-gray-300 text-violet-600" />
                      {entry.title}
                    </label>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        <div className="flex gap-2">
          <button type="button" disabled={busy || !name.trim()} onClick={() => onSave(buildPayload())}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white disabled:opacity-60">
            {busy ? 'Saving…' : isEdit ? 'Update Role' : 'Create Role'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Permission matrix ────────────────────────────────────────────────────────

function PermissionMatrix({ modules, perms, onToggle, onAll }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase text-gray-400">Module</th>
            {ACTIONS.map((a) => (
              <th key={a} className="py-2 px-3 text-center text-xs font-semibold uppercase text-gray-400">{a}</th>
            ))}
            <th className="py-2 px-3 text-center text-xs font-semibold uppercase text-gray-400">All</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/60">
          {Object.entries(modules).map(([mod, label]) => {
            const p = perms[mod] || {};
            const allOn = ACTIONS.every((a) => p[`can_${a}`]);
            return (
              <tr key={mod}>
                <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300">{label}</td>
                {ACTIONS.map((act) => (
                  <td key={act} className="py-2.5 px-3 text-center">
                    <input type="checkbox" checked={!!p[`can_${act}`]}
                      onChange={() => onToggle(mod, act)}
                      className="h-4 w-4 rounded border-gray-300 text-violet-600" />
                  </td>
                ))}
                <td className="py-2.5 px-3 text-center">
                  <input type="checkbox" checked={allOn}
                    onChange={(e) => onAll(mod, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-0.5 font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      {subtitle && <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}
