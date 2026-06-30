<?php

namespace App\Http\Requests;

use App\Models\LeaveRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => [
                'required',
                'date',
            ],
            'reason' => [
                'required',
                'string',
                'min:5',
                'max:500',
            ],
        ];
    }

    /**
     * Get the custom validation rules after main validation.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function ($validator) {
                if ($this->date) {
                    $exists = LeaveRequest::query()
                        ->where('user_id', (int) $this->user()->id)
                        ->whereDate('date', $this->date)
                        ->exists();

                    if ($exists) {
                        $validator->errors()->add('date', 'Anda sudah mengajukan libur untuk tanggal ini.');
                    }
                }
            },
        ];
    }
}
