<?php

namespace App\Http\Requests;

use App\Models\Parents;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateParentRequest extends FormRequest
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
        /** @var Parents $parent */
        $parent = $this->route('parent');

        return [
            // Akun login orang tua
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($parent->user_id)],

            // Profil orang tua
            'gender' => ['required', Rule::in(['L', 'P'])],
            'alamat' => ['required', 'string'],
            'occupation' => ['required', 'string', 'max:255'],
            'phoneNumber' => ['required', 'string', 'max:50'],
        ];
    }
}
