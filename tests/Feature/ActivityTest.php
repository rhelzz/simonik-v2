<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
    private function validPayload(): array
    {
        return [
            'judul' => 'Setup proyek Laravel',
            'date' => '2026-02-01',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'description' => '<p>Membuat <strong>migration</strong> dan model.</p>',
            'tools' => 'Laptop, VS Code',
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/activities')->assertRedirect('/login');
    }

    public function test_non_students_are_forbidden(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->get('/activities')->assertForbidden();
    }

    public function test_student_can_view_own_journal_list(): void
    {
        $this->actingAs($this->siswa())->get('/activities')->assertOk();
    }

    public function test_student_can_create_a_journal_entry(): void
    {
        $siswa = $this->siswa();

        $this->actingAs($siswa)
            ->post('/activities', $this->validPayload())
            ->assertRedirect(route('activities.index'));

        $this->assertDatabaseHas('activities', [
            'user_id' => $siswa->id,
            'judul' => 'Setup proyek Laravel',
        ]);
    }

    public function test_create_validates_required_fields(): void
    {
        $this->actingAs($this->siswa())
            ->post('/activities', [])
            ->assertSessionHasErrors(['judul', 'date', 'start_time', 'end_time', 'description', 'tools']);
    }

    public function test_student_can_update_own_journal(): void
    {
        $siswa = $this->siswa();
        $activity = Activity::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->put("/activities/{$activity->id}", [
                ...$this->validPayload(),
                'judul' => 'Judul diperbarui',
            ])
            ->assertRedirect(route('activities.index'));

        $this->assertDatabaseHas('activities', [
            'id' => $activity->id,
            'judul' => 'Judul diperbarui',
        ]);
    }

    public function test_student_cannot_edit_another_students_journal(): void
    {
        $owner = $this->siswa();
        $activity = Activity::factory()->create(['user_id' => $owner->id]);

        $intruder = $this->siswa();

        $this->actingAs($intruder)
            ->get("/activities/{$activity->id}/edit")
            ->assertForbidden();

        $this->actingAs($intruder)
            ->put("/activities/{$activity->id}", $this->validPayload())
            ->assertForbidden();
    }

    public function test_student_can_delete_own_journal(): void
    {
        $siswa = $this->siswa();
        $activity = Activity::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->delete("/activities/{$activity->id}")
            ->assertRedirect(route('activities.index'));

        $this->assertDatabaseMissing('activities', ['id' => $activity->id]);
    }

    public function test_student_cannot_delete_another_students_journal(): void
    {
        $owner = $this->siswa();
        $activity = Activity::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($this->siswa())
            ->delete("/activities/{$activity->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('activities', ['id' => $activity->id]);
    }
}
