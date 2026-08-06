<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hapus massal adalah tempat paling mudah untuk tidak sengaja melewati
 * otorisasi, jadi setiap id tetap melewati gerbang yang sama dengan hapus
 * satuan.
 */
class StudentBulkDestroyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    private function student(?Departemen $departemen = null): Student
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');

        return Student::factory()->create([
            'user_id' => $user->id,
            'departemen_id' => $departemen?->id,
        ]);
    }

    /**
     * Sekaligus membuktikan `students/bulk` dideklarasikan sebelum
     * `Route::resource` — kalau tidak, ia terbaca sebagai `students/{student}`
     * dan request ini tidak akan pernah sampai ke `bulkDestroy()`.
     */
    public function test_admin_dapat_menghapus_beberapa_siswa_sekaligus(): void
    {
        $a = $this->student();
        $b = $this->student();
        $c = $this->student();

        $this->actingAs($this->admin())
            ->delete('/students/bulk', ['ids' => [$a->id, $b->id]])
            ->assertRedirect(route('students.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('students', ['id' => $a->id]);
        $this->assertDatabaseMissing('students', ['id' => $b->id]);
        $this->assertDatabaseHas('students', ['id' => $c->id]);

        // Akun loginnya ikut terhapus, sama seperti hapus satuan.
        $this->assertDatabaseMissing('users', ['id' => $a->user_id]);
    }

    public function test_kaprog_tidak_dapat_menghapus_siswa_di_luar_jurusannya(): void
    {
        $kaprogUser = User::factory()->create();
        $kaprogUser->assignRole('kaprog');
        $milik = Departemen::factory()->create(['user_id' => $kaprogUser->id]);
        $lain = Departemen::factory()->create();

        $dalam = $this->student($milik);
        $luar = $this->student($lain);

        $this->actingAs($kaprogUser)
            ->delete('/students/bulk', ['ids' => [$dalam->id, $luar->id]])
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('students', ['id' => $dalam->id]);
        $this->assertDatabaseHas('students', ['id' => $luar->id]);
    }

    public function test_ids_kosong_ditolak(): void
    {
        $this->actingAs($this->admin())
            ->delete('/students/bulk', ['ids' => []])
            ->assertSessionHasErrors('ids');
    }

    public function test_lebih_dari_200_id_ditolak(): void
    {
        $this->actingAs($this->admin())
            ->delete('/students/bulk', ['ids' => range(1, 201)])
            ->assertSessionHasErrors('ids');
    }

    public function test_siswa_tidak_dapat_menghapus_massal(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $target = $this->student();

        $this->actingAs($siswa)
            ->delete('/students/bulk', ['ids' => [$target->id]])
            ->assertForbidden();

        $this->assertDatabaseHas('students', ['id' => $target->id]);
    }

    public function test_kelas_siswa_tidak_ikut_terhapus(): void
    {
        $class = Classes::factory()->create();
        $student = $this->student();
        $student->update(['class_id' => $class->id]);

        $this->actingAs($this->admin())
            ->delete('/students/bulk', ['ids' => [$student->id]]);

        $this->assertDatabaseHas('classes', ['id' => $class->id]);
    }
}
