<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('app_memberships')) {
            Schema::create('app_memberships', function (Blueprint $table) {
                $table->id();
                $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
                $table->string('email');
                $table->string('plan')->default('premium');
                $table->boolean('is_active')->default(true);
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();

                $table->unique(['domain_id', 'email']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('app_memberships');
    }
};
