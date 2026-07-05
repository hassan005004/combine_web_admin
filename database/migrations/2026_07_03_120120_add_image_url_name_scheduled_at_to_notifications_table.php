<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('message');
            $table->string('name')->nullable()->after('image_url');
            $table->timestamp('scheduled_at')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['image_url', 'name', 'scheduled_at']);
        });
    }
};
