<?php

namespace App\Http\Requests;

use App\Models\Industry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIndustryRequest extends FormRequest
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
        /** @var Industry $industry */
        $industry = $this->route('industry');

        return [
            // Akun login mitra industri
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($industry->user_id)],

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
