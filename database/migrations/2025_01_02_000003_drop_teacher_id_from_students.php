<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guru pembimbing siswa kini diturunkan dari industrinya
     * (`students.industri_id` → `industries.teacher_id`), jadi kolom langsung
     * `students.teacher_id` tidak lagi dipakai.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('teacher_id')->nullable()->after('class_id')->constrained('teachers')->cascadeOnDelete();
        });
    }
};
