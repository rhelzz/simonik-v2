<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

/**
 * Tag saran awal.
 *
 * Bukan pembatas — user tetap bebas mengetik tag baru. Gunanya menghindari
 * layar kosong tanpa arah saat orang pertama kali menulis: tanpa saran, tiap
 * orang mengarang istilahnya sendiri dan pengelompokannya berantakan sejak
 * hari pertama.
 *
 * Admin bisa menambah/mencabut status saran lewat halaman Kelola Tag Forum,
 * jadi daftar ini hanya titik awal — bukan daftar yang harus diubah lewat
 * deploy.
 */
class TagSeeder extends Seeder
{
    /** @var array<int, string> */
    private const SUGGESTED = [
        'ask',
        'feedback',
        'absen',
        'jurnal',
        'industri',
        'sidang',
        'info',
    ];

    public function run(): void
    {
        foreach (self::SUGGESTED as $name) {
            Tag::updateOrCreate(['name' => $name], ['is_suggested' => true]);
        }
    }
}
