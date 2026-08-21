<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table): void {
            $table->id();

            // cascadeOnDelete (bukan nullOnDelete): pengumuman tanpa pembuat
            // tidak punya makna, dan siapa yang menulisnya adalah bagian dari
            // isinya. Pilihan ditulis eksplisit karena docs/PROGRESS.md §53
            // mencatat bug nyata akibat salah pilih di antara keduanya.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title');
            $table->text('body');

            // Target role. ['*'] = semua pengguna — BUKAN daftar semua role,
            // supaya role baru di masa depan tidak diam-diam dikecualikan dari
            // pengumuman lama.
            $table->json('roles');

            // Tipe date (bukan datetime): presisi jam tidak dibutuhkan dan
            // date bebas dari jebakan timezone yang sudah ada di modul absen.
            $table->date('starts_at');
            $table->date('ends_at');

            $table->timestamps();

            // Kueri dashboard selalu menyaring rentang tanggal lebih dulu.
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
