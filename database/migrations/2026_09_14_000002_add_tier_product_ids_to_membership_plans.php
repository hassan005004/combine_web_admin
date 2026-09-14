<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('membership_plans', 'google_play_tier_product_ids')) {
                $table->json('google_play_tier_product_ids')->nullable()->after('country_prices');
            }
        });
    }

    public function down(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            if (Schema::hasColumn('membership_plans', 'google_play_tier_product_ids')) {
                $table->dropColumn('google_play_tier_product_ids');
            }
        });
    }
};
