<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * v2.5 Fase 28 — moderasi forum & kelola tag.
 */
class ForumModerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function threadBy(User $author): Post
    {
        $post = Post::query()->create([
            'user_id' => $author->id,
            'title' => 'Judul asli',
            'content' => 'Isi asli',
        ]);

        $post->tags()->attach(Tag::query()->create(['name' => 'ask'])->id);

        return $post;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        return [
            'title' => 'Judul diubah',
            'content' => 'Isi diubah',
            'tags' => ['ask'],
        ];
    }

    public function test_author_can_edit_and_delete_own_thread(): void
    {
        $siswa = $this->user('siswa');
        $post = $this->threadBy($siswa);

        $this->actingAs($siswa)
            ->patch("/forum/{$post->id}", $this->payload())
            ->assertRedirect();

        $this->assertSame('Judul diubah', $post->fresh()?->title);

        $this->actingAs($siswa)->delete("/forum/{$post->id}")->assertRedirect();
        $this->assertDatabaseCount('posts', 0);
    }

    public function test_student_cannot_edit_another_students_thread(): void
    {
        $post = $this->threadBy($this->user('siswa'));

        $this->actingAs($this->user('siswa'))
            ->patch("/forum/{$post->id}", $this->payload())
            ->assertForbidden();

        $this->assertSame('Judul asli', $post->fresh()?->title);
    }

    /**
     * INTI §2.7: guru boleh MENGHAPUS tulisan orang (itu moderasi), tapi tidak
     * boleh MENGUBAHNYA — mengubah kalimat orang lain lalu membiarkannya
     * tampil atas nama penulis aslinya adalah pemalsuan.
     */
    public function test_guru_can_delete_any_thread_but_cannot_edit_it(): void
    {
        $post = $this->threadBy($this->user('siswa'));
        $guru = $this->user('guru');

        $this->actingAs($guru)
            ->patch("/forum/{$post->id}", $this->payload())
            ->assertForbidden();

        $this->assertSame('Judul asli', $post->fresh()?->title);

        $this->actingAs($guru)->delete("/forum/{$post->id}")->assertRedirect();
        $this->assertDatabaseCount('posts', 0);
    }

    /** Permintaan user: "admin bisa control kaya hapus judul, dan lain lainnya". */
    public function test_admin_can_edit_any_thread_title(): void
    {
        $post = $this->threadBy($this->user('siswa'));

        $this->actingAs($this->user('admin'))
            ->patch("/forum/{$post->id}", $this->payload())
            ->assertRedirect();

        $this->assertSame('Judul diubah', $post->fresh()?->title);
    }

    public function test_moderators_can_close_and_pin_but_students_cannot(): void
    {
        $post = $this->threadBy($this->user('siswa'));
        $guru = $this->user('guru');

        $this->actingAs($guru)->patch("/forum/{$post->id}/tutup")->assertRedirect();
        $this->assertTrue($post->fresh()?->is_closed);

        $this->actingAs($guru)->patch("/forum/{$post->id}/sematkan")->assertRedirect();
        $this->assertTrue($post->fresh()?->important);

        $this->actingAs($this->user('siswa'))
            ->patch("/forum/{$post->id}/tutup")
            ->assertForbidden();
    }

    public function test_guru_can_delete_any_comment(): void
    {
        $post = $this->threadBy($this->user('siswa'));
        $comment = Comment::query()->create([
            'post_id' => $post->id,
            'user_id' => $this->user('siswa')->id,
            'content' => 'Tidak pantas',
        ]);

        $this->actingAs($this->user('guru'))
            ->delete("/forum/komentar/{$comment->id}")
            ->assertRedirect();

        $this->assertDatabaseCount('comments', 0);
    }

    public function test_student_cannot_delete_another_students_comment(): void
    {
        $post = $this->threadBy($this->user('siswa'));
        $comment = Comment::query()->create([
            'post_id' => $post->id,
            'user_id' => $this->user('siswa')->id,
            'content' => 'Punya orang lain',
        ]);

        $this->actingAs($this->user('siswa'))
            ->delete("/forum/komentar/{$comment->id}")
            ->assertForbidden();

        $this->assertDatabaseCount('comments', 1);
    }

    public function test_deleting_thread_removes_its_comments_and_pivot(): void
    {
        $siswa = $this->user('siswa');
        $post = $this->threadBy($siswa);

        Comment::query()->create([
            'post_id' => $post->id,
            'user_id' => $siswa->id,
            'content' => 'Balasan',
        ]);

        $this->actingAs($siswa)->delete("/forum/{$post->id}")->assertRedirect();

        $this->assertDatabaseCount('comments', 0);
        $this->assertDatabaseCount('post_tag', 0);
        // Tag-nya sendiri TIDAK ikut hilang — masih bisa dipakai thread lain.
        $this->assertDatabaseCount('tags', 1);
    }

    public function test_only_admin_can_manage_tags(): void
    {
        $tag = Tag::query()->create(['name' => 'ask']);

        foreach (['siswa', 'guru', 'kaprog', 'pembimbing'] as $role) {
            $this->actingAs($this->user($role))->get('/forum-tag')->assertForbidden();
            $this->actingAs($this->user($role))
                ->patch("/forum-tag/{$tag->id}", ['name' => 'ubah', 'is_suggested' => true])
                ->assertForbidden();
        }

        $this->actingAs($this->user('admin'))->get('/forum-tag')->assertOk();
    }

    /**
     * Rute literal `forum-tag` tidak boleh tertangkap sebagai `forum/{post}`.
     */
    public function test_tag_route_is_not_swallowed_by_the_thread_route(): void
    {
        $this->actingAs($this->user('admin'))
            ->get('/forum-tag')
            ->assertInertia(fn ($page) => $page->component('forum-tags/index'));
    }

    public function test_admin_can_rename_tag_and_name_is_normalised(): void
    {
        $tag = Tag::query()->create(['name' => 'absensi']);

        $this->actingAs($this->user('admin'))
            ->patch("/forum-tag/{$tag->id}", ['name' => '#Absen Baru', 'is_suggested' => true])
            ->assertRedirect();

        $fresh = $tag->fresh();
        $this->assertSame('absen-baru', $fresh?->name);
        $this->assertTrue($fresh?->is_suggested);
    }

    public function test_deleting_tag_keeps_the_threads(): void
    {
        $post = $this->threadBy($this->user('siswa'));
        $tag = Tag::query()->firstOrFail();

        $this->actingAs($this->user('admin'))
            ->delete("/forum-tag/{$tag->id}")
            ->assertRedirect();

        $this->assertDatabaseCount('tags', 0);
        $this->assertDatabaseCount('post_tag', 0);
        $this->assertDatabaseHas('posts', ['id' => $post->id]);
    }
}
