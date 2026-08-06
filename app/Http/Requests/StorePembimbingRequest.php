<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesRoleAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePembimbingRequest extends FormRequest
{
    use ValidatesRoleAccount;

    protected function targetRole(): string
    {
        return 'pembimbing';
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
            // Akun login pembimbing
            ...$this->accountRules(),

            // Profil pembimbing
            'no_hp' => ['required', 'string', 'max:50'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],

            // Industri yang dibimbing. Opsional: pembimbing boleh didaftarkan
            // lebih dulu, industrinya menyusul.
            'industry_id' => ['nullable', 'integer', Rule::exists('industries', 'id')],
        ];
    }
}
