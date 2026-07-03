<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            if (! Schema::hasColumn('user_devices', 'email')) {
                $table->string('email')->nullable()->after('domain_id');
            }

            if (! Schema::hasColumn('user_devices', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('fcm_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            foreach (['email', 'last_seen_at'] as $column) {
                if (Schema::hasColumn('user_devices', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
