<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            if (! Schema::hasColumn('campaigns', 'platform')) {
                $table->string('platform')->nullable()->after('type');
            }

            if (! Schema::hasColumn('campaigns', 'objective')) {
                $table->string('objective')->nullable()->after('platform');
            }

            if (! Schema::hasColumn('campaigns', 'budget_amount')) {
                $table->decimal('budget_amount', 10, 2)->default(0)->after('objective');
            }

            if (! Schema::hasColumn('campaigns', 'spent_amount')) {
                $table->decimal('spent_amount', 10, 2)->default(0)->after('budget_amount');
            }

            if (! Schema::hasColumn('campaigns', 'earned_amount')) {
                $table->decimal('earned_amount', 10, 2)->default(0)->after('spent_amount');
            }
        });

        if (! Schema::hasTable('marketing_expenses')) {
            Schema::create('marketing_expenses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('domain_id')->constrained('domains')->onDelete('cascade');
                $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
                $table->string('category')->default('advertising');
                $table->decimal('amount', 10, 2);
                $table->string('currency', 3)->default('PKR');
                $table->string('description')->nullable();
                $table->date('date');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_expenses');

        Schema::table('campaigns', function (Blueprint $table) {
            foreach (['platform', 'objective', 'budget_amount', 'spent_amount', 'earned_amount'] as $column) {
                if (Schema::hasColumn('campaigns', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
