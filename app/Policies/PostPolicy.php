<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

/**
 * Wewenang forum.
 *
 * Perhatikan pembeda antara update() dan delete(): guru/kaprog boleh
 * MENGHAPUS tulisan siapa pun (itu moderasi), tapi tidak boleh MENGUBAHNYA.
 * Mengubah kalimat orang lain lalu membiarkannya tetap tampil atas nama
 * penulis aslinya adalah pemalsuan — hanya admin yang memegang wewenang itu,
 * dan pemakaiannya diharapkan langka (mis. memperbaiki judul menyesatkan).
 */
class PostPolicy
{
    /**
     * Role yang boleh memoderasi forum.
     *
     * Publik karena CommentPolicy memakai daftar yang sama — satu sumber,
     * bukan dua daftar yang bisa berbeda diam-diam.
     *
     * @var array<int, string>
     */
    public const MODERATORS = ['admin', 'kaprog', 'guru'];

    public function update(User $user, Post $post): bool
    {
        return $post->user_id === $user->id || $user->hasRole('admin');
    }

    public function delete(User $user, Post $post): bool
    {
        return $post->user_id === $user->id || $user->hasAnyRole(self::MODERATORS);
    }

    /** Tutup/buka diskusi & sematkan thread. */
    public function moderate(User $user): bool
    {
        return $user->hasAnyRole(self::MODERATORS);
    }
}
