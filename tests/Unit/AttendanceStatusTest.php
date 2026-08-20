<?php

namespace Tests\Unit;

use App\Support\AttendanceStatus;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;

/**
 * v2.4 Fase 27 — Alpha turunan.
 *
 * Semua test menyuntikkan "hari ini" secara eksplisit; tanpa itu suite akan
 * lulus pada hari Selasa dan gagal pada hari Sabtu.
 */
class AttendanceStatusTest extends TestCase
{
    /** Rabu — hari kerja, dipakai sebagai "hari ini" di sebagian besar test. */
    private function today(): Carbon
    {
        return Carbon::parse('2026-08-19');
    }

    public function test_past_workday_without_record_is_alpha(): void
    {
        $status = AttendanceStatus::for(
            null,
            Carbon::parse('2026-08-18'), // Selasa
            null,
            null,
            $this->today(),
        );

        $this->assertSame(AttendanceStatus::ALPHA, $status);
    }

    public function test_today_without_record_is_not_alpha(): void
    {
        $status = AttendanceStatus::for(null, $this->today(), null, null, $this->today());

        $this->assertSame(AttendanceStatus::BELUM, $status);
    }

    public function test_future_date_without_record_is_not_alpha(): void
    {
        $status = AttendanceStatus::for(
            null,
            Carbon::parse('2026-08-25'),
            null,
            null,
            $this->today(),
        );

        $this->assertSame(AttendanceStatus::BELUM, $status);
    }

    public function test_past_weekend_is_not_counted(): void
    {
        foreach (['2026-08-15', '2026-08-16'] as $weekend) { // Sabtu, Minggu
            $status = AttendanceStatus::for(
                null,
                Carbon::parse($weekend),
                null,
                null,
                $this->today(),
            );

            $this->assertSame(
                AttendanceStatus::TIDAK_DIHITUNG,
                $status,
                "Tanggal {$weekend} seharusnya tidak dihitung.",
            );
        }
    }

    public function test_date_before_pkl_start_is_not_counted(): void
    {
        $status = AttendanceStatus::for(
            null,
            Carbon::parse('2026-08-17'), // Senin, tapi PKL baru mulai besoknya
            Carbon::parse('2026-08-18'),
            null,
            $this->today(),
        );

        $this->assertSame(AttendanceStatus::TIDAK_DIHITUNG, $status);
    }

    public function test_date_after_pkl_end_is_not_counted(): void
    {
        $status = AttendanceStatus::for(
            null,
            Carbon::parse('2026-08-18'),
            Carbon::parse('2026-08-01'),
            Carbon::parse('2026-08-17'),
            $this->today(),
        );

        $this->assertSame(AttendanceStatus::TIDAK_DIHITUNG, $status);
    }

    public function test_pkl_period_boundaries_are_inclusive(): void
    {
        $start = Carbon::parse('2026-08-17'); // Senin
        $end = Carbon::parse('2026-08-18');   // Selasa

        $this->assertSame(
            AttendanceStatus::ALPHA,
            AttendanceStatus::for(null, $start->copy(), $start, $end, $this->today()),
        );
        $this->assertSame(
            AttendanceStatus::ALPHA,
            AttendanceStatus::for(null, $end->copy(), $start, $end, $this->today()),
        );
    }

    /**
     * Siswa tanpa tanggal PKL sama sekali tetap dapat Alpha — data profil yang
     * belum lengkap tidak boleh diam-diam mematikan fitur ini.
     */
    public function test_student_without_pkl_period_still_gets_alpha(): void
    {
        $status = AttendanceStatus::for(
            null,
            Carbon::parse('2026-08-18'),
            null,
            null,
            $this->today(),
        );

        $this->assertSame(AttendanceStatus::ALPHA, $status);
    }

    /**
     * INTI: baris nyata selalu menang. Kalau ini rusak, siswa sakit yang
     * approval-nya sudah lengkap akan ditandai Alpha.
     */
    public function test_existing_record_wins_over_derivation(): void
    {
        foreach (['hadir', 'sakit', 'izin', 'libur'] as $recorded) {
            $status = AttendanceStatus::for(
                $recorded,
                Carbon::parse('2026-08-18'),
                null,
                null,
                $this->today(),
            );

            $this->assertSame($recorded, $status);
        }
    }

    public function test_recorded_status_is_normalised_to_lowercase(): void
    {
        $status = AttendanceStatus::for(
            'HADIR',
            Carbon::parse('2026-08-18'),
            null,
            null,
            $this->today(),
        );

        $this->assertSame('hadir', $status);
    }

    public function test_labels_cover_every_derived_status(): void
    {
        $this->assertSame('Alpha', AttendanceStatus::label(AttendanceStatus::ALPHA));
        $this->assertSame('Belum presensi', AttendanceStatus::label(AttendanceStatus::BELUM));
        $this->assertSame('Tidak dihitung', AttendanceStatus::label(AttendanceStatus::TIDAK_DIHITUNG));
        $this->assertSame('Hadir', AttendanceStatus::label('masuk'));
        $this->assertSame('Tercatat', AttendanceStatus::label('status-yang-belum-dikenal'));
    }
}
