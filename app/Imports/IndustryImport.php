<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Teacher;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor Industri. Kolom wajib: Nama, Bidang, Alamat, Longitude, Latitude.
 * Opsional: Radius (default 100), Jam Masuk/Pulang, Durasi, Kuota, Guru
 * Pembimbing & Pembimbing Industri (di-resolve ke id berdasarkan nama). Industri
 * dengan nama sama dilewati.
 */
class IndustryImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
{
    use ImportsRows;

    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        $teachers = $this->lookup(Teacher::query()->pluck('id', 'name'));
        $pembimbings = $this->lookup(Pembimbing::query()->pluck('id', 'name'));
        $existing = Industry::query()->pluck('name')->map(fn ($n) => mb_strtolower(trim((string) $n)))->all();
        $seen = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $get = fn (string $key): string => trim((string) ($row[$key] ?? ''));

            $name = $get('nama');
            $bidang = $get('bidang');
            $alamat = $get('alamat');
            $longitude = $get('longitude');
            $latitude = $get('latitude');

            if ($name === '' || $bidang === '' || $alamat === '' || $longitude === '' || $latitude === '') {
                $this->fail($line, 'Nama, Bidang, Alamat, Longitude, dan Latitude wajib diisi.');

                continue;
            }

            $teacherName = $get('guru_pembimbing');
            $pembimbingName = $get('pembimbing_industri');
            $teacherId = $teacherName === '' ? null : ($teachers[mb_strtolower($teacherName)] ?? null);
            $pembimbingId = $pembimbingName === '' ? null : ($pembimbings[mb_strtolower($pembimbingName)] ?? null);

            if ($teacherName !== '' && $teacherId === null) {
                $this->fail($line, "Guru Pembimbing \"{$teacherName}\" tidak ditemukan.");

                continue;
            }

            if ($pembimbingName !== '' && $pembimbingId === null) {
                $this->fail($line, "Pembimbing Industri \"{$pembimbingName}\" tidak ditemukan.");

                continue;
            }

            $key = mb_strtolower($name);

            if (in_array($key, $existing, true) || in_array($key, $seen, true)) {
                $this->skip($line, "Industri \"{$name}\" sudah ada.");

                continue;
            }

            Industry::create([
                'name' => $name,
                'bidang' => $bidang,
                'alamat' => $alamat,
                'longitude' => $longitude,
                'latitude' => $latitude,
                'radius' => $get('radius') === '' ? 100 : (int) $get('radius'),
                'jam_masuk' => $this->time($get('jam_masuk')),
                'jam_pulang' => $this->time($get('jam_pulang')),
                'duration' => $get('durasi') === '' ? null : $get('durasi'),
                'kuota' => $get('kuota') === '' ? null : (int) $get('kuota'),
                'teacher_id' => $teacherId,
                'pembimbing_id' => $pembimbingId,
            ]);

            $seen[] = $key;
            $this->created++;
        }
    }

    /** Ambil jam dalam format HH:MM dari teks; null bila kosong/tidak valid. */
    private function time(string $value): ?string
    {
        if ($value === '') {
            return null;
        }

        if (preg_match('/^(\d{1,2}):(\d{2})/', $value, $m)) {
            return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
        }

        return null;
    }
}
