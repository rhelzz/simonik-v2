<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Industri kini hanya container relasi (guru, pembimbing, siswa) — bukan
     * lagi sebuah akun User. Kolom `user_id` dibuang; kontrol industri berpindah
     * ke akun pembimbing industri.
     */
    public function up(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
        });
    }
};
