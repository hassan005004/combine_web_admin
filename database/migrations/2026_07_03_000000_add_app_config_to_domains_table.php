<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            if (! Schema::hasColumn('domains', 'cache_ttl_hours')) {
                $table->unsignedInteger('cache_ttl_hours')->default(168)->after('application_id');
            }

            if (! Schema::hasColumn('domains', 'privacy_policy')) {
                $table->longText('privacy_policy')->nullable()->after('seo_keywords');
            }

            if (! Schema::hasColumn('domains', 'terms_conditions')) {
                $table->longText('terms_conditions')->nullable()->after('privacy_policy');
            }

            if (! Schema::hasColumn('domains', 'support_policy')) {
                $table->longText('support_policy')->nullable()->after('terms_conditions');
            }

            if (! Schema::hasColumn('domains', 'about_us')) {
                $table->longText('about_us')->nullable()->after('support_policy');
            }

            if (! Schema::hasColumn('domains', 'ads_settings')) {
                $table->json('ads_settings')->nullable()->after('about_us');
            }
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            foreach ([
                'cache_ttl_hours',
                'privacy_policy',
                'terms_conditions',
                'support_policy',
                'about_us',
                'ads_settings',
            ] as $column) {
                if (Schema::hasColumn('domains', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
