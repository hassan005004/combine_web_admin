<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('app_memberships', 'cancellation_source')) {
            DB::statement('ALTER TABLE app_memberships MODIFY cancellation_source VARCHAR(255) NULL DEFAULT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('app_memberships', 'cancellation_source')) {
            DB::table('app_memberships')
                ->whereNull('cancellation_source')
                ->update(['cancellation_source' => 'admin']);

            DB::statement("ALTER TABLE app_memberships MODIFY cancellation_source VARCHAR(255) NOT NULL DEFAULT 'admin'");
        }
    }
};
