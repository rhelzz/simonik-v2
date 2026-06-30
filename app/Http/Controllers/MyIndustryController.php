<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SummarizesStudentPerformance;
use App\Http\Requests\UpdateMyIndustryRequest;
use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Industri Saya" — pembimbing industri mengelola profil industrinya sendiri
 * dan memantau performa anak magangnya (rekap berbasis hitungan).
 */
class MyIndustryController extends Controller
{
    use SummarizesStudentPerformance;

    /**
     * Profil industri milik pembimbing + roster anak magang beserta rekap.
     */
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $industry = $this->resolveIndustry($user);

        return Inertia::render('my-industry/show', [
            'industry' => $industry === null ? null : [
                'id' => $industry->id,
                'name' => $industry->name,
                'bidang' => $industry->bidang,
                'alamat' => $industry->alamat,
                'longitude' => $industry->longitude,
                'latitude' => $industry->latitude,
                'radius' => $industry->radius,
                'jam_masuk' => $industry->jam_masuk ? substr($industry->jam_masuk, 0, 5) : null,
                'jam_pulang' => $industry->jam_pulang ? substr($industry->jam_pulang, 0, 5) : null,
                'duration' => $industry->duration,
                'guru' => $industry->teachers?->name,
            ],
            'roster' => $industry === null ? [] : $this->roster($industry),
        ]);
    }

    /**
     * Form edit profil industri sendiri.
     */
    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $industry = $this->resolveIndustry($user);
        abort_if($industry === null, 404);

        return Inertia::render('my-industry/edit', [
            'industry' => [
                'id' => $industry->id,
                'name' => $industry->name,
                'bidang' => $industry->bidang,
                'alamat' => $industry->alamat,
                'longitude' => $industry->longitude,
                'latitude' => $industry->latitude,
                'radius' => $industry->radius,
                'jam_masuk' => $industry->jam_masuk ? substr($industry->jam_masuk, 0, 5) : null,
                'jam_pulang' => $industry->jam_pulang ? substr($industry->jam_pulang, 0, 5) : null,
                'duration' => $industry->duration,
            ],
        ]);
    }

    /**
     * Perbarui profil industri sendiri.
     */
    public function update(UpdateMyIndustryRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $industry = $this->resolveIndustry($user);
        abort_if($industry === null, 404);

        $industry->update($request->validated());

        return redirect()
            ->route('my-industry.show')
            ->with('success', 'Profil industri berhasil diperbarui.');
    }

    /**
     * Industri yang dipegang pembimbing yang sedang login (atau null).
     */
    private function resolveIndustry(User $user): ?Industry
    {
        $pembimbingId = $user->pembimbing?->id;

        if ($pembimbingId === null) {
            return null;
        }

        return Industry::query()
            ->with('teachers:id,name')
            ->where('pembimbing_id', $pembimbingId)
            ->first();
    }

    /**
     * Daftar anak magang di industri ini + rekap performa tiap murid.
     *
     * @return array<int, array<string, mixed>>
     */
    private function roster(Industry $industry): array
    {
        return Student::query()
            ->where('industri_id', $industry->id)
            ->with(['classes:id,name', 'pkl_period:id,start_period,end_period'])
            ->orderBy('name')
            ->get()
            ->map(fn (Student $student): array => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'status_pkl' => $student->status_pkl,
                'performance' => $this->performance($student),
            ])
            ->all();
    }
}
