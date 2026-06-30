<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMyIndustryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Pembimbing hanya boleh mengubah profil industrinya — bukan relasi
     * (guru/pembimbing) yang tetap wewenang admin/kaprog.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'bidang' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'longitude' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'string', 'max:255'],
            'radius' => ['required', 'integer', 'min:10', 'max:10000'],
            'duration' => ['nullable', 'string', 'max:255'],
        ];
    }
}
