<?php

namespace App\Http\Controllers;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Tampilkan dashboard ringkasan monitoring PKL.
     */
    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'students' => Student::count(),
                'activePkl' => Student::where('status_pkl', 'proses')->count(),
                'industries' => Industry::count(),
                'teachers' => Teacher::count(),
                'pembimbings' => Pembimbing::count(),
            ],
            'recentStudents' => Student::with(['classes:id,name', 'industries:id,name'])
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'nis', 'status_pkl', 'class_id', 'industri_id', 'created_at'])
                ->map(fn (Student $student): array => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nis,
                    'status_pkl' => $student->status_pkl,
                    'class' => $student->classes?->name,
                    'industry' => $student->industries?->name,
                    'joined' => $student->created_at?->translatedFormat('d M Y'),
                ]),
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }
}
