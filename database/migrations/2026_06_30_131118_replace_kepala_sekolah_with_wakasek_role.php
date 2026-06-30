<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ganti peran kepala_sekolah → wakasek.
     *
     * Langkah:
     * 1. Hapus user yang HANYA memiliki role kepala_sekolah (akun demo).
     * 2. Hapus role kepala_sekolah dari tabel roles (bila ada).
     * 3. Pastikan role wakasek sudah ada.
     *
     * Tabel Spatie diakses langsung via DB:: agar migrasi tidak bergantung
     * pada model aplikasi yang bisa berubah di kemudian hari.
     */
    public function up(): void
    {
        $modelType = 'App\\Models\\User';

        // 1. Temukan role kepala_sekolah.
        $roleId = DB::table('roles')
            ->where('name', 'kepala_sekolah')
            ->where('guard_name', 'web')
            ->value('id');

        if ($roleId !== null) {
            // 2. Hapus user yang HANYA memiliki role kepala_sekolah.
            $kepalaUserIds = DB::table('model_has_roles')
                ->where('role_id', $roleId)
                ->where('model_type', $modelType)
                ->pluck('model_id');

            foreach ($kepalaUserIds as $userId) {
                $totalRoles = DB::table('model_has_roles')
                    ->where('model_id', $userId)
                    ->where('model_type', $modelType)
                    ->count();

                if ($totalRoles === 1) {
                    // Satu-satunya role adalah kepala_sekolah — hapus user ini.
                    DB::table('model_has_roles')
                        ->where('model_id', $userId)
                        ->where('model_type', $modelType)
                        ->delete();
                    DB::table('users')->where('id', $userId)->delete();
                }
            }

            // 3. Bersihkan sisa assignment role kepala_sekolah (bila ada user multi-role).
            DB::table('model_has_roles')
                ->where('role_id', $roleId)
                ->delete();

            // 4. Hapus role kepala_sekolah.
            DB::table('roles')->where('id', $roleId)->delete();
        }

        // 5. Pastikan role wakasek sudah ada.
        $exists = DB::table('roles')
            ->where('name', 'wakasek')
            ->where('guard_name', 'web')
            ->exists();

        if (! $exists) {
            DB::table('roles')->insert([
                'name' => 'wakasek',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Rollback: hanya hapus wakasek (tidak mengembalikan kepala_sekolah
     * karena user-nya sudah dihapus — tidak reversibel secara penuh).
     */
    public function down(): void
    {
        DB::table('roles')
            ->where('name', 'wakasek')
            ->where('guard_name', 'web')
            ->delete();
    }
};
