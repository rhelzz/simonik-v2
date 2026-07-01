<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKuotaRequest extends FormRequest
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
            // null / kosong = tanpa batas kuota.
            'kuota' => ['nullable', 'integer', 'min:0', 'max:10000'],
        ];
    }
}
