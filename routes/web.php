<?php

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
    });
});
