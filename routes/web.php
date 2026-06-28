<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartemenController;
use App\Http\Controllers\StudentController;
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

    Route::resource('departemens', DepartemenController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('role:admin|kaprog');

    Route::resource('classes', ClassController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('role:admin|kaprog');
});
