<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreIndustryRequest extends FormRequest
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
        return [
            // Akun login mitra industri
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::defaults()],

            // Profil industri
            'bidang' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'longitude' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'string', 'max:255'],
            'duration' => ['nullable', 'string', 'max:255'],

            // Relasi (guru pembimbing & pembimbing industri, keduanya opsional)
            'teacher_id' => ['nullable', Rule::exists('teachers', 'id')],
            'pembimbing_id' => ['nullable', Rule::exists('pembimbings', 'id')],
        ];
    }
}
