<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            if (! Schema::hasColumn('app_memberships', 'promo_code')) {
                $table->string('promo_code')->nullable()->after('plan');
            }

            if (! Schema::hasColumn('app_memberships', 'promo_discount')) {
                $table->decimal('promo_discount', 8, 2)->default(0)->after('promo_code');
            }

            if (! Schema::hasColumn('app_memberships', 'amount_paid')) {
                $table->decimal('amount_paid', 8, 2)->nullable()->after('promo_discount');
            }

            if (! Schema::hasColumn('app_memberships', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('expires_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('app_memberships', 'promo_code') ? 'promo_code' : null,
                Schema::hasColumn('app_memberships', 'promo_discount') ? 'promo_discount' : null,
                Schema::hasColumn('app_memberships', 'amount_paid') ? 'amount_paid' : null,
                Schema::hasColumn('app_memberships', 'cancelled_at') ? 'cancelled_at' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
