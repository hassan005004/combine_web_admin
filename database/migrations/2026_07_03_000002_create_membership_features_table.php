<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('membership_features')) {
            Schema::create('membership_features', function (Blueprint $table) {
                $table->id();
                $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
                $table->string('icon')->nullable();
                $table->string('text')->nullable();
                $table->unsignedInteger('sorting')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_features');
    }
};
