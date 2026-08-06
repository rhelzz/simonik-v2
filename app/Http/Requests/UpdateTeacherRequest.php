<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizesEmailDomain;
use App\Models\Teacher;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateTeacherRequest extends FormRequest
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
        /** @var Teacher $teacher */
        $teacher = $this->route('teacher');

        return [
            // Akun login guru
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($teacher->user_id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],

            // Profil guru
            'no_hp' => ['required', 'string', 'max:50'],
            'departemen_id' => ['required', Rule::exists('departemens', 'id')],
        ];
    }
}
