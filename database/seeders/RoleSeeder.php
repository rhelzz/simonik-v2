<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Daftar peran kanonik aplikasi (guard `web` untuk auth session/Inertia).
     *
     * @var list<string>
     */
    public const ROLES = [
        'admin',
        'wakasek',
        'kaprog',
        'guru',
        'pembimbing',
        'siswa',
        'orangtua',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::ROLES as $name) {
            Role::findOrCreate($name, 'web');
        }
    }
}
