<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            if (! Schema::hasColumn('domains', 'google_play_url')) {
                $table->string('google_play_url')->nullable()->after('url');
            }

            if (! Schema::hasColumn('domains', 'app_store_url')) {
                $table->string('app_store_url')->nullable()->after('google_play_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            foreach (['google_play_url', 'app_store_url'] as $column) {
                if (Schema::hasColumn('domains', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
