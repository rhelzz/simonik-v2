<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Pembimbing;
use App\Models\PKLPeriod;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Seeder untuk data awal (Starter Data).
 *
 * Membuat satu set data lengkap dan terkoneksi:
 * - Departemen: Pengembangan Perangkat Lunak & Gim
 * - Kelas: XII PPLG 2
 * - Siswa: Rasyad Helza
 * - Orang Tua: Rosalina
 * - Guru Pembimbing: Wanda Kurniawan S.Pd
 * - Pembimbing Industri: Pak Galih
 * - Industri: PT Gravicode Multinovative Plexindo
 *
 * Jalankan dengan: php artisan db:seed --class=StarterSeeder
 * Password default: password
 */
class StarterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan roles sudah ada
        $this->call(RoleSeeder::class);

        // 0. Buat User Admin
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@simonik.local'],
            [
                'name' => 'Admin',
                'password' => 'password',
            ]
        );
        if (! $adminUser->hasRole('admin')) {
            $adminUser->assignRole('admin');
        }

        // 1. Buat User untuk Siswa (Rasyad Helza)
        $studentUser = User::firstOrCreate(
            ['email' => 'rasyad.helza@simonik.local'],
            [
                'name' => 'Rasyad Helza',
                'password' => 'password',
            ]
        );
        if (! $studentUser->hasRole('siswa')) {
            $studentUser->assignRole('siswa');
        }

        // 2. Buat User untuk Orang Tua (Rosalina)
        $parentUser = User::firstOrCreate(
            ['email' => 'rosalina@simonik.local'],
            [
                'name' => 'Rosalina',
                'password' => 'password',
            ]
        );
        if (! $parentUser->hasRole('orangtua')) {
            $parentUser->assignRole('orangtua');
        }

        // 3. Buat User untuk Guru Pembimbing (Wanda Kurniawan)
        $teacherUser = User::firstOrCreate(
            ['email' => 'wanda.kurniawan@simonik.local'],
            [
                'name' => 'Wanda Kurniawan',
                'password' => 'password',
            ]
        );
        if (! $teacherUser->hasRole('guru')) {
            $teacherUser->assignRole('guru');
        }

        // 4. Buat User untuk Pembimbing Industri (Pak Galih)
        $pembimbingUser = User::firstOrCreate(
            ['email' => 'galih@simonik.local'],
            [
                'name' => 'Pak Galih',
                'password' => 'password',
            ]
        );
        if (! $pembimbingUser->hasRole('pembimbing')) {
            $pembimbingUser->assignRole('pembimbing');
        }

        // 5. Buat Departemen (Jurusan)
        $departemen = Departemen::firstOrCreate(
            ['slug' => 'pengembangan-perangkat-lunak-gim'],
            ['name' => 'Pengembangan Perangkat Lunak & Gim']
        );

        // 6. Buat Classes (Kelas)
        $class = Classes::firstOrCreate(
            ['slug' => 'xii-pplg-2'],
            [
                'name' => 'XII PPLG 2',
                'departemen_id' => $departemen->id,
            ]
        );

        // 7. Buat Parents (Orang Tua)
        $parent = Parents::firstOrCreate(
            ['user_id' => $parentUser->id],
            [
                'nama' => 'Rosalina',
                'gender' => 'female',
                'alamat' => 'Jl. Contoh No. 123',
                'occupation' => 'Pedagang',
                'phoneNumber' => '081234567890',
            ]
        );

        // 8. Buat Teacher (Guru Pembimbing)
        $teacher = Teacher::firstOrCreate(
            ['user_id' => $teacherUser->id],
            [
                'name' => 'Wanda Kurniawan S.Pd',
                'no_hp' => '082345678901',
                'departemen_id' => $departemen->id,
            ]
        );

        // 9. Buat Pembimbing (Pembimbing Industri)
        $pembimbing = Pembimbing::firstOrCreate(
            ['user_id' => $pembimbingUser->id],
            [
                'name' => 'Pak Galih',
                'no_hp' => '083456789012',
                'gender' => 'male',
            ]
        );

        // 10. Buat Industry (Industri/PT)
        $industry = Industry::firstOrCreate(
            ['name' => 'PT Gravicode Multinovative Plexindo'],
            [
                'bidang' => 'Teknologi Informasi',
                'alamat' => 'Jl. Teknologi No. 456',
                'longitude' => '0.00',
                'latitude' => '0.00',
                'duration' => '6 bulan',
                'teacher_id' => $teacher->id,
                'pembimbing_id' => $pembimbing->id,
            ]
        );

        // 11. Buat PKL Period (Periode PKL)
        $today = Carbon::today();
        $sixMonthsFromNow = $today->copy()->addMonths(6);

        $pklPeriod = PKLPeriod::firstOrCreate(
            ['name_period' => 'Periode PKL 2026/2027'],
            [
                'start_period' => $today,
                'end_period' => $sixMonthsFromNow,
            ]
        );

        // 12. Buat Student (Siswa)
        // status_pkl hanya menerima: 'belum', 'proses', 'selesai'
        Student::firstOrCreate(
            ['user_id' => $studentUser->id],
            [
                'name' => 'Rasyad Helza',
                'nis' => '2024001',
                'placeOfBirth' => 'Bandung',
                'dateOfBirth' => '2006-10-04',
                'gender' => 'male',
                'bloodType' => 'O',
                'alamat' => 'Jl. Simanji No. 42, Bandung',
                'image' => 'images/default-student.png',
                'class_id' => $class->id,
                'departemen_id' => $departemen->id,
                'parent_id' => $parent->id,
                'industri_id' => $industry->id,
                'archived' => false,
                'status_pkl' => 'belum', // enum: belum, proses, selesai
                'pkl_start' => $today,
                'pkl_end' => $sixMonthsFromNow,
                'p_k_l_period_id' => $pklPeriod->id,
            ]
        );
    }
}
