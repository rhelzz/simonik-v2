<?php

namespace App\Support;

/**
 * Konstanta bersama untuk impor master data.
 */
final class ImportDefaults
{
    /** Kata sandi default setiap akun yang dibuat lewat impor. */
    public const PASSWORD = 'password';

    /**
     * Nama sheet data pada setiap template impor.
     *
     * Template adalah workbook multi-sheet (Petunjuk / data / Referensi),
     * sedangkan importer hanya boleh membaca sheet datanya. Nama di sini
     * dipakai dua arah — oleh `ImportTemplates` saat membuat sheet dan oleh
     * importer saat memilih sheet — supaya keduanya tidak bisa menyimpang.
     *
     * @var array<string, string>
     */
    public const SHEETS = [
        'siswa' => 'Data Siswa',
        'guru' => 'Data Guru',
        'pembimbing' => 'Data Pembimbing',
        'kaprog' => 'Data Kaprog',
        'wakasek' => 'Data Wakasek',
        'orangtua' => 'Data Orang Tua',
        'industri' => 'Data Industri',
        'kelas' => 'Data Kelas',
        'jurusan' => 'Data Jurusan',
    ];
}
