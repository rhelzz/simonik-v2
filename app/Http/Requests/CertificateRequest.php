<?php

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CertificateRequest extends FormRequest
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
        /** @var Student $student */
        $student = $this->route('student');

        return [
            'certificate_template_id' => [
                'required',
                Rule::exists('certificate_templates', 'id'),
                Rule::unique('certificates')->where('student_id', $student->id),
            ],
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }
}
