<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name', 'description', 'is_super_admin'];
    protected $casts    = ['is_super_admin' => 'boolean'];

    public function permissions() { return $this->hasMany(RolePermission::class); }
    public function entries()     { return $this->hasMany(RoleEntry::class); }
    public function users()       { return $this->hasMany(User::class); }

    /** Check if this role has a specific permission on a module */
    public function can(string $module, string $action = 'view'): bool
    {
        if ($this->is_super_admin) return true;
        $perm = $this->permissions->firstWhere('module', $module);
        if (! $perm) return false;
        return (bool) $perm->{"can_{$action}"};
    }

    /** Return array of allowed domain IDs, or null meaning all */
    public function allowedEntryIds(): ?array
    {
        if ($this->is_super_admin) return null;
        $ids = $this->entries->pluck('domain_id')->all();
        return count($ids) > 0 ? $ids : null; // null = unrestricted
    }
}
