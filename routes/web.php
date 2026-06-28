<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityMonitorController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartemenController;
use App\Http\Controllers\IndustryController;
use App\Http\Controllers\PembimbingController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::resource('students', StudentController::class)
        ->except('show')
        ->middleware('role:admin|kaprog|guru|pembimbing');

    Route::resource('industries', IndustryController::class)
        ->except('show')
        ->middleware('role:admin|kaprog|guru|pembimbing');

    Route::resource('teachers', TeacherController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('role:admin|kaprog');

    Route::resource('pembimbings', PembimbingController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('role:admin|kaprog');

    Route::resource('departemens', DepartemenController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('role:admin|kaprog');

    Route::resource('classes', ClassController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('role:admin|kaprog');

    // Jurnal kegiatan harian milik siswa sendiri.
    Route::resource('activities', ActivityController::class)
        ->except('show')
        ->middleware('role:siswa');

    // Pemantauan jurnal kegiatan siswa oleh staf (role-scoped) + verifikasi.
    Route::middleware('role:admin|kaprog|guru|pembimbing|industri|mitra')->group(function () {
        Route::get('kegiatan', [ActivityMonitorController::class, 'index'])->name('kegiatan.index');
        Route::get('kegiatan/{activity}', [ActivityMonitorController::class, 'show'])->name('kegiatan.show');
    });
    Route::patch('kegiatan/{activity}/verify', [ActivityMonitorController::class, 'verify'])
        ->name('kegiatan.verify')
        ->middleware('role:pembimbing|industri|mitra');
});
