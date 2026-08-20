<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Presensi yang diwakilkan guru pembimbing / admin: pilih murid + waktu
 * custom, tanpa geolokasi dan foto.
 *
 * `exists:` di sini bukan lapisan keamanan — cakupan siswa ditegakkan di
 * controller lewat scopedStudents(). Gunanya agar ID sampah jadi galat
 * validasi yang terbaca, bukan diam-diam menghasilkan 0 baris.
 */
class StoreProxyAttendanceRequest extends FormRequest
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
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'exists:students,id'],
            'date' => ['required', 'date'],
            // Cocok dengan <input type="time">; dikonversi ke H:i:s saat simpan
            // agar formatnya sama dengan yang ditulis AttendanceController.
            'arrival_time' => ['required', 'date_format:H:i'],
        ];
    }
}
