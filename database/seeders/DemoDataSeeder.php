<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\PKLPeriod;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
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

        $departemens = collect([
            'Rekayasa Perangkat Lunak',
            'Teknik Komputer dan Jaringan',
        ])->map(fn (string $name) => Departemen::factory()->create([
            'name' => $name,
            'slug' => Str::slug($name),
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

        $industries = Industry::factory()->count(3)->create();

        foreach (range(1, 12) as $i) {
            $dept = $departemens->random();
            $class = $classes->firstWhere('departemen_id', $dept->id);
            $teacher = $teachers->firstWhere('departemen_id', $dept->id);

            $user = User::factory()->create();
            $user->assignRole('siswa');

            Student::factory()->create([
                'user_id' => $user->id,
                'departemen_id' => $dept->id,
                'class_id' => $class->id,
                'teacher_id' => $teacher->id,
                'industri_id' => $industries->random()->id,
                'parent_id' => Parents::factory()->create()->id,
                'p_k_l_period_id' => $period->id,
                'image' => null,
            ]);
        }
    }
}
