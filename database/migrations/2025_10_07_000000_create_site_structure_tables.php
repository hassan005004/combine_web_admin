<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ------------------------------
        // domains table
        // ------------------------------
        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('url')->nullable();
            $table->string('application_id')->nullable();
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();
            $table->string('primary_color', 7)->comment('Hex color with hash, e.g. #FFFFFF');
            $table->string('secondary_color', 7)->comment('Hex color with hash, e.g. #000000');
            $table->timestamps();
        });

        // ------------------------------
        // pages table
        // ------------------------------
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamps();
        });

        // ------------------------------
        // faqs table
        // ------------------------------
        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('slug')->unique();
            $table->string('question');
            $table->text('answer');
            $table->integer('sorting')->default(0);
            $table->timestamps();
        });

        // ------------------------------
        // content table
        // ------------------------------
        Schema::create('content', function (Blueprint $table) {
            $table->id();
            $table->string('section_id')->nullable();
            $table->string('slug')->unique();
            $table->string('heading');
            $table->longText('content')->nullable();
            $table->timestamps();
        });

        // ------------------------------
        // settings table
        // ------------------------------
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // ------------------------------
        // notification Settings table
        // ------------------------------
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('services_file');
            $table->string('token')->nullable();
            $table->timestamp('token_expiry')->nullable();
            $table->timestamps();
        });

        // ------------------------------
        // user_devices table
        // ------------------------------
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('device_id');
            $table->string('fcm_token');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('notification_settings');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('content');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('domains');
    }
};
