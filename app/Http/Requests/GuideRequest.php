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
     * Panduan PKL: judul, deskripsi opsional, dan berkas dokumen. Berkas wajib
     * saat menambah; opsional saat memperbarui (kosongkan untuk pertahankan).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:2000'],
            'dokumen' => [
                $this->route('guide') ? 'nullable' : 'required',
                'file',
                'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx',
                'max:10240',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'dokumen.required' => 'Berkas dokumen wajib diunggah.',
            'dokumen.mimes' => 'Format harus PDF, Word, Excel, atau PowerPoint.',
            'dokumen.max' => 'Ukuran berkas maksimal 10 MB.',
        ];
    }
}
