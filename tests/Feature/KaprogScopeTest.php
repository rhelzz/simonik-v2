<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Kaprog hanya berwenang atas program keahlian yang dipimpinnya. Sebelumnya
 * `scopedStudents()` menyamakan kaprog dengan admin, sehingga seluruh siswa
 * lintas jurusan ikut terlihat di Data Siswa, Penilaian, Monitoring, dan Rapor.
 */
class KaprogScopeTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, mixed> */
    private array $scene;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $kaprogUser = User::factory()->create();
        $kaprogUser->assignRole('kaprog');

        $own = Departemen::factory()->create(['user_id' => $kaprogUser->id]);
        $other = Departemen::factory()->create();

        $this->scene = [
            'kaprog' => $kaprogUser,
            'ownStudent' => Student::factory()->create([
                'departemen_id' => $own->id,
                'class_id' => Classes::factory()->create(['departemen_id' => $own->id])->id,
            ]),
            'otherStudent' => Student::factory()->create([
                'departemen_id' => $other->id,
                'class_id' => Classes::factory()->create(['departemen_id' => $other->id])->id,
            ]),
            'own' => $own,
            'other' => $other,
        ];
    }

    public function test_student_list_only_shows_own_departemen(): void
    {
        $this->actingAs($this->scene['kaprog'])
            ->get('/students')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('students.data', 1)
                ->where('students.data.0.id', $this->scene['ownStudent']->id)
            );
    }

    public function test_student_detail_of_other_departemen_is_forbidden(): void
    {
        $kaprog = $this->scene['kaprog'];
        $foreign = $this->scene['otherStudent'];

        $this->actingAs($kaprog)->get("/students/{$foreign->id}")->assertForbidden();
        $this->actingAs($kaprog)->get("/students/{$foreign->id}/edit")->assertForbidden();
        $this->actingAs($kaprog)->delete("/students/{$foreign->id}")->assertForbidden();

        $this->assertDatabaseHas('students', ['id' => $foreign->id]);
    }

    public function test_own_student_detail_stays_reachable(): void
    {
        $this->actingAs($this->scene['kaprog'])
            ->get("/students/{$this->scene['ownStudent']->id}")
            ->assertOk();
    }

    public function test_monitoring_only_lists_own_departemen(): void
    {
        $this->actingAs($this->scene['kaprog'])
            ->get('/monitoring/absen')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('departemens', 1)
                ->where('departemens.0.id', $this->scene['own']->id)
            );
    }

    public function test_admin_still_sees_every_departemen(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/monitoring/absen')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('departemens', 2));
    }
}
