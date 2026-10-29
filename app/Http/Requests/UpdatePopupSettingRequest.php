<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePopupSettingRequest extends FormRequest
{
    public const ALLOWED_ICONS = [
        'smartphone',
        'bell',
        'info',
        'triangle-alert',
        'sparkles',
        'calendar',
        'megaphone',
        'gift',
    ];

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
            'popup_active' => ['required', 'boolean'],
            'popup_icon' => ['required', 'string', Rule::in(self::ALLOWED_ICONS)],
            'popup_title' => ['required', 'string', 'max:255'],
            'popup_description' => ['nullable', 'string'],
            'popup_has_button' => ['required', 'boolean'],
            'popup_button_text' => ['nullable', 'string', 'max:100'],
            'popup_button_url' => ['nullable', 'string', 'max:500'],
            'popup_interval_minutes' => ['required', 'integer', 'min:0'],
        ];
    }
}
