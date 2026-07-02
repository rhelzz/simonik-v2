<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesProgramByKaprog;
use App\Http\Requests\UpdatePlacementRequest;
use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Plotting & Penempatan (Kaprog). Menempatkan siswa di lingkup program keahlian
 * ke industri; guru pembimbing mengikuti guru pembimbing industri terpilih.
 */
class PlacementController extends Controller
{
    use ScopesProgramByKaprog;

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $search = trim((string) $request->query('search', ''));

        $students = $this->programStudents($user)
            ->with([
                'classes:id,name',
                'departements:id,name',
                'industries:id,name,teacher_id',
                'industries.teachers:id,name',
            ])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            }))
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Student $student): array => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'departemen' => $student->departements?->name,
                'industri_id' => $student->industri_id,
                'industry' => $student->industries?->name,
                'guru' => $student->industries?->teachers?->name,
                'status_pkl' => $student->status_pkl,
            ]);

        return Inertia::render('placements/index', [
            'students' => $students,
            'filters' => ['search' => $search],
            'industries' => Industry::query()
                ->with('teachers:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'teacher_id'])
                ->map(fn (Industry $industry): array => [
                    'id' => $industry->id,
                    'name' => $industry->name,
                    'guru' => $industry->teachers?->name,
                ])
                ->all(),
        ]);
    }

    public function update(UpdatePlacementRequest $request, Student $student): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Siswa harus berada di lingkup program keahlian pengguna.
        abort_unless(
            \in_array($student->departemen_id, $this->programDepartemenIds($user), true),
            403,
        );

        $student->update($request->validated());

        return back()->with('success', "Penempatan {$student->name} berhasil diperbarui.");
    }
}
