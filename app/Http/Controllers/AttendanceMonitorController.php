<?php

namespace App\Http\Controllers;

use App\Actions\ResetStudentRecords;
use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Http\Controllers\Concerns\SummarizesParticipation;
use App\Http\Controllers\Concerns\SummarizesStudentPerformance;
use App\Http\Requests\PreviewResetRecordsRequest;
use App\Http\Requests\ResetRecordsRequest;
use App\Http\Requests\StoreProxyAttendanceRequest;
use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use App\Support\AttendanceStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Monitoring Data Absen berjenjang (Jurusan -> Kelas -> Murid -> rekap performa)
 * yang dibatasi cakupan role. Tanpa verifikasi — rekap berbasis hitungan.
 */
class AttendanceMonitorController extends Controller
{
    use ScopesStudentsByRole;
    use SummarizesParticipation;
    use SummarizesStudentPerformance;

    /**
     * Batas jumlah murid yang ditawarkan di modal reset. Sekolah besar bisa
     * punya ribuan siswa; mengirim semuanya membuat modal berat tanpa ada yang
     * benar-benar menggulir sejauh itu.
     */
    private const RESET_CANDIDATE_LIMIT = 200;

    public function __construct(private readonly ResetStudentRecords $reset) {}

    /**
     * Layer 1 — daftar jurusan yang memuat siswa dalam cakupan role.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $counts = $this->scopedStudents($user)
            ->selectRaw('departemen_id, count(*) as total')
            ->groupBy('departemen_id')
            ->pluck('total', 'departemen_id');

        $departemens = Departemen::query()
            ->whereIn('id', $counts->keys())
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departemen $departemen): array => [
                'id' => $departemen->id,
                'name' => $departemen->name,
                'students' => (int) $counts->get($departemen->id, 0),
            ]);

        // Populasi tunggal untuk rate & roster: siswa PKL berjalan dalam cakupan
        // role. Yang belum/sudah selesai PKL memang tidak absen — memasukkannya
        // akan mengubur nama yang benar di bawah puluhan yang tidak relevan.
        // (students.user_id NOT NULL di skema, jadi tidak perlu dijaga di sini.)
        $activeStudents = fn (): Builder => $this->scopedStudents($user)
            ->where('status_pkl', 'proses');

        $date = $request->date('tanggal') ?? Carbon::today();
        $category = \in_array($request->query('kategori'), ['hadir', 'terlambat', 'alpha', 'wfh'], true)
            ? $request->query('kategori')
            : 'hadir';
        $search = trim((string) $request->query('search', ''));
        $industryId = $request->integer('industri') ?: null;
        $legacyTab = \in_array($request->query('tab'), ['belum', 'sudah'], true)
            ? $request->query('tab')
            : null;

        // "Sudah presensi" = ADA baris absen pada tanggal itu — bukan
        // status 'hadir'. Siswa sakit/izin/libur (lewat approval) sudah
        // terhitung dan tidak boleh muncul di daftar "belum".
        //
        // Satu closure dipakai tiga kali (hitung, saring, eager-load) supaya
        // kriterianya tidak mungkin berbeda antar-pemakai. Tipe union karena
        // whereHas() memberi Builder sedangkan with() memberi Relation.
        $onDate = fn (Builder|Relation $query): mixed => $query->whereDate('date', $date);

        // Akhir pekan yang sudah lewat tidak dihitung sama sekali: menampilkan
        // seluruh sekolah sebagai "belum" di hari Sabtu hanya melatih operator
        // untuk mengabaikan panel ini. Hari BERJALAN tetap ditampilkan apa
        // adanya, termasuk kalau jatuh di akhir pekan (lihat AttendanceStatus).
        $countsAsWorkday = ! ($date->isWeekend() && $date->lessThan(Carbon::today()));

        $sudah = $activeStudents()->whereHas('users.attendances', $onDate)->count();
        $belum = $countsAsWorkday ? $activeStudents()->count() - $sudah : 0;

        $rows = $activeStudents()
            ->when($search !== '', fn (Builder $query): Builder => $query->where('name', 'like', "%{$search}%"))
            ->when($industryId !== null, fn (Builder $query): Builder => $query->where('industri_id', $industryId))
            ->with([
                'classes:id,name',
                'industries:id,name,jam_masuk',
                'users.attendances' => $onDate,
                'pkl_period:id,start_period,end_period',
            ])
            ->orderBy('name')
            ->get()
            ->map(function (Student $student) use ($date, $legacyTab): array {
                $attendance = $student->users?->attendances->first();

                // Tanggal PKL per-siswa menang atas tanggal periodenya —
                // pola yang sama dengan SummarizesStudentPerformance.
                $status = $attendance !== null
                    && \in_array(mb_strtolower((string) $attendance->status), ['hadir', 'masuk'], true)
                    && ! $attendance->countsAsPresent()
                        ? AttendanceStatus::BELUM_LENGKAP
                        : AttendanceStatus::for(
                            $attendance?->status,
                            $date,
                            $student->pkl_start ?? $student->pkl_period?->start_period,
                            $student->pkl_end ?? $student->pkl_period?->end_period,
                        );

                $lateMinutes = $attendance?->lateMinutes($student->industries?->jam_masuk);

                if ($status === AttendanceStatus::BELUM && $legacyTab === null) {
                    $status = AttendanceStatus::BELUM_LENGKAP;
                } elseif (\in_array($status, ['hadir', 'masuk'], true)
                    && $attendance?->countsAsPresent()
                    && $lateMinutes > 0) {
                    $status = 'terlambat';
                }

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nis,
                    'class' => $student->classes?->name,
                    'industry' => $student->industries?->name,
                    'status' => $status,
                    'statusLabel' => $status === 'terlambat' ? 'Terlambat' : AttendanceStatus::label($status),
                    'arrivalTime' => $attendance?->arrivalTime
                        ? mb_substr($attendance->arrivalTime, 0, 5)
                        : null,
                    'departureTime' => $attendance?->departureTime
                        ? mb_substr($attendance->departureTime, 0, 5)
                        : null,
                    'lateMinutes' => $lateMinutes,
                    'mode' => $attendance?->mode,
                    'hasAttendance' => $attendance !== null,
                    'canCheckIn' => $attendance === null,
                    'canCheckOut' => $attendance !== null
                        && mb_strtolower((string) $attendance->status) === 'hadir'
                        && $attendance->arrivalTime !== null
                        && $attendance->departureTime === null,
                ];
            })
            ->reject(fn (array $row): bool => $row['status'] === AttendanceStatus::TIDAK_DIHITUNG)
            ->values();

        $summary = [
            'hadir' => $rows->where('hasAttendance', true)->count(),
            'terlambat' => $rows->where('lateMinutes', '>', 0)->count(),
            'alpha' => $rows->where('hasAttendance', false)->count(),
            'wfh' => $rows->where('mode', 'wfa')->count(),
            // Kompatibilitas query lama dan test regresi sebelum PKL-018.
            'sudah' => $sudah,
            'belum' => $belum,
        ];

        $filterCategory = $legacyTab ?? $category;
        $filteredRows = $rows->filter(fn (array $row): bool => match ($filterCategory) {
            'hadir', 'sudah' => $row['hasAttendance'],
            'terlambat' => $row['lateMinutes'] !== null && $row['lateMinutes'] > 0,
            'alpha', 'belum' => ! $row['hasAttendance'] && $countsAsWorkday,
            'wfh' => $row['mode'] === 'wfa',
            default => true,
        })->values();

        $page = max(1, $request->integer('page', 1));
        $roster = new LengthAwarePaginator(
            $filteredRows->forPage($page, 15)->values(),
            $filteredRows->count(),
            15,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        $filterIndustries = Industry::query()
            ->whereIn('id', $activeStudents()->whereNotNull('industri_id')->distinct()->pluck('industri_id'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('attendance-monitor/index', [
            'departemens' => $departemens,
            'scopeLabel' => $this->scopeLabel($user),
            'attendanceRate' => $this->participation($activeStudents()->pluck('user_id')->all())['attendance'],
            'roster' => $roster,
            'summary' => $summary,
            'filters' => [
                'tanggal' => $date->format('Y-m-d'),
                'category' => $legacyTab === 'belum' ? 'alpha' : ($legacyTab === 'sudah' ? 'hadir' : $category),
                'search' => $search,
                'industri' => $industryId,
            ],
            'filterIndustries' => $filterIndustries,
            'dateLabel' => $date->translatedFormat('l, d F Y'),
            'can' => [
                'proxyAttendance' => $user->hasAnyRole(['admin', 'guru', 'pembimbing']),
                'reset' => $user->hasRole('admin'),
            ],
            // Opsi filter modal reset. Jurusan memakai ulang prop `departemens`
            // yang sudah dimuat; kelas & industri butuh dua kueri ringan
            // tambahan, dan hanya dijalankan untuk admin (satu-satunya role
            // yang bisa mereset).
            'classOptions' => $user->hasRole('admin')
                ? Classes::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'industryOptions' => $user->hasRole('admin')
                ? Industry::query()->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    /**
     * Presensi yang diwakilkan guru pembimbing / admin — pilih murid + waktu
     * custom, tanpa geolokasi dan foto.
     *
     * Tidak memakai AttendanceController::checkIn(): seluruh jalur itu
     * mensyaratkan foto & GPS (dan melonggarkannya akan membuat setiap
     * pengaman anti-titip-absen di jalur siswa jadi opsional).
     */
    public function storeProxy(StoreProxyAttendanceRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $date = Carbon::parse($data['date'])->startOfDay();
        $type = $data['type'];
        $time = ($data[$type === 'masuk' ? 'arrival_time' : 'departure_time']).':00';

        // Cakupan role: murid di luar bimbingan pemanggil tidak pernah terambil
        // di sini, jadi ID sembarang dari devtools menghasilkan 0 baris.
        $students = $this->scopedStudents($user)
            ->whereIn('id', $data['student_ids'])
            ->with('industries:id,jam_masuk')
            ->get();

        [$created, $skipped] = DB::transaction(function () use ($students, $date, $time, $type, $user): array {
            $created = 0;
            $skipped = 0;

            foreach ($students as $student) {
                // create(), BUKAN updateOrCreate(): menimpa berarti menghapus
                // bukti foto & GPS absen mandiri siswa, atau membatalkan status
                // sakit/izin yang sudah lolos approval. Yang sudah punya data
                // dilewati dan dilaporkan, bukan ditindih diam-diam.
                $attendance = Attendance::query()
                    ->where('user_id', $student->user_id)
                    ->whereDate('date', $date)
                    ->first();

                if ($type === 'masuk' && $attendance !== null) {
                    $skipped++;

                    continue;
                }

                if ($type === 'pulang') {
                    $valid = $attendance !== null
                        && mb_strtolower((string) $attendance->status) === 'hadir'
                        && $attendance->arrivalTime !== null
                        && $attendance->departureTime === null
                        && Carbon::parse($time)->greaterThanOrEqualTo(Carbon::parse($attendance->arrivalTime))
                        && ($student->industries?->jam_pulang === null
                            || Carbon::parse($time)->greaterThanOrEqualTo(Carbon::parse($student->industries->jam_pulang)));

                    if (! $valid) {
                        $skipped++;

                        continue;
                    }

                    $attendance->update(['departureTime' => $time, 'mode' => 'proxy']);
                    $created++;

                    continue;
                }

                $jamMasuk = $student->industries?->jam_masuk;

                Attendance::create([
                    'user_id' => $student->user_id,
                    'date' => $date,
                    'arrivalTime' => $time,
                    'status' => 'hadir',
                    'mode' => 'proxy',
                    // Keterlambatan tetap dihitung dari waktu yang diketik —
                    // kalau tidak, presensi diwakilkan jadi jalan pintas
                    // menghapus keterlambatan dan rekap kedisiplinan kehilangan arti.
                    'is_late' => $jamMasuk !== null && Carbon::parse($time)->greaterThan(Carbon::parse($jamMasuk)),
                    'is_suspect' => false,
                    'description' => 'Presensi diwakilkan oleh '.$user->name.' ('.$user->getRoleNames()->first().')',
                ]);

                $created++;
            }

            return [$created, $skipped];
        });

        // Angka yang dilewati wajib disebut: kalau disembunyikan, guru mengira
        // semuanya beres dan baru tahu sebulan kemudian saat rekap tak cocok.
        return back()->with('success', $skipped === 0
            ? "{$created} murid berhasil dipresensikan."
            : "{$created} murid berhasil dipresensikan. {$skipped} dilewati karena tidak memenuhi aturan {$type}.");
    }

    /**
     * Pratinjau: berapa baris absen yang AKAN terhapus. Tidak mengubah apa pun.
     *
     * Mengembalikan JSON, bukan Inertia render — satu-satunya pengecualian
     * "tanpa API terpisah" di proyek ini, dan alasannya: pratinjau dipanggil
     * berkali-kali saat operator mengubah kriteria di dalam modal yang sedang
     * terbuka, sedangkan router.reload akan merender ulang halaman di
     * belakang modal.
     */
    public function resetPreview(PreviewResetRecordsRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $criteria = $request->validated();

        // Kandidat murid dihitung TANPA student_ids: daftar yang ditawarkan
        // harus tetap sama saat operator mencentang sebagian, kalau tidak
        // daftarnya menyusut sendiri setiap kali dicentang.
        $candidates = $this->reset
            ->students($this->scopedStudents($user), Arr::except($criteria, 'student_ids'))
            ->orderBy('name')
            ->limit(self::RESET_CANDIDATE_LIMIT)
            ->get(['id', 'name', 'nis']);

        return response()->json([
            'count' => $this->reset->count(
                $this->scopedStudents($user),
                Attendance::class,
                $criteria,
            ),
            'students' => $candidates,
            // Beri tahu modal kalau daftarnya dipotong, agar operator tahu
            // harus mempersempit filter — bukan mengira muridnya cuma segitu.
            'truncated' => $candidates->count() >= self::RESET_CANDIDATE_LIMIT,
        ]);
    }

    /**
     * Hapus permanen data absen sesuai kriteria. Tidak bisa dibatalkan.
     */
    public function reset(ResetRecordsRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $deleted = $this->reset->handle(
            $this->scopedStudents($user),
            Attendance::class,
            $request->validated(),
        );

        // Angka nyata, bukan "berhasil": operator harus bisa membedakan
        // "terhapus 240" dari "terhapus 0 karena filternya salah".
        return back()->with('success', "{$deleted} data absen berhasil direset.");
    }

    /**
     * Layer 2 — daftar kelas (dalam satu jurusan) yang memuat siswa dalam cakupan.
     */
    public function classes(Request $request, Departemen $departemen): Response
    {
        /** @var User $user */
        $user = $request->user();

        $scoped = $this->scopedStudents($user)->where('departemen_id', $departemen->id);

        $counts = $scoped
            ->selectRaw('class_id, count(*) as total')
            ->groupBy('class_id')
            ->pluck('total', 'class_id');

        $classes = Classes::query()
            ->whereIn('id', $counts->keys())
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Classes $class): array => [
                'id' => $class->id,
                'name' => $class->name,
                'students' => (int) $counts->get($class->id, 0),
            ]);

        return Inertia::render('attendance-monitor/classes', [
            'departemen' => ['id' => $departemen->id, 'name' => $departemen->name],
            'classes' => $classes,
        ]);
    }

    /**
     * Layer 3 — daftar murid (dalam satu kelas) + ringkasan absen.
     */
    public function students(Request $request, Classes $class): Response
    {
        /** @var User $user */
        $user = $request->user();

        $search = trim((string) $request->query('search', ''));

        $scoped = $this->scopedStudents($user)->where('class_id', $class->id);

        $students = $scoped
            ->withCount('attendances')
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%"),
            ))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Student $student): array => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'total' => (int) $student->getAttribute('attendances_count'),
            ]);

        $class->loadMissing('departemens:id,name');

        return Inertia::render('attendance-monitor/students', [
            'departemen' => $class->departemens
                ? ['id' => $class->departemens->id, 'name' => $class->departemens->name]
                : null,
            'class' => ['id' => $class->id, 'name' => $class->name],
            'students' => $students,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Layer 4 — seluruh data absen satu murid + rekap performa berbasis hitungan.
     */
    public function show(Request $request, Student $student): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->scopedStudents($user)->whereKey($student->id)->exists(), 403);

        $student->loadMissing(['classes:id,name', 'industries:id,name,jam_masuk', 'pkl_period:id,start_period,end_period']);
        $jamMasuk = $student->industries?->jam_masuk;

        $records = $student->attendances()
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(15)
            ->through(fn (Attendance $attendance): array => $this->present($attendance, $jamMasuk));

        return Inertia::render('attendance-monitor/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
            ],
            'records' => $records,
            'performance' => $this->performance($student),
        ]);
    }

    /**
     * Bentuk data absen untuk dikirim ke halaman Inertia.
     *
     * @return array<string, mixed>
     */
    private function present(Attendance $attendance, ?string $jamMasuk): array
    {
        return [
            'id' => $attendance->id,
            'date' => $attendance->date->format('Y-m-d'),
            'dateLabel' => $attendance->date->translatedFormat('l, d M Y'),
            'status' => $attendance->status,
            'arrivalTime' => $attendance->arrivalTime ? mb_substr($attendance->arrivalTime, 0, 5) : null,
            'departureTime' => $attendance->departureTime ? mb_substr($attendance->departureTime, 0, 5) : null,
            'lateMinutes' => $attendance->lateMinutes($jamMasuk),
            'absenceReason' => $attendance->absenceReason,
            'image' => $attendance->image,
            'departureImage' => $attendance->departure_image,
            'latitude' => $attendance->latitude,
            'longitude' => $attendance->longitude,
        ];
    }
}
