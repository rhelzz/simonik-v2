<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * v2.5 Fase 28 — Forum PKL: thread, tag, balasan.
 */
class ForumTest extends TestCase
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

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Kendala absen di lokasi baru',
            'content' => 'GPS saya selalu di luar radius, apa yang harus dilakukan?',
            'tags' => ['#absen', 'ask'],
        ], $overrides);
    }

    public function test_any_role_can_create_thread_and_reply(): void
    {
        foreach (['siswa', 'guru', 'pembimbing', 'orangtua', 'admin'] as $role) {
            $this->actingAs($this->user($role))
                ->post('/forum', $this->payload())
                ->assertRedirect();
        }

        $this->assertDatabaseCount('posts', 5);

        $post = Post::query()->firstOrFail();

        $this->actingAs($this->user('siswa'))
            ->post("/forum/{$post->id}/komentar", ['content' => 'Coba mode WFA.'])
            ->assertRedirect();

        $this->assertDatabaseCount('comments', 1);
    }

    /**
     * Tag lahir dari pemakaian ("# dibebaskan") tapi TIDAK diduplikasi:
     * dua thread ber-#ask harus memakai satu baris tag yang sama.
     */
    public function test_tags_are_created_and_reused(): void
    {
        $siswa = $this->user('siswa');

        $this->actingAs($siswa)->post('/forum', $this->payload(['tags' => ['#ask']]));
        $this->actingAs($siswa)->post('/forum', $this->payload(['tags' => ['ask', 'ASK']]));

        $this->assertDatabaseCount('tags', 1);
        $this->assertDatabaseHas('tags', ['name' => 'ask']);
        $this->assertDatabaseCount('post_tag', 2);
    }

    /**
     * Batas ditegakkan di SERVER, bukan hanya di UI — tanpa itu satu orang
     * menempelkan 30 tag dan pengelompokan runtuh.
     */
    public function test_thread_is_limited_to_five_tags(): void
    {
        $this->actingAs($this->user('siswa'))
            ->post('/forum', $this->payload([
                'tags' => ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'],
            ]))
            ->assertSessionHasErrors('tags');

        $this->assertDatabaseCount('posts', 0);
    }

    public function test_garbage_tags_are_dropped_silently(): void
    {
        $this->actingAs($this->user('siswa'))
            ->post('/forum', $this->payload(['tags' => ['###', '   ', '#absen']]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('tags', 1);
        $this->assertDatabaseHas('tags', ['name' => 'absen']);
    }

    /**
     * Inti pengelompokan — dan harus TERPAGINASI, bukan disaring di PHP.
     */
    public function test_index_can_filter_by_tag(): void
    {
        $siswa = $this->user('siswa');

        $this->actingAs($siswa)->post('/forum', $this->payload([
            'title' => 'Soal absen',
            'tags' => ['absen'],
        ]));
        $this->actingAs($siswa)->post('/forum', $this->payload([
            'title' => 'Soal jurnal',
            'tags' => ['jurnal'],
        ]));

        $this->actingAs($siswa)
            ->get('/forum?tag=absen')
            ->assertInertia(fn (Assert $page) => $page
                ->component('forum/index')
                ->has('threads.data', 1)
                ->where('threads.data.0.title', 'Soal absen')
            );

        // Ejaan berbeda harus menemukan kelompok yang sama.
        $this->actingAs($siswa)
            ->get('/forum?tag=%23ABSEN')
            ->assertInertia(fn (Assert $page) => $page->has('threads.data', 1));
    }

    public function test_pinned_threads_appear_first(): void
    {
        $siswa = $this->user('siswa');

        $this->actingAs($siswa)->post('/forum', $this->payload(['title' => 'Biasa']));
        $this->actingAs($siswa)->post('/forum', $this->payload(['title' => 'Penting']));

        Post::query()->where('title', 'Penting')->update(['important' => true]);

        $this->actingAs($siswa)
            ->get('/forum')
            ->assertInertia(fn (Assert $page) => $page
                ->where('threads.data.0.title', 'Penting')
                ->where('threads.data.0.pinned', true)
            );
    }

    /**
     * Dijaga di server: thread bisa ditutup tepat setelah halaman dimuat.
     */
    public function test_cannot_reply_to_closed_thread(): void
    {
        $siswa = $this->user('siswa');
        $this->actingAs($siswa)->post('/forum', $this->payload());

        $post = Post::query()->firstOrFail();
        $post->update(['is_closed' => true]);

        $this->actingAs($siswa)
            ->post("/forum/{$post->id}/komentar", ['content' => 'Nyelip'])
            ->assertSessionHasErrors('content');

        $this->assertDatabaseCount('comments', 0);
    }

    /**
     * Isi forum ditulis SISWA, jadi disimpan sebagai teks biasa — bukan HTML.
     * Yang masuk harus keluar apa adanya, tanpa pernah dianggap markup.
     */
    public function test_body_is_stored_as_plain_text(): void
    {
        $jahat = '<script>alert("xss")</script> **bukan markdown**';

        $this->actingAs($this->user('siswa'))
            ->post('/forum', $this->payload(['content' => $jahat]))
            ->assertRedirect();

        $this->assertSame($jahat, Post::query()->firstOrFail()->content);
    }

    public function test_suggested_tags_are_offered_on_the_index(): void
    {
        Tag::factory()->suggested()->create(['name' => 'ask']);
        Tag::factory()->create(['name' => 'acak']);

        $this->actingAs($this->user('siswa'))
            ->get('/forum')
            ->assertInertia(fn (Assert $page) => $page
                ->has('suggestedTags', 1)
                ->where('suggestedTags.0', 'ask')
            );
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/forum')->assertRedirect('/login');
    }
}
