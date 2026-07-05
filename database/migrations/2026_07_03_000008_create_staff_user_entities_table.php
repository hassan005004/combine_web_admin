<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('staff_user_entities')) {
            Schema::create('staff_user_entities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
                $table->decimal('share_percent', 8, 2)->default(0);
                $table->timestamps();

                $table->unique(['user_id', 'domain_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_user_entities');
    }
};
