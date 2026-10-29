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
        Schema::table('guides', function (Blueprint $table) {
            $table->string('dokumen')->nullable()->change();
            $table->string('kategori')->nullable()->after('judul');
            $table->longText('konten')->nullable()->after('deskripsi');
            $table->string('gambar')->nullable()->after('konten');
            $table->string('status', 20)->default('published')->after('gambar');
            $table->integer('urutan')->default(0)->after('status');
            $table->timestamp('published_at')->nullable()->after('urutan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->dropColumn(['kategori', 'konten', 'gambar', 'status', 'urutan', 'published_at']);
            $table->string('dokumen')->nullable(false)->change();
        });
    }
};
