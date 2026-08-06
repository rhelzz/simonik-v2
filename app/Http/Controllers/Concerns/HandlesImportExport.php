<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Alur impor seragam untuk master data: validasi berkas, jalankan importer
 * (yang memakai trait `ImportsRows`), lalu bangun ringkasan flash
 * (ditambah/dilewati/gagal). Impor bersifat "lewati duplikat".
 */
trait HandlesImportExport
{
    /**
     * @param  ToCollection&object{created:int, skipped:array<int,string>, failed:array<int,string>, warnings:array<int,string>, wantedSheet:string}  $import
     */
    protected function runImport(Request $request, ToCollection $import, string $route): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ]);

        Excel::import($import, $request->file('file'));

        // Importer hanya membaca sheet datanya (lihat `ImportsRows::sheets()`),
        // jadi berkas dengan sheet bernama lain menghasilkan 0 baris tanpa
        // sebab yang terlihat. Nol hasil dalam bentuk apa pun — tak ada yang
        // dibuat, dilewati, maupun gagal — berarti tidak ada yang terbaca.
        if ($import->created === 0 && $import->skipped === [] && $import->failed === []) {
            return redirect()->route($route)->with(
                'error',
                'Tidak ada baris data yang terbaca. Pastikan data diisi pada sheet "'
                    .$import->wantedSheet.'" mulai baris ke-2 — unduh template terbaru bila ragu.',
            );
        }

        $summary = "{$import->created} data ditambahkan";

        if ($import->skipped !== []) {
            $summary .= ' · '.count($import->skipped).' dilewati (sudah ada)';
        }

        if ($import->failed !== []) {
            $summary .= ' · '.count($import->failed).' gagal';
        }

        if ($import->warnings !== []) {
            $summary .= ' · '.count($import->warnings).' kolom relasi dikosongkan (nama tidak dikenal)';
        }

        $redirect = redirect()->route($route);

        if ($import->created > 0) {
            $redirect->with('success', $summary.'.');
        }

        // Rincikan baris bermasalah pada banner error (maksimal 12 baris).
        $problems = array_merge($import->failed, $import->skipped);

        if ($problems !== []) {
            $shown = array_slice($problems, 0, 12);

            if (count($problems) > 12) {
                $shown[] = '…dan '.(count($problems) - 12).' baris lainnya.';
            }

            $prefix = $import->created > 0 ? '' : $summary.'. ';
            $redirect->with('error', $prefix.implode("\n", $shown));
        }

        return $redirect;
    }
}
