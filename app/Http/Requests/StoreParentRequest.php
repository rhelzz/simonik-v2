<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreParentRequest extends FormRequest
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
            // Akun login orang tua
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::defaults()],

            // Profil orang tua
            'gender' => ['required', Rule::in(['L', 'P'])],
            'alamat' => ['required', 'string'],
            'occupation' => ['required', 'string', 'max:255'],
            'phoneNumber' => ['required', 'string', 'max:50'],
        ];
    }
}
