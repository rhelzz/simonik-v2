<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * Status efektif satu (siswa, tanggal).
 *
 * Semua status lain di sistem lahir dari sebuah PERISTIWA: 'hadir' dari siswa
 * menekan tombol, 'sakit'/'izin'/'libur' dari approval, 'proxy' dari guru.
 * **Alpha satu-satunya yang lahir dari ketiadaan peristiwa** — tidak ada yang
 * menekan apa pun. Karena itu ia diturunkan saat dibaca, bukan disimpan
 * sebagai baris.
 *
 * Konsekuensi yang membuat pilihan ini benar: koreksi terlambat (approval
 * sakit yang baru disetujui 3 hari kemudian, presensi yang diwakilkan guru)
 * otomatis menghapus Alpha — tidak ada baris yang perlu dibersihkan, dan
 * tidak ada jalur penulisan absen yang perlu tahu cara membersihkannya.
 *
 * Parameternya nilai, bukan model, supaya bisa diuji tanpa database dan tidak
 * diam-diam memicu kueri relasi di dalam perulangan.
 */
final class AttendanceStatus
{
    /** Tidak ada data absen pada hari kerja yang sudah lewat. */
    public const ALPHA = 'alpha';

    /** Belum ada data absen, tapi harinya belum selesai — bukan Alpha. */
    public const BELUM = 'belum';

    /** Sudah absen masuk, tetapi jam pulang belum dilengkapi. */
    public const BELUM_LENGKAP = 'belum-lengkap';

    /** Hari yang memang tidak dihitung: akhir pekan / di luar periode PKL. */
    public const TIDAK_DIHITUNG = 'tidak-dihitung';

    /**
     * Satu kamus label untuk seluruh aplikasi — status tersimpan maupun
     * turunan. Dipetakan di backend sesuai konvensi proyek.
     *
     * @var array<string, string>
     */
    public const LABELS = [
        'hadir' => 'Hadir',
        'masuk' => 'Hadir',
        'sakit' => 'Sakit',
        'izin' => 'Izin',
        'libur' => 'Libur',
        self::ALPHA => 'Alpha',
        self::BELUM => 'Belum presensi',
        self::BELUM_LENGKAP => 'Belum lengkap',
        self::TIDAK_DIHITUNG => 'Tidak dihitung',
    ];

    /**
     * Status efektif: status tersimpan bila ada, selain itu diturunkan.
     *
     * @param  string|null  $recordedStatus  status dari baris attendances, null bila tidak ada
     * @param  CarbonInterface|null  $pklStart  awal PKL efektif siswa (boleh null)
     * @param  CarbonInterface|null  $pklEnd  akhir PKL efektif siswa (boleh null)
     * @param  CarbonInterface|null  $today  disuntik hanya untuk test
     */
    public static function for(
        ?string $recordedStatus,
        CarbonInterface $date,
        ?CarbonInterface $pklStart = null,
        ?CarbonInterface $pklEnd = null,
        ?CarbonInterface $today = null,
    ): string {
        // Baris nyata selalu menang. Siswa sakit/izin/libur SUDAH tercatat dan
        // tidak boleh berubah jadi Alpha hanya karena statusnya bukan 'hadir'.
        if ($recordedStatus !== null && $recordedStatus !== '') {
            return mb_strtolower($recordedStatus);
        }

        $today ??= Carbon::today();

        // Hari berjalan (dan masa depan) TIDAK PERNAH Alpha. Tanpa aturan ini
        // seluruh sekolah tampil "Alpha" tiap pagi sampai mereka absen satu
        // per satu, dan panelnya berhenti dibaca orang.
        if (! $date->startOfDay()->lessThan($today->copy()->startOfDay())) {
            return self::BELUM;
        }

        if ($date->isWeekend()) {
            return self::TIDAK_DIHITUNG;
        }

        // Sebelum PKL dimulai / sesudah selesai bukan kelalaian siswa.
        if ($pklStart !== null && $date->startOfDay()->lessThan($pklStart->copy()->startOfDay())) {
            return self::TIDAK_DIHITUNG;
        }

        if ($pklEnd !== null && $date->startOfDay()->greaterThan($pklEnd->copy()->startOfDay())) {
            return self::TIDAK_DIHITUNG;
        }

        return self::ALPHA;
    }

    /**
     * Label siap tampil untuk sebuah status (tersimpan atau turunan).
     */
    public static function label(string $status): string
    {
        return self::LABELS[mb_strtolower($status)] ?? 'Tercatat';
    }
}
