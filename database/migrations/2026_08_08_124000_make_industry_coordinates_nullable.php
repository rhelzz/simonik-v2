<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Koordinat industri boleh dilengkapi belakangan — operator impor/entri
 * manual tidak selalu punya titik lokasi presisi saat data pertama dibuat.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('industries', function (Blueprint $table): void {
            $table->string('longitude')->nullable()->change();
            $table->string('latitude')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Tidak dibalik: mengembalikan NOT NULL akan gagal untuk baris yang kosong.
    }
};
