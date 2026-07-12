<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AspectController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceMonitorController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificateTemplateController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartemenController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\IndustryController;
use App\Http\Controllers\JournalMonitorController;
use App\Http\Controllers\KaprogController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\MyIndustryController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\PartnershipController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\PembimbingController;
use App\Http\Controllers\PeriodController;
use App\Http\Controllers\PlacementController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RaporController;
use App\Http\Controllers\SakitIzinController;
use App\Http\Controllers\StatistikController;
use App\Http\Controllers\StreakController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\WakasekController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : Inertia::render('welcome');
})->name('home');

// Verifikasi publik keaslian dokumen PKL (sertifikat & rapor) via QR ber-signature.
Route::get('verifikasi/{student}', VerificationController::class)->name('verification.show');

// PWA (M6.1): sajikan service worker dari root agar scope-nya '/' (mengontrol seluruh app).
// File fisik di-build ke public/build/sw.js; header Service-Worker-Allowed melonggarkan scope.
Route::get('sw.js', function () {
    $path = public_path('build/sw.js');
    abort_unless(file_exists($path), 404);

    return response()->file($path, [
        'Content-Type' => 'application/javascript',
        'Service-Worker-Allowed' => '/',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->name('pwa.sw');

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Pengaturan akun untuk semua role.
    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    // Panduan PKL — semua role bisa lihat & unduh; kelola hanya admin/kaprog.
    Route::get('panduan', [GuideController::class, 'index'])->name('guides.index');
    Route::middleware('role:admin|kaprog')->group(function () {
        Route::post('panduan', [GuideController::class, 'store'])->name('guides.store');
        Route::put('panduan/{guide}', [GuideController::class, 'update'])->name('guides.update');
        Route::delete('panduan/{guide}', [GuideController::class, 'destroy'])->name('guides.destroy');
    });

    // Industri Saya — pembimbing kelola profil industrinya + pantau anak magang.
    Route::middleware('role:pembimbing')->group(function () {
        Route::get('industri-saya', [MyIndustryController::class, 'show'])->name('my-industry.show');
        Route::get('industri-saya/edit', [MyIndustryController::class, 'edit'])->name('my-industry.edit');
        Route::put('industri-saya', [MyIndustryController::class, 'update'])->name('my-industry.update');
    });

    // Master data pengguna (dikelola admin/kaprog).
    Route::middleware('role:admin|kaprog')->group(function () {
        // Panduan urutan import/export data.
        Route::inertia('panduan-import-export', 'data-port/guide')->name('data-guide');

        // Impor/ekspor siswa — didefinisikan sebelum resource agar tidak
        // tertangkap oleh route show `students/{student}`.
        Route::get('students/export', [StudentController::class, 'export'])->name('students.export');
        Route::get('students/template', [StudentController::class, 'template'])->name('students.template');
        Route::post('students/import', [StudentController::class, 'import'])->name('students.import');

        // Impor/ekspor master data lain — literal path didahulukan sebelum resource
        // agar tidak tertangkap route show `{id}`.
        foreach ([
            'industries' => IndustryController::class,
            'teachers' => TeacherController::class,
            'pembimbings' => PembimbingController::class,
            'parents' => ParentController::class,
            'departemens' => DepartemenController::class,
            'classes' => ClassController::class,
        ] as $slug => $controller) {
            Route::get("{$slug}/export", [$controller, 'export'])->name("{$slug}.export");
            Route::get("{$slug}/template", [$controller, 'template'])->name("{$slug}.template");
            Route::post("{$slug}/import", [$controller, 'import'])->name("{$slug}.import");
        }

        // Wakasek & Kaprog — hanya Super Admin.
        Route::middleware('role:admin')->group(function (): void {
            foreach ([
                'wakaseks' => WakasekController::class,
                'kaprogs' => KaprogController::class,
            ] as $slug => $controller) {
                Route::get("{$slug}/export", [$controller, 'export'])->name("{$slug}.export");
                Route::get("{$slug}/template", [$controller, 'template'])->name("{$slug}.template");
                Route::post("{$slug}/import", [$controller, 'import'])->name("{$slug}.import");
            }
        });

        Route::resource('students', StudentController::class);
        Route::resource('industries', IndustryController::class);
        Route::resource('teachers', TeacherController::class);
        Route::resource('pembimbings', PembimbingController::class);
        Route::resource('parents', ParentController::class)->except('show');

        // Akun Wakasek Humas/Hubin — hanya Super Admin yang boleh mengelola.
        Route::resource('wakaseks', WakasekController::class)
            ->except('show')
            ->middleware('role:admin');

        // Akun Kepala Program Keahlian — hanya Super Admin yang boleh mengelola.
        Route::resource('kaprogs', KaprogController::class)
            ->except('show')
            ->middleware('role:admin');

        // Plotting & Penempatan siswa ke industri (lingkup program keahlian kaprog).
        Route::get('penempatan', [PlacementController::class, 'index'])->name('placements.index');
        Route::patch('penempatan/{student}', [PlacementController::class, 'update'])->name('placements.update');

        // Data referensi akademik.
        Route::resource('departemens', DepartemenController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy', 'show']);
        Route::resource('classes', ClassController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy', 'show']);

        // Periode / gelombang PKL.
        Route::resource('periods', PeriodController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);

        // Master aspek penilaian (teknis & non-teknis).
        Route::resource('aspects', AspectController::class)->only(['index', 'store', 'update', 'destroy']);

        // Template sertifikat (gambar latar + anchor teks).
        Route::resource('certificate-templates', CertificateTemplateController::class)
            ->except('show')
            ->parameters(['certificate-templates' => 'certificateTemplate']);
        Route::post('certificate-templates/{certificateTemplate}/activate', [CertificateTemplateController::class, 'activate'])
            ->name('certificate-templates.activate');
    });

    // Sertifikat — output per siswa (admin/kaprog/wakasek cetak semua; siswa miliknya).
    Route::middleware('role:admin|kaprog|wakasek|siswa')->group(function () {
        Route::get('sertifikat', [CertificateController::class, 'index'])->name('certificates.index');
        Route::get('sertifikat/{student}', [CertificateController::class, 'show'])->name('certificates.show');

        // Rapor Digital — kompilasi nilai + rekap + QR keaslian, siap cetak.
        // Penelusuran berjenjang: Jurusan -> Kelas -> Murid -> rapor.
        Route::get('rapor', [RaporController::class, 'index'])->name('rapor.index');
        Route::get('rapor/jurusan/{departemen}', [RaporController::class, 'classes'])->name('rapor.classes');
        Route::get('rapor/kelas/{class}', [RaporController::class, 'students'])->name('rapor.students');
        Route::get('rapor/{student}', [RaporController::class, 'show'])->name('rapor.show');
    });

    // Rekap Penilaian — lihat (semua cakupan) + input nilai (guru/pembimbing).
    Route::middleware('role:admin|kaprog|wakasek|guru|pembimbing|siswa|orangtua')->group(function () {
        // Penelusuran berjenjang: Jurusan -> Kelas -> Murid -> rekap nilai.
        Route::get('penilaian', [AssessmentController::class, 'index'])->name('assessments.index');
        Route::get('penilaian/jurusan/{departemen}', [AssessmentController::class, 'classes'])->name('assessments.classes');
        Route::get('penilaian/kelas/{class}', [AssessmentController::class, 'students'])->name('assessments.students');
        Route::get('penilaian/{student}', [AssessmentController::class, 'show'])->name('assessments.show');
        Route::put('penilaian/{student}', [AssessmentController::class, 'update'])
            ->middleware('role:guru|pembimbing')
            ->name('assessments.update');
    });

    // Absen siswa (foto + geolokasi via web).
    Route::middleware('role:siswa')->group(function () {
        Route::get('absen', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('absen/{attendance}', [AttendanceController::class, 'show'])->name('attendance.show');
        Route::post('absen/masuk', [AttendanceController::class, 'checkIn'])->name('attendance.check-in');
        Route::post('absen/pulang', [AttendanceController::class, 'checkOut'])->name('attendance.check-out');
        Route::post('absen/izin', [AttendanceController::class, 'absence'])->name('attendance.absence');

        // Jurnal kegiatan harian milik siswa sendiri.
        Route::resource('jurnal', ActivityController::class)
            ->parameters(['jurnal' => 'activity'])
            ->except('show')
            ->names('activities');

        // Pengajuan Libur milik siswa.
        Route::get('libur', [LeaveRequestController::class, 'index'])->name('leave-requests.index');
        Route::post('libur', [LeaveRequestController::class, 'store'])->name('leave-requests.store');

        // Pengajuan Sakit/Izin milik siswa.
        Route::get('sakit-izin', [SakitIzinController::class, 'index'])->name('sakit-izin.index');
        Route::post('sakit-izin', [SakitIzinController::class, 'store'])->name('sakit-izin.store');

        // Halaman Streak & Badge gamifikasi jurnal.
        Route::get('streak', StreakController::class)->name('streak');
    });

    // Approval engine — approve/reject (pembimbing, guru, kaprog, orangtua).
    Route::middleware('role:pembimbing|guru|kaprog|orangtua')->group(function () {
        Route::get('approvals', [ApprovalController::class, 'index'])->name('approvals.index');
        Route::post('approvals/{approval}/approve', [ApprovalController::class, 'approve'])->name('approvals.approve');
        Route::post('approvals/{approval}/reject', [ApprovalController::class, 'reject'])->name('approvals.reject');
    });

    // Update koordinat/radius industri (admin, kaprog, guru, pembimbing).
    Route::patch('industries/{industry}/coordinates', [IndustryController::class, 'updateCoordinates'])
        ->middleware('role:admin|kaprog|guru|pembimbing')
        ->name('industries.update-coordinates');

    // Monitoring drill-down (Jurusan -> Kelas -> Murid -> rekap performa).
    Route::middleware('role:admin|kaprog|wakasek|guru|pembimbing|orangtua')->group(function () {
        // Data Absen.
        Route::get('monitoring/absen', [AttendanceMonitorController::class, 'index'])->name('attendance-monitor.index');
        Route::get('monitoring/absen/jurusan/{departemen}', [AttendanceMonitorController::class, 'classes'])->name('attendance-monitor.classes');
        Route::get('monitoring/absen/kelas/{class}', [AttendanceMonitorController::class, 'students'])->name('attendance-monitor.students');
        Route::get('monitoring/absen/murid/{student}', [AttendanceMonitorController::class, 'show'])->name('attendance-monitor.show');

        // Data Jurnal.
        Route::get('monitoring/jurnal', [JournalMonitorController::class, 'index'])->name('journal-monitor.index');
        Route::get('monitoring/jurnal/jurusan/{departemen}', [JournalMonitorController::class, 'classes'])->name('journal-monitor.classes');
        Route::get('monitoring/jurnal/kelas/{class}', [JournalMonitorController::class, 'students'])->name('journal-monitor.students');
        Route::get('monitoring/jurnal/murid/{student}', [JournalMonitorController::class, 'show'])->name('journal-monitor.show');
    });

    // M5.1 Akuntabilitas Dana — Wakasek catat penerimaan & pengeluaran.
    Route::middleware('role:wakasek')->group(function () {
        Route::get('keuangan', [FinanceController::class, 'index'])->name('finance.index');
        Route::post('keuangan/penerimaan', [FinanceController::class, 'storeReceipt'])->name('finance.receipts.store');
        Route::delete('keuangan/penerimaan/{budgetReceipt}', [FinanceController::class, 'destroyReceipt'])->name('finance.receipts.destroy');
        Route::post('keuangan/pengeluaran', [FinanceController::class, 'storeExpense'])->name('finance.expenses.store');
        Route::delete('keuangan/pengeluaran/{expense}', [FinanceController::class, 'destroyExpense'])->name('finance.expenses.destroy');
    });

    // M5.2 Kemitraan + Kuota & M5.3 Statistik Global (admin/wakasek).
    Route::middleware('role:admin|wakasek')->group(function () {
        Route::get('kemitraan', [PartnershipController::class, 'index'])->name('partnerships.index');
        Route::patch('kemitraan/{industry}/kuota', [PartnershipController::class, 'updateKuota'])->name('partnerships.update-kuota');

        Route::get('statistik', [StatistikController::class, 'index'])->name('statistik.index');
    });
});
