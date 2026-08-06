<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesRoleAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKaprogRequest extends FormRequest
{
    use ValidatesRoleAccount;

    protected function targetRole(): string
    {
        return 'kaprog';
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
            ...$this->accountRules(),

            // Program keahlian yang dipimpin (opsional, boleh lebih dari satu).
            'departemen_ids' => ['nullable', 'array'],
            'departemen_ids.*' => [Rule::exists('departemens', 'id')],
        ];
    }
}
