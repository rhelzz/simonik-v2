<?php

namespace App\Http\Requests;

use App\Models\Departemen;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartemenRequest extends FormRequest
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
        /** @var Departemen|null $departemen */
        $departemen = $this->route('departemen');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('departemens', 'name')->ignore($departemen?->id),
            ],
        ];
    }
}
