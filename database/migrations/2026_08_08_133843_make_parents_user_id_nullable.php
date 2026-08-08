<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Orang tua boleh dibuat tanpa akun login (hanya nama yang wajib) — akun
 * email/password dilengkapi belakangan bila diperlukan.
 */
return new class extends Migration
{
    public function up(): void
    {
        // MySQL menolak mengubah kolom yang masih dipakai FK — lepas dulu, pasang lagi.
        Schema::table('parents', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
        });

        Schema::table('parents', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        // Tidak dibalik: mengembalikan NOT NULL akan gagal untuk baris yang kosong.
    }
};
