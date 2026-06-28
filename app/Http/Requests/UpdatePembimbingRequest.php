<?php

namespace App\Http\Requests;

use App\Models\Pembimbing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePembimbingRequest extends FormRequest
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
        /** @var Pembimbing $pembimbing */
        $pembimbing = $this->route('pembimbing');

        return [
            // Akun login pembimbing
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($pembimbing->user_id)],

            // Profil pembimbing
            'no_hp' => ['required', 'string', 'max:50'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
        ];
    }
}
