<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guru pembimbing per-siswa, opsional. Null = ikut guru pembimbing industri
 * (industries.teacher_id, perilaku default yang sudah ada). Terisi = menimpa
 * turunan itu untuk siswa ini saja — dipakai Plotting & Penempatan agar
 * kaprog bisa memindahkan bimbingan tanpa mengganti industri siswa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->foreignId('teacher_id')->nullable()->after('industri_id')
                ->constrained('teachers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('teacher_id');
        });
    }
};
