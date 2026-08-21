<?php

namespace App\Http\Controllers;

use App\Actions\SyncPostTags;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Forum PKL — tanya-jawab antar-role, dikelompokkan lewat tag bebas ber-'#'.
 *
 * Sengaja TIDAK dibatasi per-industri/jurusan: forum yang terlanjur terpecah
 * jadi puluhan ruang sepi jauh lebih sulit dibubarkan daripada forum ramai
 * yang perlu dipecah.
 */
class ForumController extends Controller
{
    public function __construct(private readonly SyncPostTags $syncTags) {}

    /**
     * Daftar thread: sematan lebih dulu, lalu terbaru.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $search = trim((string) $request->query('cari', ''));
        $tag = trim((string) $request->query('tag', ''));

        $threads = Post::query()
            ->withTag($tag)
            ->when($search !== '', fn (Builder $query) => $query->where('title', 'like', "%{$search}%"))
            ->with(['user:id,name', 'tags:id,name'])
            ->withCount('comments')
            ->orderByDesc('important')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Post $post): array => $this->presentThread($post));

        return Inertia::render('forum/index', [
            'threads' => $threads,
            'filters' => ['cari' => $search, 'tag' => $tag],
            'suggestedTags' => $this->suggestedTags(),
            'can' => ['moderate' => $user->can('moderate', Post::class)],
        ]);
    }

    /**
     * Satu thread beserta balasannya.
     */
    public function show(Request $request, Post $post): Response
    {
        /** @var User $user */
        $user = $request->user();

        $post->load(['user:id,name', 'tags:id,name']);

        $comments = $post->comments()
            ->with('user:id,name')
            ->oldest('id')
            ->paginate(20)
            ->through(fn (Comment $comment): array => [
                'id' => $comment->id,
                'content' => $comment->content,
                'author' => $comment->user?->name,
                'createdAt' => $comment->created_at?->translatedFormat('d M Y, H:i'),
                'canDelete' => $user->can('delete', $comment),
            ]);

        return Inertia::render('forum/show', [
            'thread' => [
                ...$this->presentThread($post),
                'content' => $post->content,
            ],
            'comments' => $comments,
            'can' => [
                'edit' => $user->can('update', $post),
                'delete' => $user->can('delete', $post),
                'moderate' => $user->can('moderate', Post::class),
            ],
            'suggestedTags' => $this->suggestedTags(),
        ]);
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $post = Post::create([
            'user_id' => (int) $request->user()->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
        ]);

        $this->syncTags->handle($post, $validated['tags'] ?? []);

        return redirect()
            ->route('forum.show', $post)
            ->with('success', 'Diskusi berhasil dibuat.');
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        $validated = $request->validated();

        $post->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
        ]);

        $this->syncTags->handle($post, $validated['tags'] ?? []);

        return back()->with('success', 'Diskusi berhasil diperbarui.');
    }

    public function destroy(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('delete', $post);

        // Komentar & pivot ikut terhapus lewat cascadeOnDelete di skema.
        $post->delete();

        return redirect()
            ->route('forum.index')
            ->with('success', 'Diskusi berhasil dihapus.');
    }

    /**
     * Tutup atau buka kembali diskusi (guru ke atas).
     */
    public function toggleClose(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('moderate', Post::class);

        $post->update(['is_closed' => ! $post->is_closed]);

        return back()->with('success', $post->is_closed
            ? 'Diskusi ditutup.'
            : 'Diskusi dibuka kembali.');
    }

    /**
     * Sematkan thread di atas daftar. Memakai ulang kolom `important` yang
     * sudah ada sejak skema awal — tidak perlu kolom is_pinned baru.
     */
    public function togglePin(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('moderate', Post::class);

        $post->update(['important' => ! $post->important]);

        return back()->with('success', $post->important
            ? 'Diskusi disematkan.'
            : 'Sematan dilepas.');
    }

    public function storeComment(StoreCommentRequest $request, Post $post): RedirectResponse
    {
        // Dijaga di server, bukan hanya dengan menyembunyikan form: thread bisa
        // ditutup tepat setelah halaman dimuat.
        if ($post->is_closed) {
            return back()->withErrors(['content' => 'Diskusi ini sudah ditutup.']);
        }

        $post->comments()->create([
            'user_id' => (int) $request->user()->id,
            'content' => $request->validated()['content'],
        ]);

        return back()->with('success', 'Balasan terkirim.');
    }

    public function destroyComment(Request $request, Comment $comment): RedirectResponse
    {
        Gate::authorize('delete', $comment);

        $comment->delete();

        return back()->with('success', 'Balasan dihapus.');
    }

    /**
     * Bentuk satu thread untuk daftar & halaman detail.
     *
     * @return array<string, mixed>
     */
    private function presentThread(Post $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'author' => $post->user?->name,
            'tags' => $post->tags->pluck('name')->all(),
            'replies' => (int) ($post->comments_count ?? $post->comments()->count()),
            'pinned' => $post->important,
            'closed' => $post->is_closed,
            'createdAt' => $post->created_at?->translatedFormat('d M Y, H:i'),
        ];
    }

    /**
     * Tag saran untuk chip di form.
     *
     * @return array<int, string>
     */
    private function suggestedTags(): array
    {
        return Tag::query()
            ->where('is_suggested', true)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }
}
