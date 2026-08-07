<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Exports\StudentsTemplateExport;
use App\Http\Controllers\Concerns\HandlesImportExport;
use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Http\Requests\BulkDestroyStudentRequest;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Imports\StudentsImport;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\PKLPeriod;
use App\Models\Student;
use App\Models\User;
use App\Support\ImportSpecs;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StudentController extends Controller
{
    use HandlesImportExport;
    use ScopesStudentsByRole;

    /**
     * Pastikan siswa berada dalam cakupan pemanggil.
     *
     * Semua aksi per-siswa memakai route model binding, sehingga tanpa
     * penjagaan ini seorang kaprog bisa membuka siswa jurusan lain hanya
     * dengan menebak id di URL.
     */
    private function authorizeStudent(Request $request, Student $student): void
    {
        abort_unless($this->canManageStudent($request, $student), 403);
    }

    /**
     * Versi boolean dari penjagaan di atas, dipakai hapus massal agar id di
     * luar cakupan bisa dilaporkan sebagai "dilewati" alih-alih menggagalkan
     * seluruh operasi. Satu sumber aturan, bukan dua salinan yang bisa
     * menyimpang.
     */
    private function canManageStudent(Request $request, Student $student): bool
    {
        /** @var User $user */
        $user = $request->user();

        return $this->scopedStudents($user)->whereKey($student->id)->exists();
    }

    /**
     * Daftar siswa dengan pencarian & filter kelas.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $classId = $request->integer('class_id');
        $industriId = $request->integer('industri_id');
        $statusPkl = (string) $request->query('status_pkl', '');
        $validStatuses = ['belum', 'proses', 'selesai'];
        $statusPkl = in_array($statusPkl, $validStatuses, true) ? $statusPkl : '';

        /** @var User $user */
        $user = $request->user();

        $students = $this->scopedStudents($user)
            ->where('archived', false)
            ->with(['classes:id,name', 'users:id,email', 'industries:id,name'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('nis', 'like', "%{$search}%");
                });
            })
            ->when($classId > 0, fn ($query) => $query->where('class_id', $classId))
            ->when($industriId > 0, fn ($query) => $query->where('industri_id', $industriId))
            ->when($statusPkl !== '', fn ($query) => $query->where('status_pkl', $statusPkl))
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
                'industri' => $student->industries?->name,
                'email' => $student->users?->email,
                'image' => $student->image,
            ]);

        return Inertia::render('students/index', [
            'students' => $students,
            'classes' => Classes::orderBy('name')->get(['id', 'name']),
            'industries' => Industry::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'class_id' => $classId > 0 ? $classId : null,
                'industri_id' => $industriId > 0 ? $industriId : null,
                'status_pkl' => $statusPkl !== '' ? $statusPkl : null,
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
    public function edit(Request $request, Student $student): Response
    {
        $this->authorizeStudent($request, $student);

        $student->load('users:id,name,email');

        return Inertia::render('students/edit', [
            'student' => [
                'id' => $student->id,
                'name' => $student->users?->name,
                'email' => $student->users?->email,
                'nis' => $student->nis,
                'placeOfBirth' => $student->placeOfBirth,
                'dateOfBirth' => $student->dateOfBirth?->format('Y-m-d'),
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
        $this->authorizeStudent($request, $student);

        $data = $request->validated();

        DB::transaction(function () use ($request, $student, $data): void {
            $userUpdate = [
                'name' => $data['name'],
                'email' => $data['email'],
            ];

            if (! empty($data['password'])) {
                $userUpdate['password'] = Hash::make($data['password']);
            }

            $student->users?->update($userUpdate);

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
     * Detail siswa lengkap dengan relasi.
     */
    public function show(Request $request, Student $student): Response
    {
        $this->authorizeStudent($request, $student);

        $student->load([
            'users:id,name,email',
            'classes:id,name',
            'departements:id,name',
            'industries:id,name,teacher_id,pembimbing_id',
            'industries.teachers:id,name,no_hp',
            'industries.pembimbingNormatif:id,name,no_hp',
            'parents:id,nama,phoneNumber',
        ]);

        $industry = $student->industries;
        $teacher = $industry?->teachers;
        $pembimbing = $industry?->pembimbingNormatif;

        return Inertia::render('students/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->users?->name,
                'email' => $student->users?->email,
                'nis' => $student->nis,
                'gender' => $student->gender,
                'placeOfBirth' => $student->placeOfBirth,
                'dateOfBirth' => $student->dateOfBirth?->format('d F Y'),
                'bloodType' => $student->bloodType,
                'alamat' => $student->alamat,
                'status_pkl' => $student->status_pkl,
                'pkl_start' => $student->pkl_start?->format('d F Y'),
                'pkl_end' => $student->pkl_end?->format('d F Y'),
            ],
            'relations' => [
                'class' => $student->classes?->name,
                'departemen' => $student->departements?->name,
                'industri' => $student->industries->name ?? '—',
                'guru_pembimbing' => $teacher ? $teacher->name.' ('.$teacher->no_hp.')' : '—',
                'pembimbing_industri' => $pembimbing ? $pembimbing->name.' ('.$pembimbing->no_hp.')' : '—',
                'orang_tua' => $student->parents ? $student->parents->nama.' ('.$student->parents->phoneNumber.')' : '—',
            ],
        ]);
    }

    /**
     * Hapus siswa beserta akunnya.
     */
    public function destroy(Request $request, Student $student): RedirectResponse
    {
        $this->authorizeStudent($request, $student);

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
     * Hapus beberapa siswa sekaligus.
     *
     * Setiap id tetap melewati gerbang otorisasi yang sama dengan hapus satuan;
     * id di luar cakupan pemanggil dilewati dan dilaporkan, bukan menggagalkan
     * seluruh operasi.
     */
    public function bulkDestroy(BulkDestroyStudentRequest $request): RedirectResponse
    {
        /** @var array<int, int> $ids */
        $ids = $request->validated('ids');

        $students = Student::query()->whereIn('id', $ids)->get();

        $deleted = 0;
        $blocked = 0;

        DB::transaction(function () use ($request, $students, &$deleted, &$blocked): void {
            foreach ($students as $student) {
                if (! $this->canManageStudent($request, $student)) {
                    $blocked++;

                    continue;
                }

                $this->deleteImage($student);
                // Menghapus user akan melepas record siswa (FK students.user_id).
                $student->users?->delete();
                $deleted++;
            }
        });

        $message = "{$deleted} siswa berhasil dihapus.";

        if ($blocked > 0) {
            $message .= " {$blocked} dilewati karena di luar cakupan Anda.";
        }

        return redirect()
            ->route('students.index')
            ->with($deleted > 0 ? 'success' : 'error', $message);
    }

    /**
     * Unduh seluruh siswa aktif sebagai berkas Excel.
     */
    public function export(Request $request): BinaryFileResponse
    {
        /** @var User $user */
        $user = $request->user();

        return Excel::download(new StudentsExport($this->scopedStudents($user)), 'data-siswa.xlsx');
    }

    /**
     * Unduh template contoh (berisi sheet contoh + referensi) untuk impor.
     */
    public function template(): BinaryFileResponse
    {
        return Excel::download(new StudentsTemplateExport, 'template-impor-siswa.xlsx');
    }

    /**
     * Impor data siswa dari berkas Excel. Setiap akun dibuat dengan kata sandi
     * default "password". Sama seperti master data lain: baris tak valid
     * dilaporkan, sisanya tetap diimpor.
     */
    public function import(Request $request): RedirectResponse
    {
        // Baris hasil koreksi dari halaman impor dikirim sebagai JSON; berkas
        // Excel tetap didukung untuk operator yang lebih suka mengunggah.
        if ($request->has('rows')) {
            $data = $this->validateRows($request);
            $import = new StudentsImport;

            $this->runRows($import, ImportSpecs::siswa()['headings'], $data['rows']);

            return $this->rowsResult($import, 'students.index');
        }

        return $this->runImport($request, new StudentsImport, 'students.index');
    }

    /**
     * Halaman impor: petunjuk, nilai referensi, dan tabel isian dengan
     * pratinjau — supaya operator tidak perlu menebak isian lalu mengulang
     * siklus unduh–isi–unggah–gagal.
     */
    public function importPage(): Response
    {
        $spec = ImportSpecs::siswa();

        return Inertia::render('import/index', [
            'title' => 'Impor Data Siswa',
            'sheet' => $spec['sheet'],
            'headings' => $spec['headings'],
            'instructions' => $spec['instructions'],
            'example' => $spec['example'],
            'note' => $spec['note'],
            'templateUrl' => route('students.template'),
            'previewUrl' => route('students.import-preview'),
            'storeUrl' => route('students.import'),
            'backUrl' => route('students.index'),
            'references' => Inertia::defer(fn () => ImportSpecs::siswaReferences()),
        ]);
    }

    /**
     * Validasi tanpa menyimpan apa pun.
     */
    public function importPreview(Request $request): JsonResponse
    {
        // Endpoint ini diambil lewat `fetch()` dan hasilnya dibaca sebagai
        // JSON. Aplikasi hanya merender galat sebagai JSON untuk `api/*`
        // (lihat `bootstrap/app.php`), jadi tanpa penanganan ini validasi yang
        // gagal membalas redirect dan `response.json()` di sisi klien pecah.
        try {
            $data = $this->validateRows($request);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], 422);
        }

        $import = new StudentsImport;

        $issues = $this->previewRows($import, ImportSpecs::siswa()['headings'], $data['rows']);

        return response()->json([
            'issues' => $issues,
            'valid' => count($data['rows']) - count(array_unique(array_column(
                array_filter($issues, fn (array $issue): bool => $issue['type'] !== 'warning'),
                'line',
            ))),
        ]);
    }

    /**
     * Baris dari browser tidak dipercaya: pratinjau adalah kenyamanan, bukan
     * bukti kebenaran, jadi batasnya tetap dijaga di sini.
     *
     * @return array{rows: array<int, array<int, string>>}
     */
    private function validateRows(Request $request): array
    {
        /** @var array{rows: array<int, array<int, string>>} $data */
        $data = $request->validate([
            'rows' => ['required', 'array', 'max:500'],
            'rows.*' => ['array'],
            'rows.*.*' => ['nullable', 'string', 'max:255'],
        ]);

        return $data;
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
            'nis' => $data['nis'] ?? null,
            'placeOfBirth' => $data['placeOfBirth'] ?? null,
            'dateOfBirth' => $data['dateOfBirth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'bloodType' => $data['bloodType'] ?? null,
            'alamat' => $data['alamat'] ?? null,
            'status_pkl' => $data['status_pkl'] ?? 'belum',
            'pkl_start' => $data['pkl_start'] ?? null,
            'pkl_end' => $data['pkl_end'] ?? null,
            'class_id' => $data['class_id'] ?? null,
            'industri_id' => $data['industri_id'] ?? null,
            'departemen_id' => $data['departemen_id'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
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
