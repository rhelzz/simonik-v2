<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            // Forum berjudul (v2.5 Fase 28) — tanpa judul, bentuknya feed dan
            // topik lama tidak bisa dicari.
            $table->string('title')->after('user_id');
            $table->boolean('is_closed')->default(false)->after('important');

            // `category` (string tunggal) diganti tag jamak & bebas lewat
            // tabel tags + pivot post_tag. Aman dihapus: tabel posts belum
            // pernah berisi data (diverifikasi count(*) = 0 sebelum migrasi).
            $table->dropColumn('category');

            // Daftar thread selalu diurutkan: sematan dulu, lalu terbaru.
            $table->index(['important', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->dropIndex(['important', 'created_at']);
            $table->string('category')->default('');
            $table->dropColumn(['title', 'is_closed']);
        });
    }
};
