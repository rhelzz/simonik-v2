<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Membuat satu akun demo per peran (password: `password`).
     */
    public function run(): void
    {
        foreach (RoleSeeder::ROLES as $role) {
            $user = User::firstOrCreate(
                ['email' => $role.'@simonik.test'],
                [
                    'name' => 'Demo '.ucfirst($role),
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );

            $user->syncRoles([$role]);
        }
    }
}
