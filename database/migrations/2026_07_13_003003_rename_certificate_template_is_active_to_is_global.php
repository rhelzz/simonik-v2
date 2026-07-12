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
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->renameColumn('is_active', 'is_global');
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->unique(['student_id', 'certificate_template_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropUnique(['student_id', 'certificate_template_id']);
        });

        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->renameColumn('is_global', 'is_active');
        });
    }
};
