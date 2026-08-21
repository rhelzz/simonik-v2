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
            // Opsional sejak v2.2 Fase 11 (koordinat industri dilonggarkan di
            // 5 titik). Berkas ini tertinggal, sehingga pembimbing industri
            // yang industrinya belum berkoordinat TIDAK BISA menyimpan
            // profilnya sama sekali. Diperbaiki di v2.4 Fase 25.
            'longitude' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'string', 'max:255'],
            'radius' => ['required', 'integer', 'min:10', 'max:10000'],
            'jam_masuk' => ['nullable', 'date_format:H:i'],
            'jam_pulang' => ['nullable', 'date_format:H:i', 'after:jam_masuk'],
            'duration' => ['nullable', 'string', 'max:255'],
        ];
    }
}
