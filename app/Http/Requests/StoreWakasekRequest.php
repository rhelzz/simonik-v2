<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesRoleAccount;
use Illuminate\Foundation\Http\FormRequest;

class StoreWakasekRequest extends FormRequest
{
    use ValidatesRoleAccount;

    protected function targetRole(): string
    {
        return 'wakasek';
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
        ];
    }
}
