<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Profil industri yang boleh diubah dari halaman detail oleh pemegang
 * kewenangan per-industri (admin, kaprog jurusan, guru pembimbing industri
 * itu, pembimbing industrinya).
 *
 * SENGAJA TIDAK memuat:
 * - `teacher_id` / `pembimbing_id` — relasi, wewenang admin & kaprog.
 *   Menyaringnya di sini (lewat validated()) yang membuat payload hasil
 *   tulis-tangan dari devtools tidak bisa memindahkan industri ke guru lain.
 * - `latitude` / `longitude` / `radius` — sudah punya editornya sendiri di
 *   halaman yang sama (CoordinateEditor). Dua form yang mengubah kolom yang
 *   sama di satu halaman berarti yang disimpan belakangan menang diam-diam.
 *
 * Otorisasi per-industri dilakukan di controller lewat Gate — pola yang sama
 * dengan UpdateIndustryCoordinatesRequest.
 */
class UpdateIndustryProfileRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'bidang' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'jam_masuk' => ['nullable', 'date_format:H:i'],
            'jam_pulang' => ['nullable', 'date_format:H:i', 'after:jam_masuk'],
            'duration' => ['nullable', 'string', 'max:255'],
        ];
    }
}
