<?php

namespace App\Http\Requests;

/**
 * Kriteria reset + verifikasi password akun yang sedang login.
 *
 * Dipakai modul Data Absen maupun Data Jurnal.
 *
 * `current_password` adalah aturan bawaan Laravel (timing-safe, pesan
 * terlokalisasi) — tidak menulis Hash::check() manual di controller.
 *
 * Middleware `password.confirm` bawaan Laravel DITOLAK untuk aksi ini: ia
 * memakai session (`auth.password_timeout`, default 3 jam), sehingga reset
 * kedua dalam 3 jam tidak akan meminta password lagi. Untuk aksi yang
 * menghapus ribuan baris permanen, "sudah dikonfirmasi 2 jam lalu" bukan
 * konfirmasi.
 */
class ResetRecordsRequest extends PreviewResetRecordsRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'password' => ['required', 'current_password'],
        ]);
    }
}
