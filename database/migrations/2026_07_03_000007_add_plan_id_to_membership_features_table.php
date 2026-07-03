<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_features', function (Blueprint $table) {
            if (! Schema::hasColumn('membership_features', 'membership_plan_id')) {
                $table->foreignId('membership_plan_id')
                    ->nullable()
                    ->after('domain_id')
                    ->constrained('membership_plans')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('membership_features', function (Blueprint $table) {
            if (Schema::hasColumn('membership_features', 'membership_plan_id')) {
                $table->dropConstrainedForeignId('membership_plan_id');
            }
        });
    }
};
