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
        Schema::table('certificates', function (Blueprint $table) {
            $table->foreignId('certificate_template_id')
                ->nullable()
                ->after('student_id')
                ->constrained('certificate_templates')
                ->nullOnDelete();
            $table->string('title')->nullable()->after('certificate_id');
            $table->dropColumn('file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('certificate_template_id');
            $table->dropColumn('title');
            $table->string('file_path')->default('');
        });
    }
};
