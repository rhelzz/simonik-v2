<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

/**
 * Wewenang balasan forum.
 *
 * Berkas terpisah, bukan method di PostPolicy: Laravel menemukan policy dari
 * KELAS MODEL yang di-otorisasi, jadi `Gate::authorize('delete', $comment)`
 * hanya akan menemukan CommentPolicy. Menaruhnya di PostPolicy membuat
 * setiap pemeriksaan gagal 403 tanpa penjelasan.
 */
class CommentPolicy
{
    public function delete(User $user, Comment $comment): bool
    {
        // Daftar moderator dipakai bersama PostPolicy — satu sumber.
        return $comment->user_id === $user->id
            || $user->hasAnyRole(PostPolicy::MODERATORS);
    }
}
