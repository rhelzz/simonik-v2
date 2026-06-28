<?php

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
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
        /** @var Student $student */
        $student = $this->route('student');

        return [
            // Akun login siswa
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student->user_id)],

            // Profil siswa
            'nis' => ['required', 'string', 'max:50'],
            'placeOfBirth' => ['required', 'string', 'max:255'],
            'dateOfBirth' => ['required', 'date'],
            'gender' => ['required', Rule::in(['L', 'P'])],
            'bloodType' => ['required', Rule::in(['A', 'B', 'AB', 'O'])],
            'alamat' => ['required', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status_pkl' => ['required', Rule::in(['belum', 'proses', 'selesai'])],
            'pkl_start' => ['nullable', 'date'],
            'pkl_end' => ['nullable', 'date', 'after_or_equal:pkl_start'],

            // Relasi
            'class_id' => ['required', Rule::exists('classes', 'id')],
            'industri_id' => ['required', Rule::exists('industries', 'id')],
            'departemen_id' => ['required', Rule::exists('departemens', 'id')],
            'parent_id' => ['required', Rule::exists('parents', 'id')],
            'teacher_id' => ['required', Rule::exists('teachers', 'id')],
            'p_k_l_period_id' => ['nullable', Rule::exists('p_k_l_periods', 'id')],
        ];
    }
}
