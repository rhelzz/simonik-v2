<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\PKLPeriod;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    /**
     * Daftar siswa dengan pencarian & filter kelas.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $classId = $request->integer('class_id');

        $students = Student::query()
            ->where('archived', false)
            ->with(['classes:id,name', 'users:id,email'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('nis', 'like', "%{$search}%");
                });
            })
            ->when($classId > 0, fn ($query) => $query->where('class_id', $classId))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Student $student): array => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'gender' => $student->gender,
                'status_pkl' => $student->status_pkl,
                'class' => $student->classes?->name,
                'email' => $student->users?->email,
                'image' => $student->image,
            ]);

        return Inertia::render('students/index', [
            'students' => $students,
            'classes' => Classes::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'class_id' => $classId > 0 ? $classId : null,
            ],
        ]);
    }

    /**
     * Form tambah siswa.
     */
    public function create(): Response
    {
        return Inertia::render('students/create', [
            'options' => $this->options(),
        ]);
    }

    /**
     * Simpan siswa baru beserta akun loginnya.
     */
    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $data): void {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            $user->assignRole('siswa');

            Student::create([
                ...$this->profileData($data),
                'user_id' => $user->id,
                'image' => $request->file('image')?->store('students', 'public'),
            ]);
        });

        return redirect()
            ->route('students.index')
            ->with('success', 'Siswa berhasil ditambahkan.');
    }

    /**
     * Form edit siswa.
     */
    public function edit(Student $student): Response
    {
        $student->load('users:id,name,email');

        return Inertia::render('students/edit', [
            'student' => [
                'id' => $student->id,
                'name' => $student->users?->name,
                'email' => $student->users?->email,
                'nis' => $student->nis,
                'placeOfBirth' => $student->placeOfBirth,
                'dateOfBirth' => $student->dateOfBirth->format('Y-m-d'),
                'gender' => $student->gender,
                'bloodType' => $student->bloodType,
                'alamat' => $student->alamat,
                'image' => $student->image,
                'status_pkl' => $student->status_pkl,
                'pkl_start' => $student->pkl_start?->format('Y-m-d'),
                'pkl_end' => $student->pkl_end?->format('Y-m-d'),
                'class_id' => $student->class_id,
                'industri_id' => $student->industri_id,
                'departemen_id' => $student->departemen_id,
                'parent_id' => $student->parent_id,
                'p_k_l_period_id' => $student->p_k_l_period_id,
            ],
            'options' => $this->options(),
        ]);
    }

    /**
     * Perbarui siswa & akunnya.
     */
    public function update(UpdateStudentRequest $request, Student $student): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $student, $data): void {
            $student->users?->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            $profile = $this->profileData($data);

            if ($request->hasFile('image')) {
                $this->deleteImage($student);
                $profile['image'] = $request->file('image')?->store('students', 'public');
            }

            $student->update($profile);
        });

        return redirect()
            ->route('students.index')
            ->with('success', 'Data siswa berhasil diperbarui.');
    }

    /**
     * Hapus siswa beserta akunnya.
     */
    public function destroy(Student $student): RedirectResponse
    {
        DB::transaction(function () use ($student): void {
            $this->deleteImage($student);
            // Menghapus user akan cascade ke record siswa (FK onDelete cascade).
            $student->users?->delete();
        });

        return redirect()
            ->route('students.index')
            ->with('success', 'Siswa berhasil dihapus.');
    }

    /**
     * Kolom profil siswa dari data tervalidasi (tanpa akun/relasi user).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function profileData(array $data): array
    {
        return [
            'name' => $data['name'],
            'nis' => $data['nis'],
            'placeOfBirth' => $data['placeOfBirth'],
            'dateOfBirth' => $data['dateOfBirth'],
            'gender' => $data['gender'],
            'bloodType' => $data['bloodType'],
            'alamat' => $data['alamat'],
            'status_pkl' => $data['status_pkl'],
            'pkl_start' => $data['pkl_start'] ?? null,
            'pkl_end' => $data['pkl_end'] ?? null,
            'class_id' => $data['class_id'],
            'industri_id' => $data['industri_id'],
            'departemen_id' => $data['departemen_id'],
            'parent_id' => $data['parent_id'],
            'p_k_l_period_id' => $data['p_k_l_period_id'] ?? null,
        ];
    }

    private function deleteImage(Student $student): void
    {
        $path = $student->getRawOriginal('image');

        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Opsi relasi untuk dropdown form.
     *
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'classes' => Classes::orderBy('name')->get(['id', 'name', 'departemen_id']),
            'departemens' => Departemen::orderBy('name')->get(['id', 'name']),
            'industries' => Industry::orderBy('name')->get(['id', 'name']),
            'parents' => Parents::orderBy('nama')->get(['id', 'nama']),
            'periods' => PKLPeriod::orderBy('name_period')->get(['id', 'name_period']),
        ];
    }
}
