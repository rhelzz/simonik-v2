<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\AspekProduktif;
use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Evaluation;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Pembimbing;
use App\Models\PKLPeriod;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    /**
     * Seed master data + sejumlah siswa contoh agar UI langsung terisi.
     */
    public function run(): void
    {
        if (Student::query()->exists()) {
            return;
        }

        $period = PKLPeriod::factory()->create([
            'name_period' => 'Gelombang 1 - 2026',
            'start_period' => '2026-01-06',
            'end_period' => '2026-04-06',
        ]);

        // Kaprog demo memimpin seluruh program keahlian agar dashboard & plotting terisi.
        $kaprog = User::where('email', 'kaprog@simonik.test')->first();

        $departemens = collect([
            'Rekayasa Perangkat Lunak',
            'Teknik Komputer dan Jaringan',
        ])->map(fn (string $name) => Departemen::factory()->create([
            'name' => $name,
            'slug' => Str::slug($name),
            'user_id' => $kaprog?->id,
        ]));

        $classes = $departemens->flatMap(fn (Departemen $dept) => collect(['XII-A', 'XII-B'])
            ->map(fn (string $rom) => Classes::factory()->create([
                'departemen_id' => $dept->id,
                'name' => Str::of($dept->name)->title().' '.$rom,
                'slug' => Str::slug($dept->name.' '.$rom),
            ])));

        $teachers = $departemens->map(fn (Departemen $dept) => Teacher::factory()->create([
            'departemen_id' => $dept->id,
        ]));

        // Tiap industri (PT) diberi guru pembimbing + pembimbing industri.
        $industries = collect(range(1, 3))->map(fn () => Industry::factory()->create([
            'teacher_id' => $teachers->random()->id,
            'pembimbing_id' => Pembimbing::factory()->create()->id,
        ]));

        $aspects = $this->seedAspects();

        /** @var Collection<int, Student> $students */
        $students = collect(range(1, 12))->map(function () use ($departemens, $classes, $industries, $period): Student {
            $dept = $departemens->random();
            $class = $classes->firstWhere('departemen_id', $dept->id);

            $user = User::factory()->create();
            $user->assignRole('siswa');

            return Student::factory()->create([
                'user_id' => $user->id,
                'departemen_id' => $dept->id,
                'class_id' => $class->id,
                'industri_id' => $industries->random()->id,
                'parent_id' => Parents::factory()->create()->id,
                'p_k_l_period_id' => $period->id,
                'image' => null,
            ]);
        });

        // Nilai contoh untuk sebagian siswa agar rekap penilaian langsung terisi.
        foreach ($students->take(6) as $student) {
            foreach ($aspects as $aspek) {
                Evaluation::factory()->create([
                    'student_id' => $student->id,
                    'aspek_produktif_id' => $aspek->id,
                    'score' => fake()->numberBetween(68, 96),
                ]);
            }
        }

        $activeStudents = $students->where('status_pkl', 'proses');
        $this->seedAttendances($activeStudents);
        $this->seedActivities($activeStudents);
    }

    /**
     * Absen kehadiran 5 hari kerja terakhir untuk siswa yang sedang PKL,
     * agar rate dashboard & riwayat absen langsung berisi.
     *
     * @param  Collection<int, Student>  $students
     */
    private function seedAttendances(Collection $students): void
    {
        $today = Carbon::today();

        foreach ($students as $student) {
            foreach (range(0, 6) as $back) {
                $date = $today->copy()->subDays($back);
                if ($date->isWeekend()) {
                    continue;
                }

                Attendance::factory()->create([
                    'user_id' => $student->user_id,
                    'date' => $date->toDateString(),
                    'status' => 'hadir',
                    'arrivalTime' => '07:'.str_pad((string) fake()->numberBetween(10, 50), 2, '0', STR_PAD_LEFT).':00',
                    'departureTime' => $back === 0 ? null : '16:00:00',
                    'absenceReason' => null,
                    'verified' => $back === 0 ? null : '1',
                ]);
            }
        }
    }

    /**
     * Jurnal kegiatan 5 hari kerja terakhir untuk siswa yang sedang PKL, agar
     * rate jurnal dashboard & monitoring Data Jurnal langsung berisi.
     *
     * @param  Collection<int, Student>  $students
     */
    private function seedActivities(Collection $students): void
    {
        $today = Carbon::today();
        $samples = [
            'Membuat tampilan halaman login',
            'Integrasi API data pengguna',
            'Perbaikan bug pada formulir',
            'Riset komponen tabel data',
            'Dokumentasi alur fitur',
        ];

        foreach ($students as $student) {
            foreach (range(0, 6) as $back) {
                $date = $today->copy()->subDays($back);
                if ($date->isWeekend()) {
                    continue;
                }

                Activity::factory()->create([
                    'user_id' => $student->user_id,
                    'judul' => fake()->randomElement($samples),
                    'date' => $date->toDateString(),
                    'verified' => $back === 0 ? null : '1',
                ]);
            }
        }
    }

    /**
     * Master aspek penilaian standar (non-teknis untuk guru, teknis untuk pembimbing).
     *
     * @return Collection<int, AspekProduktif>
     */
    private function seedAspects(): Collection
    {
        $nonTeknis = [
            'Disiplin & kehadiran',
            'Kerja sama tim',
            'Tanggung jawab',
            'Inisiatif & kemandirian',
            'Sopan santun & etika',
        ];

        $teknis = [
            'Penguasaan alat & perangkat',
            'Kualitas hasil kerja',
            'Kecepatan & ketepatan',
            'Pemecahan masalah teknis',
            'Kepatuhan SOP & K3',
        ];

        $aspects = collect();

        foreach ($nonTeknis as $i => $kemampuan) {
            $aspects->push(AspekProduktif::factory()->nonTeknis()->create([
                'no' => $i + 1,
                'kemampuan' => $kemampuan,
            ]));
        }

        foreach ($teknis as $i => $kemampuan) {
            $aspects->push(AspekProduktif::factory()->teknis()->create([
                'no' => $i + 1,
                'kemampuan' => $kemampuan,
            ]));
        }

        return $aspects;
    }
}
