<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('domains', 'social_links')) {
            Schema::table('domains', function (Blueprint $table) {
                $table->json('social_links')->nullable()->after('ads_settings');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('domains', 'social_links')) {
            Schema::table('domains', function (Blueprint $table) {
                $table->dropColumn('social_links');
            });
        }
    }
};
