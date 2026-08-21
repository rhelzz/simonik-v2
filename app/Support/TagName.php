<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Bentuk baku sebuah tag forum.
 *
 * Yang merusak "pengelompokan agar tidak bercampur" bukan strukturnya,
 * melainkan ejaannya: tanpa normalisasi, #Absen / #absen / #ABSEN akan jadi
 * tiga kelompok berbeda dalam minggu pertama.
 *
 * Karena itu SELURUH tag wajib melewati fungsi ini sebelum menyentuh
 * database — satu pintu masuk, bukan dinormalkan di tiap pemanggil.
 */
final class TagName
{
    /** Panjang maksimal setelah dinormalkan. */
    public const MAX_LENGTH = 30;

    /**
     * Ubah masukan mentah user jadi nama tag baku.
     *
     * Mengembalikan string kosong bila tidak menyisakan apa pun (mis. user
     * mengetik "###"). Pemanggil membuangnya diam-diam — itu salah ketik,
     * bukan kesalahan yang perlu dijelaskan lewat pesan galat.
     */
    public static function normalise(string $raw): string
    {
        return Str::of($raw)
            ->replaceMatches('/^#+/', '')             // '#' di depan dibuang
            ->lower()
            ->replaceMatches('/[^a-z0-9\-_\s]/u', '') // simbol & emoji dibuang
            ->trim()
            ->replaceMatches('/\s+/', '-')            // spasi jadi tanda hubung
            ->replaceMatches('/-+/', '-')             // '--' rangkap dirapikan
            ->trim('-')
            ->limit(self::MAX_LENGTH, '')
            ->value();
    }
}
