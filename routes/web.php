<?php

use App\Http\Controllers\AspectController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartemenController;
use App\Http\Controllers\IndustryController;
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

    // Master data pengguna (dikelola admin/kaprog).
    Route::middleware('role:admin|kaprog')->group(function () {
        Route::resource('students', StudentController::class)->except('show');
        Route::resource('industries', IndustryController::class)->except('show');
        Route::resource('teachers', TeacherController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('pembimbings', PembimbingController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('parents', ParentController::class)->only(['index', 'store', 'update', 'destroy']);

        // Data referensi akademik.
        Route::resource('departemens', DepartemenController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('classes', ClassController::class)->only(['index', 'store', 'update', 'destroy']);

        // Periode / gelombang PKL.
        Route::resource('periods', PeriodController::class)->only(['index', 'store', 'update', 'destroy']);

        // Master aspek penilaian (teknis & non-teknis).
        Route::resource('aspects', AspectController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    // Rekap Penilaian — lihat (semua cakupan) + input nilai (guru/pembimbing).
    Route::middleware('role:admin|kaprog|guru|pembimbing|industri|mitra|siswa|orangtua')->group(function () {
        Route::get('penilaian', [AssessmentController::class, 'index'])->name('assessments.index');
        Route::get('penilaian/{student}', [AssessmentController::class, 'show'])->name('assessments.show');
        Route::put('penilaian/{student}', [AssessmentController::class, 'update'])
            ->middleware('role:guru|pembimbing')
            ->name('assessments.update');
    });

    // Absen siswa (foto + geolokasi via web).
    Route::middleware('role:siswa')->group(function () {
        Route::get('absen', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('absen/masuk', [AttendanceController::class, 'checkIn'])->name('attendance.check-in');
        Route::post('absen/pulang', [AttendanceController::class, 'checkOut'])->name('attendance.check-out');
        Route::post('absen/izin', [AttendanceController::class, 'absence'])->name('attendance.absence');
    });
});
