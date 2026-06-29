<?php

namespace App\Http\Requests;

use App\Models\CertificateTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CertificateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Anchor dikirim sebagai string JSON (karena form multipart) lalu di-decode
     * menjadi array sebelum divalidasi.
     */
    protected function prepareForValidation(): void
    {
        $anchors = $this->input('anchors');

        if (is_string($anchors)) {
            $this->merge(['anchors' => json_decode($anchors, true) ?? []]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'background' => [
                $this->route('certificateTemplate') ? 'nullable' : 'required',
                'image',
                'mimes:jpg,jpeg,png',
                'max:4096',
            ],
            'anchors' => ['required', 'array', 'min:1'],
            'anchors.*.field' => ['required', Rule::in(CertificateTemplate::FIELDS)],
            'anchors.*.x' => ['required', 'numeric', 'between:0,100'],
            'anchors.*.y' => ['required', 'numeric', 'between:0,100'],
            'anchors.*.size' => ['required', 'integer', 'between:1,100'],
            'anchors.*.align' => ['required', Rule::in(['left', 'center', 'right'])],
            'anchors.*.color' => ['required', 'string', 'max:9'],
            'anchors.*.enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'background.required' => 'Gambar latar wajib diunggah.',
            'anchors.required' => 'Minimal satu anchor teks harus diatur.',
        ];
    }
}
