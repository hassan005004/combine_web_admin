<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            $table->string('promo_code')->nullable()->after('plan');
            $table->decimal('promo_discount', 8, 2)->default(0)->after('promo_code');
            $table->decimal('amount_paid', 8, 2)->nullable()->after('promo_discount');
            $table->timestamp('cancelled_at')->nullable()->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            $table->dropColumn(['promo_code', 'promo_discount', 'amount_paid', 'cancelled_at']);
        });
    }
};
