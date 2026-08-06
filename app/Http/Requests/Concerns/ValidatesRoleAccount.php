<?php

namespace App\Http\Requests\Concerns;

use App\Models\User;
use App\Support\Roles;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

/**
 * Aturan bersama untuk form yang membuat jabatan kepegawaian: operator boleh
 * membuat akun baru, atau menautkan jabatan ini ke akun yang sudah ada.
 */
trait ValidatesRoleAccount
{
    use NormalizesEmailDomain;

    /** Peran yang diberikan form ini. */
    abstract protected function targetRole(): string;

    /**
     * Kolom akun. Nama/email/kata sandi hanya wajib saat membuat akun baru —
     * saat menautkan akun yang ada, `user_id` yang dipakai.
     *
     * @return array<string, mixed>
     */
    protected function accountRules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'name' => ['required_without:user_id', 'string', 'max:255'],
            'email' => ['required_without:user_id', 'string', 'email', 'max:255', ...$this->emailDomainRule(), Rule::unique('users', 'email')],
            'password' => ['required_without:user_id', 'nullable', 'confirmed', Password::defaults()],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $id = $this->integer('user_id');

            if ($id <= 0) {
                return;
            }

            $user = User::find($id);

            if (! $user) {
                return; // sudah ditangani rule `exists`
            }

            // Siswa & orang tua tidak boleh merangkap jabatan kepegawaian:
            // `ScopesStudentsByRole` dan dashboard memilih cakupan data
            // berdasarkan peran, sehingga akun rangkap seperti ini akan melihat
            // dirinya sendiri sebagai siswa bimbingan dan bisa masuk ke antrean
            // persetujuannya sendiri.
            if ($user->hasAnyRole(Roles::EXCLUSIVE)) {
                $validator->errors()->add(
                    'user_id',
                    'Akun siswa atau orang tua tidak dapat diberi jabatan kepegawaian.',
                );

                return;
            }

            if ($user->hasRole($this->targetRole())) {
                $validator->errors()->add('user_id', 'Akun ini sudah memegang jabatan tersebut.');
            }
        }];
    }
}
