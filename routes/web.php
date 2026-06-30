<?php

use App\Http\Controllers\ActivityController;
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
use App\Http\Controllers\GuideController;
use App\Http\Controllers\IndustryController;
use App\Http\Controllers\JournalMonitorController;
use App\Http\Controllers\MyIndustryController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\PembimbingController;
use App\Http\Controllers\PeriodController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : Inertia::render('welcome');
})->name('home');

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
        Route::resource('students', StudentController::class);
        Route::resource('industries', IndustryController::class);
        Route::resource('teachers', TeacherController::class);
        Route::resource('pembimbings', PembimbingController::class);
        Route::resource('parents', ParentController::class)->except('show');

        // Data referensi akademik.
        Route::resource('departemens', DepartemenController::class)->only(['index', 'store', 'update', 'destroy', 'show']);
        Route::resource('classes', ClassController::class)->only(['index', 'store', 'update', 'destroy', 'show']);

        // Periode / gelombang PKL.
        Route::resource('periods', PeriodController::class)->only(['index', 'store', 'update', 'destroy']);

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
    });

    // Rekap Penilaian — lihat (semua cakupan) + input nilai (guru/pembimbing).
    Route::middleware('role:admin|kaprog|wakasek|guru|pembimbing|siswa|orangtua')->group(function () {
        Route::get('penilaian', [AssessmentController::class, 'index'])->name('assessments.index');
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
    });

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
});
