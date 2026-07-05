<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            if (! Schema::hasColumn('app_memberships', 'device_id')) {
                $table->string('device_id')->nullable()->after('email');
                $table->unique(['domain_id', 'device_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            if (Schema::hasColumn('app_memberships', 'device_id')) {
                $table->dropUnique('app_memberships_domain_id_device_id_unique');
                $table->dropColumn('device_id');
            }
        });
    }
};
