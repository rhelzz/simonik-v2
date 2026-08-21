<?php

namespace App\Http\Requests;

use App\Actions\SyncPostTags;
use App\Support\TagName;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Thread forum baru.
 *
 * `content` disimpan sebagai TEKS BIASA, bukan HTML. Panduan & Pengumuman
 * memakai rich-text karena penulisnya staf; forum ditulis siswa, dan
 * menyimpan HTML dari input siswa membuat keamanan bergantung pada sanitasi
 * di sisi klien tidak pernah luput.
 */
class StorePostRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:5000'],
            'tags' => ['nullable', 'array', 'max:'.SyncPostTags::MAX_TAGS],
            // `nullable`: middleware bawaan Laravel (TrimStrings +
            // ConvertEmptyStringsToNull) mengubah entri berisi spasi jadi NULL.
            // Tanpa ini, mengetik tag lalu menghapusnya kembali jadi GALAT
            // VALIDASI — padahal maksud user jelas: tag itu tidak jadi dipakai.
            //
            // Panjang mentah dilonggarkan: '#' dan spasi hilang saat
            // dinormalkan. Batas sebenarnya ditegakkan TagName::normalise().
            'tags.*' => ['nullable', 'string', 'max:'.(TagName::MAX_LENGTH + 20)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tags.max' => 'Maksimal '.SyncPostTags::MAX_TAGS.' tag per diskusi.',
        ];
    }
}
