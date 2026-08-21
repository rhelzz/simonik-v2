<?php

namespace App\Http\Requests;

use App\Support\TagName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTagRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:'.(TagName::MAX_LENGTH + 20),
                // Unique diperiksa terhadap nama yang SUDAH dinormalkan
                // (lihat prepareForValidation) — kalau tidak, '#Absen' lolos
                // sebagai nama baru padahal menjadi 'absen' yang sudah ada.
                Rule::unique('tags', 'name')->ignore($this->route('tag')),
            ],
            'is_suggested' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name');

        if (is_string($name)) {
            $this->merge(['name' => TagName::normalise($name)]);
        }
    }
}
