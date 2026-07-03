<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('membership_plans')) {
            Schema::create('membership_plans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
                $table->string('name');
                $table->decimal('monthly_price', 10, 2)->default(0);
                $table->decimal('yearly_price', 10, 2)->default(0);
                $table->string('tagline')->nullable();
                $table->string('yearly_benefit')->nullable();
                $table->unsignedInteger('sorting')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
