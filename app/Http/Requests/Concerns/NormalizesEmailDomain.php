<?php

namespace App\Http\Requests\Concerns;

use App\Support\ImportDefaults;

/**
 * Semua akun yang dibuat dari dalam aplikasi memakai satu domain
 * (`@simonik.local`), supaya operator tidak perlu mengingat variasi domain
 * per orang.
 *
 * Form hanya meminta bagian username; domainnya disusun di sini. Nilai yang
 * sudah lengkap (memuat "@") dibiarkan apa adanya.
 */
trait NormalizesEmailDomain
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('email')) {
            $this->merge([
                'email' => ImportDefaults::email((string) $this->input('email')),
            ]);
        }
    }

    /**
     * Aturan email untuk pembuatan akun baru: wajib berdomain baku.
     *
     * Sekadar jaring pengaman — `prepareForValidation()` sudah menormalkan
     * masukan dari UI, jadi aturan ini hanya menangkap request yang menyimpang
     * (POST langsung, skrip, bug frontend).
     *
     * Sengaja **tidak** dipakai pada form ubah: akun lama boleh berdomain apa
     * pun, dan menolak email mereka saat disunting sama dengan memaksa migrasi
     * kredensial yang tidak diminta siapa pun.
     *
     * @return array<int, string>
     */
    protected function emailDomainRule(): array
    {
        return ['ends_with:@'.ImportDefaults::EMAIL_DOMAIN];
    }
}
