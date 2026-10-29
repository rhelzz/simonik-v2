<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GuideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Panduan PKL: artikel panduan dengan judul, konten rich text, kategori,
     * urutan tampil, status (draft/published), gambar/screenshot opsional,
     * serta dokumen pendukung (PDF/Office) opsional.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'deskripsi' => ['nullable', 'string', 'max:2000'],
            'konten' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,published'],
            'urutan' => ['nullable', 'integer', 'min:0'],
            'published_at' => ['nullable', 'date'],
            'gambar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'dokumen' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx',
                'max:10240',
            ],
            'hapus_gambar' => ['nullable', 'boolean'],
            'hapus_dokumen' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'judul.required' => 'Judul panduan wajib diisi.',
            'gambar.image' => 'Berkas gambar harus berupa foto/tangkapan layar.',
            'gambar.mimes' => 'Format gambar harus JPG, JPEG, PNG, atau WEBP.',
            'gambar.max' => 'Ukuran gambar maksimal 5 MB.',
            'dokumen.mimes' => 'Format harus PDF, Word, Excel, atau PowerPoint.',
            'dokumen.max' => 'Ukuran berkas maksimal 10 MB.',
        ];
    }
}
