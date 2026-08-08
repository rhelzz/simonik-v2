<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesProgramByKaprog;
use App\Http\Requests\UpdatePlacementRequest;
use App\Models\Classes;
use App\Models\Industry;
use App\Models\Student;
use App\Models\Teacher;
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
        $classId = $request->integer('class_id');
        $industriId = $request->integer('industri_id');
        $teacherId = $request->integer('teacher_id');
        $statusPkl = (string) $request->query('status_pkl', '');
        $validStatus = in_array($statusPkl, ['belum', 'proses', 'selesai'], true);

        $students = $this->programStudents($user)
            ->with([
                'classes:id,name',
                'departements:id,name',
                'industries:id,name,teacher_id',
                'industries.teachers:id,name',
                'teachers:id,name',
            ])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            }))
            ->when($classId > 0, fn ($query) => $query->where('class_id', $classId))
            ->when($industriId > 0, fn ($query) => $query->where('industri_id', $industriId))
            // Guru pembimbing efektif = override siswa (teacher_id) kalau ada,
            // else ikut industries.teacher_id — lihat komentar migrasi kolom.
            ->when($teacherId > 0, fn ($query) => $query->where(function ($query) use ($teacherId): void {
                $query->where('teacher_id', $teacherId)
                    ->orWhere(function ($query) use ($teacherId): void {
                        $query->whereNull('teacher_id')
                            ->whereHas('industries', fn ($q) => $q->where('teacher_id', $teacherId));
                    });
            }))
            ->when($validStatus, fn ($query) => $query->where('status_pkl', $statusPkl))
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
                'teacher_id' => $student->teacher_id,
                'guru' => $student->teacher_id !== null
                    ? $student->teachers?->name
                    : $student->industries?->teachers?->name,
                'status_pkl' => $student->status_pkl,
            ]);

        $industries = Industry::query()
            ->with('teachers:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'teacher_id']);

        return Inertia::render('placements/index', [
            'students' => $students,
            'filters' => [
                'search' => $search,
                'class_id' => $classId > 0 ? $classId : null,
                'industri_id' => $industriId > 0 ? $industriId : null,
                'teacher_id' => $teacherId > 0 ? $teacherId : null,
                'status_pkl' => $validStatus ? $statusPkl : null,
            ],
            'industries' => $industries
                ->map(fn (Industry $industry): array => [
                    'id' => $industry->id,
                    'name' => $industry->name,
                    'guru' => $industry->teachers?->name,
                ])
                ->all(),
            // Kelas dibatasi ke lingkup jurusan kaprog — opsi di luar itu
            // hanya akan menghasilkan daftar kosong (menyaring, bukan
            // membatasi akses; $students sudah discope lewat programStudents()).
            'classOptions' => Classes::query()
                ->whereIn('departemen_id', $this->programDepartemenIds($user))
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Classes $class): array => ['id' => $class->id, 'name' => $class->name])
                ->all(),
            // Guru pembimbing tidak dibatasi ke jurusan — satu industri bisa
            // menerima siswa lintas jurusan, sama seperti $industries di atas.
            'teacherOptions' => $industries
                ->filter(fn (Industry $industry): bool => $industry->teacher_id !== null)
                ->pluck('teachers')
                ->filter()
                ->unique('id')
                ->sortBy('name')
                ->map(fn ($teacher): array => ['id' => $teacher->id, 'name' => $teacher->name])
                ->values()
                ->all(),
            // Industri tanpa guru pembimbing: siswa di sana jadi tak terlihat
            // oleh akun guru manapun (lihat ScopesStudentsByRole) — tampilkan
            // sebagai peringatan di UI. Pembimbing industri boleh kosong
            // (tidak semua industri memakai akun pembimbing), jadi tidak
            // ditandai.
            'unassignedIndustries' => $industries
                ->filter(fn (Industry $industry): bool => $industry->teacher_id === null)
                ->map(fn (Industry $industry): array => [
                    'id' => $industry->id,
                    'name' => $industry->name,
                ])
                ->values()
                ->all(),
            // Opsi dropdown "override" guru pembimbing per-siswa — dibatasi ke
            // jurusan kaprog (beda dari teacherOptions di atas yang lintas
            // jurusan untuk filter tabel).
            'programTeacherOptions' => Teacher::query()
                ->whereIn('departemen_id', $this->programDepartemenIds($user))
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Teacher $teacher): array => ['id' => $teacher->id, 'name' => $teacher->name])
                ->all(),
        ]);
    }

    public function update(UpdatePlacementRequest $request, Student $student): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $departemenIds = $this->programDepartemenIds($user);

        // Siswa harus berada di lingkup program keahlian pengguna.
        abort_unless(\in_array($student->departemen_id, $departemenIds, true), 403);

        $data = $request->validated();

        // Guru pengganti juga harus berada di lingkup program keahlian yang
        // sama — mencegah kaprog menugaskan guru dari jurusan lain.
        if (! empty($data['teacher_id'])) {
            abort_unless(
                Teacher::query()
                    ->whereKey($data['teacher_id'])
                    ->whereIn('departemen_id', $departemenIds)
                    ->exists(),
                403,
            );
        }

        $student->update($data);

        return back()->with('success', "Penempatan {$student->name} berhasil diperbarui.");
    }
}
