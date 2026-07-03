<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Campaigns ─────────────────────────────────────────────────────────
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['email', 'sms', 'push'])->default('email');
            $table->enum('status', ['draft', 'scheduled', 'sent', 'cancelled'])->default('draft');
            $table->string('subject')->nullable();          // email subject / push title
            $table->text('body')->nullable();               // content
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('open_count')->default(0);
            $table->unsignedInteger('click_count')->default(0);
            $table->timestamps();
        });

        // ── Referral Program ──────────────────────────────────────────────────
        Schema::create('referral_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('name');
            $table->string('code')->unique();               // shared referral code
            $table->text('description')->nullable();
            $table->string('reward_type')->default('discount'); // discount|credit|free_days
            $table->decimal('reward_value', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('referral_uses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_program_id')->constrained('referral_programs')->onDelete('cascade');
            $table->string('referred_email')->nullable();
            $table->string('referrer_email')->nullable();
            $table->timestamp('used_at')->useCurrent();
            $table->timestamps();
        });

        // ── Affiliate Program ─────────────────────────────────────────────────
        Schema::create('affiliates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('code')->unique();
            $table->decimal('commission_rate', 5, 2)->default(10.00); // percentage
            $table->decimal('total_earned', 10, 2)->default(0);
            $table->decimal('total_paid', 10, 2)->default(0);
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->timestamps();
        });

        Schema::create('affiliate_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_id')->constrained('affiliates')->onDelete('cascade');
            $table->string('customer_email')->nullable();
            $table->decimal('order_amount', 10, 2)->default(0);
            $table->decimal('commission_amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->timestamps();
        });

        // ── Landing Pages ─────────────────────────────────────────────────────
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('headline')->nullable();
            $table->text('subheadline')->nullable();
            $table->longText('content')->nullable();
            $table->string('cta_text')->nullable();
            $table->string('cta_url')->nullable();
            $table->string('hero_image')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->unsignedInteger('view_count')->default(0);
            $table->timestamps();
        });

        // ── Revenue Entries ───────────────────────────────────────────────────
        Schema::create('revenue_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
            $table->string('source');                       // subscriptions|ads|affiliate|other
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('description')->nullable();
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revenue_entries');
        Schema::dropIfExists('landing_pages');
        Schema::dropIfExists('affiliate_conversions');
        Schema::dropIfExists('affiliates');
        Schema::dropIfExists('referral_uses');
        Schema::dropIfExists('referral_programs');
        Schema::dropIfExists('campaigns');
    }
};
