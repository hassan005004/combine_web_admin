<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            if (! Schema::hasColumn('domains', 'billing_settings')) {
                $table->json('billing_settings')->nullable()->after('ads_settings');
            }
        });

        Schema::table('membership_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('membership_plans', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('yearly_price');
            }

            if (! Schema::hasColumn('membership_plans', 'yearly_free_months')) {
                $table->unsignedTinyInteger('yearly_free_months')->default(0)->after('free_trial_days');
            }

            if (! Schema::hasColumn('membership_plans', 'google_play_monthly_product_id')) {
                $table->string('google_play_monthly_product_id')->nullable()->after('yearly_benefit');
            }

            if (! Schema::hasColumn('membership_plans', 'google_play_monthly_base_plan_id')) {
                $table->string('google_play_monthly_base_plan_id')->nullable()->after('google_play_monthly_product_id');
            }

            if (! Schema::hasColumn('membership_plans', 'google_play_monthly_offer_id')) {
                $table->string('google_play_monthly_offer_id')->nullable()->after('google_play_monthly_base_plan_id');
            }

            if (! Schema::hasColumn('membership_plans', 'google_play_yearly_product_id')) {
                $table->string('google_play_yearly_product_id')->nullable()->after('google_play_monthly_offer_id');
            }

            if (! Schema::hasColumn('membership_plans', 'google_play_yearly_base_plan_id')) {
                $table->string('google_play_yearly_base_plan_id')->nullable()->after('google_play_yearly_product_id');
            }

            if (! Schema::hasColumn('membership_plans', 'google_play_yearly_offer_id')) {
                $table->string('google_play_yearly_offer_id')->nullable()->after('google_play_yearly_base_plan_id');
            }

            if (! Schema::hasColumn('membership_plans', 'country_prices')) {
                $table->json('country_prices')->nullable()->after('google_play_yearly_offer_id');
            }
        });

        Schema::table('app_memberships', function (Blueprint $table) {
            if (Schema::hasColumn('app_memberships', 'email')) {
                $table->string('email')->nullable()->change();
            }

            if (! Schema::hasColumn('app_memberships', 'provider')) {
                $table->string('provider')->default('manual')->after('amount_paid');
            }

            if (! Schema::hasColumn('app_memberships', 'status')) {
                $table->string('status')->default('active')->after('provider');
            }

            if (! Schema::hasColumn('app_memberships', 'purchase_token_hash')) {
                $table->string('purchase_token_hash', 64)->nullable()->after('status');
                $table->index(['domain_id', 'purchase_token_hash']);
            }

            if (! Schema::hasColumn('app_memberships', 'purchase_token')) {
                $table->text('purchase_token')->nullable()->after('purchase_token_hash');
            }

            if (! Schema::hasColumn('app_memberships', 'order_id')) {
                $table->string('order_id')->nullable()->after('purchase_token');
            }

            if (! Schema::hasColumn('app_memberships', 'product_id')) {
                $table->string('product_id')->nullable()->after('order_id');
            }

            if (! Schema::hasColumn('app_memberships', 'base_plan_id')) {
                $table->string('base_plan_id')->nullable()->after('product_id');
            }

            if (! Schema::hasColumn('app_memberships', 'offer_id')) {
                $table->string('offer_id')->nullable()->after('base_plan_id');
            }

            if (! Schema::hasColumn('app_memberships', 'country_code')) {
                $table->string('country_code', 2)->nullable()->after('offer_id');
            }

            if (! Schema::hasColumn('app_memberships', 'currency')) {
                $table->string('currency', 3)->nullable()->after('country_code');
            }

            if (! Schema::hasColumn('app_memberships', 'grace_expires_at')) {
                $table->timestamp('grace_expires_at')->nullable()->after('expires_at');
            }

            if (! Schema::hasColumn('app_memberships', 'trial_started_at')) {
                $table->timestamp('trial_started_at')->nullable()->after('grace_expires_at');
            }

            if (! Schema::hasColumn('app_memberships', 'last_verified_at')) {
                $table->timestamp('last_verified_at')->nullable()->after('trial_started_at');
            }

            if (! Schema::hasColumn('app_memberships', 'raw_purchase')) {
                $table->json('raw_purchase')->nullable()->after('last_verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('app_memberships', function (Blueprint $table) {
            if (Schema::hasColumn('app_memberships', 'purchase_token_hash')) {
                $table->dropIndex(['domain_id', 'purchase_token_hash']);
            }

            if (Schema::hasColumn('app_memberships', 'email')) {
                $table->string('email')->nullable(false)->change();
            }

            $columns = array_values(array_filter([
                Schema::hasColumn('app_memberships', 'provider') ? 'provider' : null,
                Schema::hasColumn('app_memberships', 'status') ? 'status' : null,
                Schema::hasColumn('app_memberships', 'purchase_token_hash') ? 'purchase_token_hash' : null,
                Schema::hasColumn('app_memberships', 'purchase_token') ? 'purchase_token' : null,
                Schema::hasColumn('app_memberships', 'order_id') ? 'order_id' : null,
                Schema::hasColumn('app_memberships', 'product_id') ? 'product_id' : null,
                Schema::hasColumn('app_memberships', 'base_plan_id') ? 'base_plan_id' : null,
                Schema::hasColumn('app_memberships', 'offer_id') ? 'offer_id' : null,
                Schema::hasColumn('app_memberships', 'country_code') ? 'country_code' : null,
                Schema::hasColumn('app_memberships', 'currency') ? 'currency' : null,
                Schema::hasColumn('app_memberships', 'grace_expires_at') ? 'grace_expires_at' : null,
                Schema::hasColumn('app_memberships', 'trial_started_at') ? 'trial_started_at' : null,
                Schema::hasColumn('app_memberships', 'last_verified_at') ? 'last_verified_at' : null,
                Schema::hasColumn('app_memberships', 'raw_purchase') ? 'raw_purchase' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('membership_plans', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('membership_plans', 'currency') ? 'currency' : null,
                Schema::hasColumn('membership_plans', 'yearly_free_months') ? 'yearly_free_months' : null,
                Schema::hasColumn('membership_plans', 'google_play_monthly_product_id') ? 'google_play_monthly_product_id' : null,
                Schema::hasColumn('membership_plans', 'google_play_monthly_base_plan_id') ? 'google_play_monthly_base_plan_id' : null,
                Schema::hasColumn('membership_plans', 'google_play_monthly_offer_id') ? 'google_play_monthly_offer_id' : null,
                Schema::hasColumn('membership_plans', 'google_play_yearly_product_id') ? 'google_play_yearly_product_id' : null,
                Schema::hasColumn('membership_plans', 'google_play_yearly_base_plan_id') ? 'google_play_yearly_base_plan_id' : null,
                Schema::hasColumn('membership_plans', 'google_play_yearly_offer_id') ? 'google_play_yearly_offer_id' : null,
                Schema::hasColumn('membership_plans', 'country_prices') ? 'country_prices' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('domains', function (Blueprint $table) {
            if (Schema::hasColumn('domains', 'billing_settings')) {
                $table->dropColumn('billing_settings');
            }
        });
    }
};
