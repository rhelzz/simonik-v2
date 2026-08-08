<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizesEmailDomain;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreParentRequest extends FormRequest
{
    use NormalizesEmailDomain;

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
            // Akun login orang tua — opsional, hanya wajib berpasangan bila diisi.
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'required_with:password', 'string', 'email', 'max:255', ...$this->emailDomainRule(), Rule::unique('users', 'email')],
            'password' => ['nullable', 'required_with:email', 'confirmed', Password::defaults()],

            // Profil orang tua — opsional, boleh dilengkapi belakangan.
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'alamat' => ['nullable', 'string'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'phoneNumber' => ['nullable', 'string', 'max:50'],
        ];
    }
}
