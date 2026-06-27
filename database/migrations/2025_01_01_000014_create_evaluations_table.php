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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
