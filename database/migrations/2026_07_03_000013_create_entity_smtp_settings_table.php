<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entity_smtp_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->unique()->constrained('domains')->onDelete('cascade');
            $table->string('admin_email');
            $table->string('host');
            $table->unsignedInteger('port')->default(587);
            $table->string('encryption')->nullable();
            $table->string('username')->nullable();
            $table->text('password')->nullable();
            $table->string('from_email');
            $table->string('from_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_smtp_settings');
    }
};
