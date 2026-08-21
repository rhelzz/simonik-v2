<?php

namespace App\Actions;

use App\Models\Post;
use App\Models\Tag;
use App\Support\TagName;

/**
 * Ubah masukan tag mentah dari user menjadi relasi thread <-> tag.
 *
 * Dipakai dua tempat: saat thread dibuat dan saat diubah — memenuhi syarat
 * "abstraksi hanya kalau dipakai >=2 tempat".
 *
 * Tag yang belum ada DIBUAT di sini: itulah maksud "# dibebaskan" — kosakata
 * forum tumbuh dari pemakaian, bukan dari daftar yang ditetapkan admin.
 * Daftar admin (`is_suggested`) hanya menentukan mana yang ditawarkan sebagai
 * chip, bukan membatasi apa yang boleh ditulis.
 */
class SyncPostTags
{
    /**
     * Batas keras jumlah tag per thread.
     *
     * Ditegakkan di sini, BUKAN hanya di validasi/frontend: tanpa batas, satu
     * orang menempelkan 30 tag dan seluruh gagasan pengelompokan runtuh.
     */
    public const MAX_TAGS = 5;

    /**
     * @param  array<int, string|null>  $raw  masukan mentah (boleh berawalan '#',
     *                                        boleh null — lihat StorePostRequest)
     */
    public function handle(Post $post, array $raw): void
    {
        $ids = collect($raw)
            ->map(fn (?string $tag): string => TagName::normalise((string) $tag))
            // Kosong setelah normalisasi (mis. '###') dibuang diam-diam.
            ->filter()
            ->unique()
            ->take(self::MAX_TAGS)
            ->map(fn (string $name): int => Tag::firstOrCreate(['name' => $name])->id)
            ->all();

        $post->tags()->sync($ids);
    }
}
