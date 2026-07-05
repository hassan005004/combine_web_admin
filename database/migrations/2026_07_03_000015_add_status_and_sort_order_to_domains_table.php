<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            if (! Schema::hasColumn('domains', 'status')) {
                $table->string('status', 20)->default('pending')->after('entry_type');
            }

            if (! Schema::hasColumn('domains', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0)->after('status');
            }
        });

        $domains = \Illuminate\Support\Facades\DB::table('domains')
            ->orderBy('title')
            ->pluck('id');

        foreach ($domains as $index => $id) {
            \Illuminate\Support\Facades\DB::table('domains')
                ->where('id', $id)
                ->update(['sort_order' => $index + 1]);
        }
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            foreach (['sort_order', 'status'] as $column) {
                if (Schema::hasColumn('domains', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
