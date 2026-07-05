<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->string('app_version')->nullable()->after('application_id');
            $table->string('min_build_code')->nullable()->after('app_version');
            $table->boolean('force_update')->default(false)->after('min_build_code');
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn(['app_version', 'min_build_code', 'force_update']);
        });
    }
};
