<?php

namespace App\Http\Requests;

use App\Models\AspekProduktif;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AspectRequest extends FormRequest
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
            'category' => ['required', Rule::in(AspekProduktif::CATEGORIES)],
            'no' => ['required', 'integer', 'min:1', 'max:999'],
            'kemampuan' => ['required', 'string', 'max:255'],
        ];
    }
}
