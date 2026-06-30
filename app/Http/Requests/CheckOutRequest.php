<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Absen pulang wajib menyertakan foto selfie.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'emotion' => ['nullable', 'string', 'in:neutral,happy,sad,angry,fearful,disgusted,surprised'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => 'Foto absen pulang wajib diambil.',
        ];
    }
}
