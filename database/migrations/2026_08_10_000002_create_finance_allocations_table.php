<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('finance_allocations')) {
            Schema::create('finance_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('allocation_type', 20);
                $table->unsignedBigInteger('source_id');
                $table->string('mode', 20)->default('percentage');
                $table->decimal('percentage', 8, 2)->nullable();
                $table->decimal('amount', 12, 2)->default(0);
                $table->string('notes')->nullable();
                $table->timestamps();

                $table->unique(['allocation_type', 'source_id', 'user_id'], 'finance_alloc_source_user_unique');
                $table->index(['domain_id', 'allocation_type', 'source_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_allocations');
    }
};
