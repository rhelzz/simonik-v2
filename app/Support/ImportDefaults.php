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
     * Domain baku untuk seluruh akun yang dibuat dari dalam aplikasi.
     *
     * Sengaja konstanta, bukan `config()`: nilainya tidak berubah antar
     * environment. Pindahkan ke `config/` pada hari ada sekolah kedua dengan
     * domain berbeda — bukan sebelumnya.
     */
    public const EMAIL_DOMAIN = 'simonik.local';

    /**
     * Susun email dari username. Nilai yang sudah memuat "@" dibiarkan apa
     * adanya, supaya berkas impor lama yang berisi email lengkap tetap jalan
     * dan operator yang refleks mengetik domain tidak menghasilkan
     * "budi@simonik.local@simonik.local".
     */
    public static function email(string $username): string
    {
        $username = mb_strtolower(trim($username));

        if ($username === '' || str_contains($username, '@')) {
            return $username;
        }

        return $username.'@'.self::EMAIL_DOMAIN;
    }

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
