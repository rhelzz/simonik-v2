<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rekap Penilaian dirombak agar cocok dengan desain ROADMAP:
     * - `aspek_produktifs` menjadi MASTER aspek penilaian (kategori teknis/non-teknis,
     *   nomor urut, kemampuan) yang di-CRUD admin — bukan lagi baris skor per siswa.
     * - `evaluations` menjadi SKOR per siswa per aspek (0-100), grade dihitung dari skor.
     */
    public function up(): void
    {
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('aspek_produktifs');

        Schema::create('aspek_produktifs', function (Blueprint $table) {
            $table->id();
            $table->string('category'); // 'teknis' | 'non_teknis'
            $table->unsignedInteger('no')->default(0);
            $table->string('kemampuan');
            $table->timestamps();
        });

        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('aspek_produktif_id')->constrained('aspek_produktifs')->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->timestamps();

            $table->unique(['student_id', 'aspek_produktif_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('aspek_produktifs');

        Schema::create('aspek_produktifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('industri_id')->constrained('industries')->cascadeOnDelete();
            $table->string('name');
            $table->string('score');
            $table->timestamps();
        });

        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('industri_id')->constrained('industries')->cascadeOnDelete();
            $table->text('skills')->nullable();
            $table->string('score');
            $table->string('disiplinWaktu')->nullable();
            $table->string('kemampuanKerja')->nullable();
            $table->string('kualitasKerja')->nullable();
            $table->string('inisiatif')->nullable();
            $table->string('perilaku')->nullable();
            $table->timestamps();
        });
    }
};
