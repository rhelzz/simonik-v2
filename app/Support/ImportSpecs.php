<?php

namespace App\Support;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;

/**
 * Spesifikasi impor per entitas: judul kolom, petunjuk pengisian, dan daftar
 * nilai relasi yang valid.
 *
 * Satu sumber untuk dua konsumen — sheet pada berkas template (`Exports/Sheets`)
 * dan halaman impor di web. Menulisnya dua kali akan menghasilkan petunjuk yang
 * lambat laun berbeda isi, dan operator tidak akan tahu mana yang benar.
 */
final class ImportSpecs
{
    /**
     * @return array{
     *     sheet: string,
     *     heading: string,
     *     headings: array<int, string>,
     *     instructions: array<int, array{0: string, 1: string, 2: string}>,
     *     example: array<int, string>,
     *     note: string,
     * }
     */
    public static function siswa(): array
    {
        return [
            'sheet' => ImportDefaults::SHEETS['siswa'],
            'heading' => 'PETUNJUK PENGISIAN IMPOR DATA SISWA',
            'headings' => [
                'Nama', 'NIS', 'Email', 'Jenis Kelamin', 'Tempat Lahir',
                'Tanggal Lahir', 'Golongan Darah', 'Alamat', 'Kelas', 'Jurusan',
                'Industri', 'Orang Tua', 'Status PKL', 'PKL Mulai', 'PKL Selesai',
            ],
            'instructions' => [
                ['Nama', 'Wajib', 'Nama lengkap siswa.'],
                ['NIS', 'Opsional', 'Nomor Induk Siswa (panjang bebas). Tidak boleh sama dengan siswa lain.'],
                ['Email', 'Wajib', 'Boleh diisi username saja, mis. "budi.santoso" — otomatis menjadi budi.santoso@'.ImportDefaults::EMAIL_DOMAIN.'. Harus unik.'],
                ['Jenis Kelamin', 'Opsional', 'Isi "Laki-laki" atau "Perempuan" (boleh juga L / P).'],
                ['Tempat Lahir', 'Opsional', 'Kota/kabupaten kelahiran.'],
                ['Tanggal Lahir', 'Opsional', 'Format YYYY-MM-DD, contoh 2008-05-14.'],
                ['Golongan Darah', 'Opsional', 'Isi A, B, AB, atau O. Kosongkan / isi "-" bila tidak tahu.'],
                ['Alamat', 'Opsional', 'Alamat tempat tinggal lengkap.'],
                ['Kelas', 'Opsional', 'Ketik sama persis dengan salah satu nilai referensi.'],
                ['Jurusan', 'Opsional', 'Ketik sama persis dengan salah satu nilai referensi.'],
                ['Industri', 'Opsional', 'Ketik sama persis dengan salah satu nilai referensi.'],
                ['Orang Tua', 'Opsional', 'Ketik sama persis dengan salah satu nilai referensi.'],
                ['Status PKL', 'Opsional', 'Belum, Proses, atau Selesai. Dikosongkan = Belum.'],
                ['PKL Mulai', 'Opsional', 'Format YYYY-MM-DD. Boleh dikosongkan.'],
                ['PKL Selesai', 'Opsional', 'Format YYYY-MM-DD, tidak boleh lebih awal dari PKL Mulai.'],
            ],
            'example' => [
                'Budi Santoso', '0012345678', 'budi.santoso', 'Laki-laki', 'Bandung',
                '2008-05-14', 'O', 'Jl. Merdeka No. 1', 'XI RPL 1',
                'Rekayasa Perangkat Lunak', 'PT Contoh Industri', 'Santoso', 'Belum', '', '',
            ],
            'note' => 'Setiap akun siswa dibuat dengan kata sandi default "'.ImportDefaults::PASSWORD.'". '
                .'Isi data mulai baris ke-2 pada sheet "'.ImportDefaults::SHEETS['siswa'].'" (baris ke-1 adalah judul kolom, jangan diubah). '
                .'Hanya Nama & Email yang wajib — kolom lain boleh dikosongkan dan dilengkapi siswa setelah login. '
                .'Nama Kelas/Jurusan/Industri/Orang Tua yang tidak dikenal akan dikosongkan, bukan menggagalkan impor. '
                .'Baris yang salah dilaporkan satu per satu; baris lain tetap diimpor. '
                .'Email atau NIS yang sudah terdaftar dilewati, tidak ditimpa.',
        ];
    }

    /**
     * Nilai relasi yang dikenali importer siswa, dikelompokkan per kolom.
     *
     * Dipakai sheet "Referensi" pada template **dan** panel referensi di
     * halaman impor.
     *
     * @return array<string, array<int, string>>
     */
    public static function siswaReferences(): array
    {
        return [
            'Kelas' => Classes::query()->orderBy('name')->pluck('name')->all(),
            'Jurusan' => Departemen::query()->orderBy('name')->pluck('name')->all(),
            'Industri' => Industry::query()->orderBy('name')->pluck('name')->all(),
            'Orang Tua' => Parents::query()->orderBy('nama')->pluck('nama')->all(),
        ];
    }
}
