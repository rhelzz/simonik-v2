<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
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
            // Teks biasa, alasan sama dengan StorePostRequest.
            'content' => ['required', 'string', 'max:3000'],
        ];
    }
}
