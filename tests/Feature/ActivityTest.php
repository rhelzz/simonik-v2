<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ActivityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function siswa(): User
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'judul' => 'Membuat halaman login',
            'date' => '2026-06-01',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'description' => '<p>Uraian kegiatan hari ini.</p>',
            'tools' => 'Laptop, VS Code',
            ...$overrides,
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/jurnal')->assertRedirect('/login');
    }

    public function test_non_students_are_forbidden(): void
    {
        $this->actingAs($this->user('admin'))
            ->get('/jurnal')
            ->assertForbidden();
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    public function test_student_sees_only_own_journals(): void
    {
        $siswa = $this->siswa();
        Activity::factory()->create(['user_id' => $siswa->id]);
        Activity::factory()->create(['user_id' => $this->siswa()->id]);

        $this->actingAs($siswa)
            ->get('/jurnal')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('activities/index')
                ->has('activities.data', 1)
            );
    }

    public function test_student_can_create_journal(): void
    {
        $siswa = $this->siswa();

        $this->actingAs($siswa)
            ->post('/jurnal', $this->payload())
            ->assertRedirect('/jurnal')
            ->assertSessionHas('success');

        $this->assertDatabaseHas('activities', [
            'user_id' => $siswa->id,
            'judul' => 'Membuat halaman login',
        ]);
    }

    public function test_end_time_must_be_after_start_time(): void
    {
        $this->actingAs($this->siswa())
            ->post('/jurnal', $this->payload([
                'start_time' => '12:00',
                'end_time' => '08:00',
            ]))
            ->assertSessionHasErrors('end_time');
    }

    public function test_description_is_required(): void
    {
        $this->actingAs($this->siswa())
            ->post('/jurnal', $this->payload(['description' => '']))
            ->assertSessionHasErrors('description');
    }

    public function test_student_can_store_image(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $this->actingAs($siswa)
            ->post('/jurnal', $this->payload([
                'image' => UploadedFile::fake()->image('kegiatan.jpg'),
            ]))
            ->assertRedirect('/jurnal');

        $activity = Activity::where('user_id', $siswa->id)->firstOrFail();
        $this->assertNotNull($activity->getRawOriginal('image'));
        Storage::disk('public')->assertExists($activity->getRawOriginal('image'));
    }

    public function test_student_can_update_own_journal(): void
    {
        $siswa = $this->siswa();
        $activity = Activity::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->put("/jurnal/{$activity->id}", $this->payload(['judul' => 'Judul baru']))
            ->assertRedirect('/jurnal');

        $this->assertDatabaseHas('activities', [
            'id' => $activity->id,
            'judul' => 'Judul baru',
        ]);
    }

    public function test_student_cannot_update_others_journal(): void
    {
        $activity = Activity::factory()->create(['user_id' => $this->siswa()->id]);

        $this->actingAs($this->siswa())
            ->put("/jurnal/{$activity->id}", $this->payload())
            ->assertForbidden();
    }

    public function test_student_can_delete_own_journal(): void
    {
        $siswa = $this->siswa();
        $activity = Activity::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->delete("/jurnal/{$activity->id}")
            ->assertRedirect('/jurnal');

        $this->assertDatabaseMissing('activities', ['id' => $activity->id]);
    }

    public function test_student_cannot_delete_others_journal(): void
    {
        $activity = Activity::factory()->create(['user_id' => $this->siswa()->id]);

        $this->actingAs($this->siswa())
            ->delete("/jurnal/{$activity->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('activities', ['id' => $activity->id]);
    }
}
