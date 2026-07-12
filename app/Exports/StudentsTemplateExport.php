<?php

namespace App\Exports;

use App\Exports\Sheets\StudentInstructionSheet;
use App\Exports\Sheets\StudentReferenceSheet;
use App\Exports\Sheets\StudentTemplateSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Template contoh untuk impor data siswa: sheet "Petunjuk" (cara mengisi),
 * "Data Siswa" (judul + contoh), dan "Referensi" (daftar nilai relasi valid).
 */
class StudentsTemplateExport implements WithMultipleSheets
{
    /**
     * @return array<int, object>
     */
    public function sheets(): array
    {
        return [
            new StudentInstructionSheet,
            new StudentTemplateSheet,
            new StudentReferenceSheet,
        ];
    }
}
