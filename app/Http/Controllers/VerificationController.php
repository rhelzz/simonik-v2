<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman verifikasi publik keaslian dokumen PKL (sertifikat & rapor). Diakses
 * lewat pemindaian QR yang berisi tautan ber-signature. Data siswa hanya
 * ditampilkan bila signature valid — mencegah enumerasi/kebocoran data.
 */
class VerificationController extends Controller
{
    public function __invoke(Request $request, Student $student): Response
    {
        $valid = $request->hasValidSignature();

        if (! $valid) {
            return Inertia::render('verification/show', [
                'valid' => false,
                'record' => null,
            ]);
        }

        $student->loadMissing(['classes:id,name', 'industries:id,name', 'pkl_period:id,name_period']);

        $avgRaw = $student->evaluations()->avg('score');
        $avg = $avgRaw === null ? null : (int) round((float) $avgRaw);

        $rawEnd = $student->getRawOriginal('pkl_end');
        $end = $rawEnd !== null ? Carbon::parse($rawEnd) : null;

        return Inertia::render('verification/show', [
            'valid' => true,
            'record' => [
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
                'period' => $student->pkl_period?->name_period,
                'nomor' => sprintf('PKL/%d/%04d', ($end ?? Carbon::now())->year, $student->id),
                'statusPkl' => $student->status_pkl,
                'completed' => $student->status_pkl === 'selesai',
                'endLabel' => $end?->translatedFormat('d F Y'),
                'avg' => $avg,
                'grade' => Evaluation::gradeFor($avg),
            ],
        ]);
    }
}
