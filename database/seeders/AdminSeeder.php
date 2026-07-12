<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seed hanya akun admin (tanpa data demo lainnya).
 *
 * Jalankan dengan: php artisan db:seed --class=AdminSeeder
 * Password default: password
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $admin = User::firstOrCreate(
            ['email' => 'admin@simonik.local'],
            [
                'name' => 'Admin',
                'password' => 'password',
            ]
        );

        if (! $admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }
    }
}
