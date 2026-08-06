<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizesEmailDomain;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreStudentRequest extends FormRequest
{
    use NormalizesEmailDomain;

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
            // Akun login siswa
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', ...$this->emailDomainRule(), Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::defaults()],

            // Profil siswa — opsional, siswa melengkapi sendiri setelah login.
            'nis' => ['nullable', 'string', 'max:255'],
            'placeOfBirth' => ['nullable', 'string', 'max:255'],
            'dateOfBirth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'bloodType' => ['nullable', Rule::in(['A', 'B', 'AB', 'O'])],
            'alamat' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status_pkl' => ['nullable', Rule::in(['belum', 'proses', 'selesai'])],
            'pkl_start' => ['nullable', 'date'],
            'pkl_end' => ['nullable', 'date', 'after_or_equal:pkl_start'],

            // Relasi
            'class_id' => ['nullable', Rule::exists('classes', 'id')],
            'industri_id' => ['nullable', Rule::exists('industries', 'id')],
            'departemen_id' => ['nullable', Rule::exists('departemens', 'id')],
            'parent_id' => ['nullable', Rule::exists('parents', 'id')],
            'p_k_l_period_id' => ['nullable', Rule::exists('p_k_l_periods', 'id')],
        ];
    }
}
