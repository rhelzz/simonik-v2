<?php

namespace App\Http\Requests;

use App\Http\Controllers\AnnouncementController;
use App\Models\Announcement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementRequest extends FormRequest
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
            'body' => ['required', 'string', 'max:20000'],
            'roles' => ['required', 'array', 'min:1'],
            // Tanpa Rule::in, `roles` adalah kolom JSON yang menerima apa pun
            // yang dikirim dari devtools — termasuk role yang tidak ada,
            // sehingga pengumumannya tidak akan pernah tampil ke siapa pun.
            'roles.*' => ['string', Rule::in(array_keys(AnnouncementController::ROLE_LABELS))],
            'starts_at' => ['required', 'date'],
            // Pengumuman satu hari sah (after_or_equal, bukan after).
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
        ];
    }

    /**
     * "All User" menelan target lainnya: menyimpan ['*', 'siswa'] membuat data
     * ambigu tanpa menambah arti apa pun.
     *
     * Dinormalkan di prepareForValidation(), BUKAN passedValidation():
     * validated() mengembalikan data yang sudah dikumpulkan validator, jadi
     * merge() setelah validasi tidak pernah sampai ke data yang disimpan.
     */
    protected function prepareForValidation(): void
    {
        $roles = $this->input('roles');

        if (is_array($roles) && in_array(Announcement::ALL_ROLES, $roles, true)) {
            $this->merge(['roles' => [Announcement::ALL_ROLES]]);
        }
    }
}
