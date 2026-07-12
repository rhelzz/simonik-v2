<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->string('scope')->default('individual')->after('name');
            $table->foreignId('industry_id')->nullable()->after('scope')->constrained()->cascadeOnDelete();
        });

        DB::table('certificate_templates')->where('is_global', true)->update(['scope' => 'global']);

        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->dropColumn('is_global');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->boolean('is_active')->default(false);
        });

        DB::table('certificate_templates')->where('scope', 'global')->update(['is_active' => true]);

        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('industry_id');
            $table->dropColumn('scope');
        });
    }
};
