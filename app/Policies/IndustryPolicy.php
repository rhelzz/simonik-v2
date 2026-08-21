<?php

namespace App\Policies;

use App\Models\Departemen;
use App\Models\Industry;
use App\Models\User;

class IndustryPolicy
{
    /**
     * Ubah PROFIL industri (nama, bidang, alamat, jam kerja, durasi) — bukan
     * relasinya (guru pembimbing / pembimbing industri), yang tetap wewenang
     * admin & kaprog lewat halaman edit penuh.
     *
     * Aturannya sengaja identik dengan updateCoordinates: kalau seseorang
     * sudah boleh memindahkan titik absensi sebuah industri, ia boleh
     * memperbaiki alamatnya. Method terpisah agar maksudnya terbaca di titik
     * panggil dan agar aturannya bisa berbeda kelak tanpa mengubah yang lain.
     */
    public function updateProfile(User $user, Industry $industry): bool
    {
        return $this->updateCoordinates($user, $industry);
    }

    /**
     * Tentukan apakah user bisa mengupdate koordinat/radius industri.
     */
    public function updateCoordinates(User $user, Industry $industry): bool
    {
        // 1. Admin global
        if ($user->hasRole('admin')) {
            return true;
        }

        // 2. Kaprog jurusan (safety-net/safety check berdasarkan departemen guru pembimbing atau siswa magang)
        if ($user->hasRole('kaprog')) {
            $departemenId = Departemen::where('user_id', $user->id)->value('id');
            if ($departemenId) {
                // Relasi via guru pembimbing
                if ($industry->teachers && $industry->teachers->departemen_id === $departemenId) {
                    return true;
                }
                // Relasi via siswa yang ditempatkan
                if ($industry->students()->where('departemen_id', $departemenId)->exists()) {
                    return true;
                }
            }
        }

        // 3. Guru bimbingan
        if ($user->hasRole('guru')) {
            $teacherId = $user->teachers?->id;
            if ($teacherId && $industry->teacher_id === $teacherId) {
                return true;
            }
        }

        // 4. Pembimbing sendiri
        if ($user->hasRole('pembimbing')) {
            $pembimbingId = $user->pembimbing?->id;
            if ($pembimbingId && $industry->pembimbing_id === $pembimbingId) {
                return true;
            }
        }

        return false;
    }
}
