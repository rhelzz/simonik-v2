<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hanya nama + email yang wajib saat membuat siswa. Sisa profil (NIS, data diri,
 * kelas/jurusan/industri/orang tua) dilengkapi belakangan oleh siswa sendiri.
 */
return new class extends Migration
{
    /** @var array<string, string> kolom FK -> tabel tujuan */
    private const FOREIGN = [
        'class_id' => 'classes',
        'industri_id' => 'industries',
        'departemen_id' => 'departemens',
        'parent_id' => 'parents',
    ];

    public function up(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->string('nis')->nullable()->change();
            $table->string('placeOfBirth')->nullable()->change();
            $table->date('dateOfBirth')->nullable()->change();
            $table->string('gender')->nullable()->change();
            $table->string('bloodType')->nullable()->change();
            $table->text('alamat')->nullable()->change();
        });

        // MySQL menolak mengubah kolom yang masih dipakai FK — lepas dulu, pasang lagi.
        foreach (self::FOREIGN as $column => $related) {
            Schema::table('students', function (Blueprint $table) use ($column): void {
                $table->dropForeign([$column]);
            });

            Schema::table('students', function (Blueprint $table) use ($column, $related): void {
                $table->foreignId($column)->nullable()->change();
                $table->foreign($column)->references('id')->on($related)->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Tidak dibalik: mengembalikan NOT NULL akan gagal untuk baris yang kosong.
    }
};
