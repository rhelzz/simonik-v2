<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateTagRequest;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola tag forum — admin saja.
 *
 * Gunanya bukan membatasi apa yang boleh ditulis user (tag tetap bebas),
 * melainkan merapikan: mengubah nama tag yang salah eja, dan menentukan mana
 * yang ditawarkan sebagai chip saran.
 */
class TagController extends Controller
{
    public function index(): Response
    {
        $tags = Tag::query()
            ->withCount('posts')
            ->orderByDesc('is_suggested')
            ->orderByDesc('posts_count')
            ->orderBy('name')
            ->paginate(30)
            ->through(fn (Tag $tag): array => [
                'id' => $tag->id,
                'name' => $tag->name,
                'isSuggested' => $tag->is_suggested,
                'threads' => (int) $tag->getAttribute('posts_count'),
            ]);

        return Inertia::render('forum-tags/index', [
            'tags' => $tags,
        ]);
    }

    public function update(UpdateTagRequest $request, Tag $tag): RedirectResponse
    {
        $tag->update($request->validated());

        return back()->with('success', 'Tag berhasil diperbarui.');
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        // Hanya pivot yang ikut hilang (cascadeOnDelete di post_tag) —
        // thread-nya TIDAK terhapus, hanya kehilangan label ini.
        $tag->delete();

        return back()->with('success', 'Tag dihapus. Diskusinya tetap ada.');
    }
}
