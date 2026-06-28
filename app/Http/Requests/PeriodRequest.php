<?php

namespace App\Http\Requests;

use App\Models\PKLPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PeriodRequest extends FormRequest
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
        /** @var PKLPeriod|null $period */
        $period = $this->route('period');

        return [
            'name_period' => [
                'required',
                'string',
                'max:255',
                Rule::unique('p_k_l_periods', 'name_period')->ignore($period?->id),
            ],
            'start_period' => ['required', 'date'],
            'end_period' => ['required', 'date', 'after_or_equal:start_period'],
        ];
    }
}
