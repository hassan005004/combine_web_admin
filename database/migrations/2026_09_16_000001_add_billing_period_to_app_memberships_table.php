<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            if (! Schema::hasColumn('app_memberships', 'billing_period')) {
                $table->string('billing_period', 20)->nullable()->after('plan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            if (Schema::hasColumn('app_memberships', 'billing_period')) {
                $table->dropColumn('billing_period');
            }
        });
    }
};
