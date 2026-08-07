<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Satu orang boleh memegang beberapa jabatan dengan satu akun login.
 *
 * Sebelumnya tiap modul kepegawaian (kaprog/guru/pembimbing/wakasek) selalu
 * membuat baris `users` baru dengan email unik global, sehingga seorang guru
 * yang juga kaprog terpaksa punya dua akun dan dua kata sandi — penyebab
 * keluhan "akun bentrok, tidak bisa login". Spatie sudah menyimpan peran
 * many-to-many, jadi yang perlu diperbaiki hanya alur create/destroy-nya.
 */
trait ResolvesRoleAccount
{
    /**
     * Ambil akun yang dipilih operator, atau buat yang baru — lalu pastikan ia
     * punya $role. Bersifat aditif: peran lain milik akun itu tidak disentuh.
     *
     * @param  array<string, mixed>  $data
     */
    protected function accountFor(array $data, string $role): User
    {
        $user = empty($data['user_id'])
            ? User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ])
            : User::findOrFail((int) $data['user_id']);

        $user->assignRole($role); // no-op bila sudah punya

        return $user;
    }

    /**
     * Cabut $role dari akun. Akun yang tidak lagi punya peran apa pun ikut
     * dihapus — tanpa peran ia tidak bisa membuka apa pun.
     *
     * Ini menggantikan `$user->delete()` yang lama: menghapus baris `users`
     * seorang guru hanya karena jabatan kaprognya dicabut akan sekalian
     * mematikan akses guru pembimbingnya.
     *
     * @return bool true bila akunnya ikut dihapus (peran terakhir)
     */
    protected function detachRole(User $user, string $role): bool
    {
        $user->removeRole($role);

        if ($user->roles()->count() > 0) {
            return false;
        }

        $user->delete();

        return true;
    }

    /**
     * Pesan hasil pencabutan peran, jujur membedakan akun yang ikut terhapus
     * dari akun yang tetap hidup dengan jabatan lainnya.
     */
    protected function detachMessage(User $user, bool $deleted, string $label): string
    {
        if ($deleted) {
            return "{$label} berhasil dihapus.";
        }

        $others = $user->getRoleNames()->map(fn (string $r) => Roles::label($r))->implode(', ');

        return "Jabatan {$label} dicabut. Akun {$user->name} tetap aktif sebagai {$others}.";
    }

    /**
     * Kandidat akun yang bisa diberi $role, dicari dari nama/email.
     *
     * Dikembalikan sebagai prop halaman (partial reload), bukan endpoint JSON
     * terpisah — halaman tetap menjadi fungsi dari propnya.
     *
     * @return array<int, array{id: int, name: string, email: string, roles: array<int, string>}>
     */
    protected function accountCandidates(Request $request, string $role): array
    {
        $search = trim((string) $request->query('q', ''));

        if (mb_strlen($search) < 2) {
            return [];
        }

        return User::query()
            ->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            // Hanya akun staf sekolah yang boleh dirangkap (lihat
            // `Roles::LINKABLE`) — daftar "semua akun" membuat form Kaprog
            // menawarkan admin dan pembimbing industri yang tidak masuk akal.
            ->whereHas('roles', fn ($query) => $query->whereIn('name', Roles::LINKABLE))
            // Sudah memegang jabatan ini, atau berperan eksklusif (siswa/orang
            // tua) yang tidak boleh dirangkap dengan jabatan kepegawaian.
            ->whereDoesntHave('roles', fn ($query) => $query->whereIn('name', [$role, ...Roles::EXCLUSIVE]))
            ->orderBy('name')
            ->limit(10)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames()->map(fn (string $r) => Roles::label($r))->all(),
            ])
            ->all();
    }
}
