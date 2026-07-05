<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('entry_notes')) {
            Schema::create('entry_notes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('title')->nullable();
                $table->text('body');
                $table->enum('visibility', ['only_me', 'all'])->default('only_me');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_notes');
    }
};
