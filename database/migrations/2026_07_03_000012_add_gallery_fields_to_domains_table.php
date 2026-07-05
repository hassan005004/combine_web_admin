<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            if (! Schema::hasColumn('domains', 'logo_path')) {
                $table->string('logo_path')->nullable()->after('application_id');
            }

            if (! Schema::hasColumn('domains', 'show_in_apps_gallery')) {
                $table->boolean('show_in_apps_gallery')->default(false)->after('logo_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            foreach (['show_in_apps_gallery', 'logo_path'] as $column) {
                if (Schema::hasColumn('domains', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
