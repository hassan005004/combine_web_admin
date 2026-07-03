<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Roles ─────────────────────────────────────────────────────────────
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('is_super_admin')->default(false); // bypasses all permission checks
            $table->timestamps();
        });

        // ── Per-module permissions ─────────────────────────────────────────────
        // module keys match the sidebar tab keys / global section keys
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->string('module');           // e.g. 'plans', 'memberships', 'entries', 'users'
            $table->boolean('can_view')->default(false);
            $table->boolean('can_create')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->unique(['role_id', 'module']);
            $table->timestamps();
        });

        // ── Entry (domain) access scoping ─────────────────────────────────────
        // Empty = access to ALL entries. Rows here restrict to specific entries.
        Schema::create('role_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->unique(['role_id', 'domain_id']);
            $table->timestamps();
        });

        // ── Assign role to users ──────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null')->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
        Schema::dropIfExists('role_entries');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('roles');
    }
};
