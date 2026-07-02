<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateKaprogRequest extends FormRequest
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
        /** @var User $kaprog */
        $kaprog = $this->route('kaprog');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($kaprog->id)],
            // Kosongkan bila tak ingin mengganti kata sandi.
            'password' => ['nullable', 'confirmed', Password::defaults()],

            'departemen_ids' => ['nullable', 'array'],
            'departemen_ids.*' => [Rule::exists('departemens', 'id')],
        ];
    }
}
