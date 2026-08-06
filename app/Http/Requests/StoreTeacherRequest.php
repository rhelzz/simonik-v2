<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesRoleAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeacherRequest extends FormRequest
{
    use ValidatesRoleAccount;

    protected function targetRole(): string
    {
        return 'guru';
    }

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
            // Akun login guru
            ...$this->accountRules(),

            // Profil guru
            'no_hp' => ['required', 'string', 'max:50'],
            'departemen_id' => ['required', Rule::exists('departemens', 'id')],
        ];
    }
}
