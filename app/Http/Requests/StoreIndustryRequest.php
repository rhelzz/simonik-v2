<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            // Profil industri (container relasi, tanpa akun)
            'name' => ['required', 'string', 'max:255'],
            'bidang' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'longitude' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'string', 'max:255'],
            'radius' => ['required', 'integer', 'min:10', 'max:10000'],
            'jam_masuk' => ['nullable', 'date_format:H:i'],
            'jam_pulang' => ['nullable', 'date_format:H:i', 'after:jam_masuk'],
            'duration' => ['nullable', 'string', 'max:255'],

            // Relasi (guru pembimbing & pembimbing industri, keduanya opsional)
            'teacher_id' => ['nullable', Rule::exists('teachers', 'id')],
            'pembimbing_id' => ['nullable', Rule::exists('pembimbings', 'id')],
        ];
    }
}
