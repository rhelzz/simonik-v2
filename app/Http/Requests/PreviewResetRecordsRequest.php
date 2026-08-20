<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Kriteria reset untuk PRATINJAU — tanpa password.
 *
 * Dipakai modul Data Absen maupun Data Jurnal: aturannya identik, jadi satu
 * kelas saja alih-alih sepasang kelas kembar.
 *
 * Password sengaja tidak diwajibkan di sini: kalau pratinjau juga memintanya,
 * operator harus mengetik password sebelum tahu berapa banyak yang akan
 * terhapus, dan urutan itu terbalik.
 *
 * `exists:` bukan lapisan keamanan (cakupan ditegakkan scopedStudents() di
 * controller) melainkan agar ID sampah jadi galat validasi yang terbaca,
 * bukan diam-diam menghasilkan 0 baris.
 */
class PreviewResetRecordsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'departemen_id' => ['nullable', 'integer', 'exists:departemens,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'industri_id' => ['nullable', 'integer', 'exists:industries,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:students,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ];
    }
}
