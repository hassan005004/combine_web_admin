<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            $anchorColumn = Schema::hasColumn('app_memberships', 'cancelled_at')
                ? 'cancelled_at'
                : (Schema::hasColumn('app_memberships', 'expires_at') ? 'expires_at' : 'updated_at');

            if (! Schema::hasColumn('app_memberships', 'cancellation_requested_at')) {
                $table->timestamp('cancellation_requested_at')->nullable()->after($anchorColumn);
            }

            if (! Schema::hasColumn('app_memberships', 'cancellation_reason')) {
                $table->string('cancellation_reason')->nullable()->after('cancellation_requested_at');
            }

            if (! Schema::hasColumn('app_memberships', 'cancellation_details')) {
                $table->text('cancellation_details')->nullable()->after('cancellation_reason');
            }

            if (! Schema::hasColumn('app_memberships', 'cancellation_source')) {
                $table->string('cancellation_source')->default('admin')->after('cancellation_details');
            }
        });
    }

    public function down(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            foreach ([
                'cancellation_requested_at',
                'cancellation_reason',
                'cancellation_details',
                'cancellation_source',
            ] as $column) {
                if (Schema::hasColumn('app_memberships', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
