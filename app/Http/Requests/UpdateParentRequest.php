<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizesEmailDomain;
use App\Models\Parents;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateParentRequest extends FormRequest
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
        /** @var Parents $parent */
        $parent = $this->route('parent');

        return [
            // Akun login orang tua — opsional. Password kosong = biarkan
            // password lama (untuk yang sudah punya akun); email wajib hanya
            // saat password baru diisi (untuk melengkapi akun yang belum ada).
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'required_with:password', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($parent->user_id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],

            // Profil orang tua — opsional, boleh dilengkapi belakangan.
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'alamat' => ['nullable', 'string'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'phoneNumber' => ['nullable', 'string', 'max:50'],
        ];
    }
}
