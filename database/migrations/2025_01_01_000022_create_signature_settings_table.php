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
        Schema::create('signature_settings', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['kepala_sekolah', 'mitra']);
            $table->string('name');
            $table->string('ttd_path');
            $table->foreignId('department_id')->nullable()->constrained('departemens')->cascadeOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained('industries')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('signature_settings');
    }
};
