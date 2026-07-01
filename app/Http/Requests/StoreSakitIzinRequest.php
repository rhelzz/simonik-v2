<?php

namespace App\Http\Requests;

use App\Models\SakitIzin;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSakitIzinRequest extends FormRequest
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
            'type' => [
                'required',
                'string',
                'in:sakit,izin',
            ],
            'reason' => [
                'required',
                'string',
                'min:5',
                'max:500',
            ],
            'bukti' => [
                'required',
                'file',
                'image',
                'max:2048',
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
                    $exists = SakitIzin::query()
                        ->where('user_id', (int) $this->user()->id)
                        ->whereDate('date', $this->date)
                        ->exists();

                    if ($exists) {
                        $validator->errors()->add('date', 'Anda sudah mengajukan sakit/izin untuk tanggal ini.');
                    }
                }
            },
        ];
    }
}
