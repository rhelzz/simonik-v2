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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('nis');
            $table->string('placeOfBirth');
            $table->date('dateOfBirth');
            $table->string('gender');
            $table->string('bloodType');
            $table->text('alamat');
            $table->string('image');

            // NOTE: kolom FK kelas bernama `class_id` mengikuti migration backend asli.
            // Model Student lama mereferensikan `classes_id` (bug latent) — sesuaikan saat porting model.
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('industri_id')->constrained('industries')->cascadeOnDelete();
            $table->foreignId('departemen_id')->constrained('departemens')->cascadeOnDelete();
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();

            $table->boolean('archived')->default(false);
            $table->enum('status_pkl', ['belum', 'proses', 'selesai'])->default('belum');
            $table->string('sertifikat_url')->nullable();
            $table->date('pkl_start')->nullable();
            $table->date('pkl_end')->nullable();
            $table->foreignId('p_k_l_period_id')->nullable()->constrained('p_k_l_periods')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
