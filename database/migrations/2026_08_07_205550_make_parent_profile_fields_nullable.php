<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hanya akun login (nama/email/password) yang wajib saat membuat orang tua.
 * Sisa data diri (gender, alamat, pekerjaan, no HP) boleh dicicil — sama
 * seperti keputusan yang sudah diambil untuk siswa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parents', function (Blueprint $table): void {
            $table->string('gender')->nullable()->change();
            $table->text('alamat')->nullable()->change();
            $table->string('occupation')->nullable()->change();
            $table->string('phoneNumber')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Tidak dibalik: mengembalikan NOT NULL akan gagal untuk baris yang kosong.
    }
};
