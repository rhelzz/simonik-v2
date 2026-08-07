<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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

        return $this->rowsResult($import, $route);
    }

    /**
     * Ringkasan hasil impor sebagai flash: ditambahkan / dilewati / gagal,
     * plus rincian baris bermasalah. Dipakai jalur berkas maupun jalur baris
     * dari halaman impor, supaya keduanya melaporkan hal yang sama.
     *
     * @param  ToCollection&object{created:int, skipped:array<int,string>, failed:array<int,string>, warnings:array<int,string>}  $import
     */
    protected function rowsResult(ToCollection $import, string $route): RedirectResponse
    {
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

    /**
     * Jalankan importer atas baris yang diketik/ditempel operator di halaman
     * impor, bukan dari berkas.
     *
     * Judul kolom di-slug persis seperti `WithHeadingRow` melakukannya
     * (`Str::slug($heading, '_')`), sehingga importer tidak bisa membedakan
     * asalnya — satu validator untuk kedua jalur.
     *
     * @param  array<int, string>  $headings
     * @param  array<int, array<int, string>>  $rows
     */
    protected function runRows(ToCollection $import, array $headings, array $rows): void
    {
        $keys = array_map(fn (string $heading): string => Str::slug($heading, '_'), $headings);
        $width = count($keys);

        $collection = collect($rows)->map(function (array $row) use ($keys, $width): Collection {
            $values = array_pad(array_slice(array_values($row), 0, $width), $width, '');

            return collect(array_combine($keys, $values));
        });

        $import->collection($collection);
    }

    /**
     * Validasi tanpa menyimpan: jalankan importer sungguhan lalu batalkan
     * transaksinya.
     *
     * Sengaja memakai importer yang sama, bukan validator kedua khusus
     * pratinjau — kalau tidak, pratinjau bisa bilang "aman" sementara
     * penyimpanan tetap menolak, yaitu bug yang lebih menyebalkan daripada
     * yang sedang kita perbaiki.
     *
     * @param  ToCollection&object{issues: array<int, array{line: int, type: string, message: string}>}  $import
     * @param  array<int, string>  $headings
     * @param  array<int, array<int, string>>  $rows
     * @return array<int, array{line: int, type: string, message: string}>
     */
    protected function previewRows(ToCollection $import, array $headings, array $rows): array
    {
        DB::beginTransaction();

        try {
            $this->runRows($import, $headings, $rows);
        } finally {
            DB::rollBack();
        }

        return $import->issues;
    }
}
