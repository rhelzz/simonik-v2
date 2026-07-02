<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlacementRequest extends FormRequest
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
            'industri_id' => ['required', Rule::exists('industries', 'id')],
            'status_pkl' => ['required', Rule::in(['belum', 'proses', 'selesai'])],
        ];
    }
}
