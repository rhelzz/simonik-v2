<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Data diri yang boleh siswa lengkapi sendiri lewat halaman Profil.
 *
 * Whitelist sengaja terpisah dari `UpdateStudentRequest` milik admin: field
 * institusional (kelas, jurusan, industri, status PKL, orang tua) sama
 * sekali tidak divalidasi di sini, jadi tidak ada jalan bagi siswa untuk
 * memindahkan dirinya sendiri lewat body request meski dipaksakan.
 */
class UpdateStudentProfileRequest extends FormRequest
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
            'nis' => ['nullable', 'string', 'max:255'],
            'placeOfBirth' => ['nullable', 'string', 'max:255'],
            'dateOfBirth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'bloodType' => ['nullable', Rule::in(['A', 'B', 'AB', 'O'])],
            'alamat' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
