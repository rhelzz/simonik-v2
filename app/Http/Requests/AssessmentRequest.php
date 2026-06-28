<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Skor dikirim sebagai map aspek_produktif_id => nilai (0-100 atau kosong).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'scores' => ['array'],
            'scores.*' => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }
}
