<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Absen masuk wajib foto (selfie) + titik geolokasi.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'gps_accuracy' => ['required', 'numeric'],
            'description' => ['nullable', 'string', 'max:255'],
            'emotion' => ['nullable', 'string', 'in:neutral,happy,sad,angry,fearful,disgusted,surprised'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => 'Foto absen wajib diambil.',
            'latitude.required' => 'Lokasi belum terekam. Aktifkan izin lokasi.',
            'longitude.required' => 'Lokasi belum terekam. Aktifkan izin lokasi.',
        ];
    }
}
