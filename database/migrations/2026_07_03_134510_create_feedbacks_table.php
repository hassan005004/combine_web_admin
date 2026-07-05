<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Feedback / Bug Reports
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->enum('type', ['feedback', 'bug'])->default('feedback');
            $table->string('email')->nullable();
            $table->string('subject')->nullable();
            $table->text('body');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });

        // Feature Requests
        Schema::create('feature_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('email')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'under_review', 'planned', 'in_progress', 'completed', 'rejected'])->default('pending');
            $table->unsignedInteger('votes')->default(0);
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_requests');
        Schema::dropIfExists('feedbacks');
    }
};
