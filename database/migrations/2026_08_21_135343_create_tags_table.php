<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table): void {
            $table->id();

            // Sudah ternormalisasi (huruf kecil, tanpa '#') lewat
            // App\Support\TagName. Unique supaya '#Absen' dan '#absen' tidak
            // pernah jadi dua kelompok berbeda.
            $table->string('name')->unique();

            // Tag saran yang tampil sebagai chip di form. Disimpan sebagai
            // kolom (bukan konstanta PHP) supaya admin bisa mengubah
            // daftarnya tanpa deploy ulang.
            $table->boolean('is_suggested')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
