<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkDestroyStudentRequest extends FormRequest
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
            // Batas atas mencegah satu request menghapus seisi sekolah karena
            // bug di sisi frontend. Jauh di atas 10 baris per halaman, jadi
            // tidak mengganggu pemakaian normal.
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'distinct', Rule::exists('students', 'id')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'Pilih setidaknya satu siswa untuk dihapus.',
            'ids.max' => 'Maksimal 200 siswa sekali hapus.',
        ];
    }
}
