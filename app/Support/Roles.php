<?php

namespace App\Support;

/**
 * Konstanta bersama seputar peran pengguna.
 *
 * Dipakai lintas lapisan (controller, form request, tampilan), karena itu
 * berdiri sendiri — konstanta di dalam trait tidak bisa diakses lewat nama
 * trait-nya.
 */
final class Roles
{
    /**
     * Peran yang tidak boleh dirangkap dengan jabatan kepegawaian.
     *
     * `ScopesStudentsByRole` dan dashboard memilih cakupan data berdasarkan
     * peran, jadi akun siswa yang sekaligus guru akan melihat dirinya sendiri
     * sebagai siswa bimbingan — bahkan bisa masuk ke antrean persetujuannya
     * sendiri.
     *
     * @var array<int, string>
     */
    public const EXCLUSIVE = ['siswa', 'orangtua'];

    /**
     * Peran yang akunnya boleh ditautkan ke jabatan lain.
     *
     * Rangkap jabatan hanya masuk akal untuk staf sekolah — guru pembimbing
     * yang diangkat jadi kaprog, atau wakasek yang juga membimbing. Akun di
     * luar itu (admin, pembimbing industri dari DUDI) dibuat sendiri.
     *
     * @var array<int, string>
     */
    public const LINKABLE = ['guru', 'wakasek'];

    /**
     * Label peran untuk pesan ke operator.
     *
     * @var array<string, string>
     */
    public const LABELS = [
        'admin' => 'Administrator',
        'wakasek' => 'Wakasek',
        'kaprog' => 'Kepala Program',
        'guru' => 'Guru Pembimbing',
        'pembimbing' => 'Pembimbing Industri',
        'siswa' => 'Siswa',
        'orangtua' => 'Orang Tua',
    ];

    /** Label manusiawi sebuah peran; peran tak dikenal dikembalikan apa adanya. */
    public static function label(string $role): string
    {
        return self::LABELS[$role] ?? $role;
    }
}
