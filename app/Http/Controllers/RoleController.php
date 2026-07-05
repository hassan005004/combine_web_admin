<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\Role;
use App\Models\RoleEntry;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Http\Request;

// All module keys available in the system — two types
// 'global'  → not scoped to an entry
// 'entry'   → scoped to a specific domain/entry
class RoleController extends Controller
{
    const GLOBAL_MODULES = [
        'entries'     => 'Entries',
        'users'       => 'Users',
        'roles'       => 'Roles & Permissions',
        'settings'    => 'Admin Settings',
    ];

    const ENTRY_MODULES = [
        'plans'         => 'Plans',
        'memberships'   => 'Memberships',
        'notifications' => 'Notifications',
        'fcm'           => 'FCM Settings',
        'faqs'          => 'FAQs',
        'feedback'      => 'Feedback',
        'features'      => 'Feature Requests',
        'marketing'     => 'Marketing & Revenue',
        'pages'         => 'Pages',
        'files'         => 'Files',
        'app-version'   => 'App Version',
        'active-users'  => 'Active Users',
    ];

    // ── List roles ────────────────────────────────────────────────────────────

    public function index()
    {
        $roles = Role::with(['permissions', 'entries.domain:id,title'])
            ->withCount('users')
            ->latest()
            ->get()
            ->map(fn ($role) => $this->formatRole($role));

        return response()->json([
            'roles'          => $roles,
            'users'          => User::select('id', 'name', 'email', 'role_id')->latest()->get(),
            'entries'        => Domain::select('id', 'title')->orderBy('title')->get(),
            'global_modules' => self::GLOBAL_MODULES,
            'entry_modules'  => self::ENTRY_MODULES,
        ]);
    }

    // ── Create role ───────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:100'],
            'description'     => ['nullable', 'string', 'max:500'],
            'is_super_admin'  => ['boolean'],
            'permissions'     => ['nullable', 'array'],
            'permissions.*.module'      => ['required', 'string'],
            'permissions.*.can_view'    => ['boolean'],
            'permissions.*.can_create'  => ['boolean'],
            'permissions.*.can_edit'    => ['boolean'],
            'permissions.*.can_delete'  => ['boolean'],
            'entry_ids'       => ['nullable', 'array'],
            'entry_ids.*'     => ['integer', 'exists:domains,id'],
        ]);

        $role = Role::create([
            'name'           => $data['name'],
            'description'    => $data['description'] ?? null,
            'is_super_admin' => $data['is_super_admin'] ?? false,
        ]);

        $this->syncPermissions($role, $data['permissions'] ?? []);
        $this->syncEntries($role, $data['entry_ids'] ?? []);

        return response()->json(['role' => $this->formatRole($role->fresh(['permissions', 'entries.domain:id,title']))], 201);
    }

    // ── Update role ───────────────────────────────────────────────────────────

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:100'],
            'description'     => ['nullable', 'string', 'max:500'],
            'is_super_admin'  => ['boolean'],
            'permissions'     => ['nullable', 'array'],
            'permissions.*.module'      => ['required', 'string'],
            'permissions.*.can_view'    => ['boolean'],
            'permissions.*.can_create'  => ['boolean'],
            'permissions.*.can_edit'    => ['boolean'],
            'permissions.*.can_delete'  => ['boolean'],
            'entry_ids'       => ['nullable', 'array'],
            'entry_ids.*'     => ['integer', 'exists:domains,id'],
        ]);

        $role->update([
            'name'           => $data['name'],
            'description'    => $data['description'] ?? null,
            'is_super_admin' => $data['is_super_admin'] ?? false,
        ]);

        $this->syncPermissions($role, $data['permissions'] ?? []);
        $this->syncEntries($role, $data['entry_ids'] ?? []);

        return response()->json(['role' => $this->formatRole($role->fresh(['permissions', 'entries.domain:id,title']))]);
    }

    // ── Delete role ───────────────────────────────────────────────────────────

    public function destroy(Role $role)
    {
        // Unassign users
        User::where('role_id', $role->id)->update(['role_id' => null]);
        $role->delete();

        return response()->json(['success' => true]);
    }

    // ── Assign role to user ───────────────────────────────────────────────────

    public function assignUser(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role_id' => ['nullable', 'exists:roles,id'],
        ]);

        User::where('id', $data['user_id'])->update(['role_id' => $data['role_id']]);

        return response()->json(['success' => true]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function syncPermissions(Role $role, array $permissions): void
    {
        $role->permissions()->delete();
        foreach ($permissions as $perm) {
            RolePermission::create([
                'role_id'    => $role->id,
                'module'     => $perm['module'],
                'can_view'   => $perm['can_view']   ?? false,
                'can_create' => $perm['can_create'] ?? false,
                'can_edit'   => $perm['can_edit']   ?? false,
                'can_delete' => $perm['can_delete'] ?? false,
            ]);
        }
    }

    private function syncEntries(Role $role, array $entryIds): void
    {
        $role->entries()->delete();
        foreach (array_unique($entryIds) as $domainId) {
            RoleEntry::create(['role_id' => $role->id, 'domain_id' => $domainId]);
        }
    }

    private function formatRole(Role $role): array
    {
        $permMap = [];
        foreach ($role->permissions as $p) {
            $permMap[$p->module] = [
                'can_view'   => $p->can_view,
                'can_create' => $p->can_create,
                'can_edit'   => $p->can_edit,
                'can_delete' => $p->can_delete,
            ];
        }

        return [
            'id'             => $role->id,
            'name'           => $role->name,
            'description'    => $role->description,
            'is_super_admin' => $role->is_super_admin,
            'users_count'    => $role->users_count ?? 0,
            'permissions'    => $permMap,
            'entry_ids'      => $role->entries->pluck('domain_id')->all(),
            'entries'        => $role->entries->map(fn ($e) => ['id' => $e->domain_id, 'title' => $e->domain?->title]),
        ];
    }
}
