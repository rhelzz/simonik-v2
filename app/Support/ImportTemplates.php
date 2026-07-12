<?php

namespace App\Support;

use App\Exports\GenericTemplateExport;
use App\Models\Departemen;
use App\Models\Pembimbing;
use App\Models\Teacher;

/**
 * Pusat definisi template contoh impor tiap entitas master data (petunjuk,
 * kolom, baris contoh, dan sheet referensi). Dipakai oleh method `template()`
 * di masing-masing controller.
 */
class ImportTemplates
{
    private const PW = ImportDefaults::PASSWORD;

    private const SKIP_NOTE = 'Data yang sudah ada akan dilewati otomatis (tidak menimpa). '
        .'Isi mulai baris ke-2 (baris ke-1 adalah judul kolom, jangan diubah).';

    private static function accountNote(): string
    {
        return 'Setiap akun dibuat dengan kata sandi default "'.self::PW.'". '.self::SKIP_NOTE;
    }

    public static function departemen(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR JURUSAN',
            notes: self::SKIP_NOTE,
            dataTitle: 'Data Jurusan',
            instructions: [
                ['Nama', 'Wajib', 'Nama jurusan / program keahlian, mis. "Rekayasa Perangkat Lunak".'],
            ],
            headings: ['Nama'],
            example: ['Rekayasa Perangkat Lunak'],
        );
    }

    public static function kelas(): GenericTemplateExport
    {
        $jurusan = self::departemenNames();

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR KELAS',
            notes: self::SKIP_NOTE.' Impor Jurusan terlebih dahulu sebelum Kelas.',
            dataTitle: 'Data Kelas',
            instructions: [
                ['Nama', 'Wajib', 'Nama kelas, mis. "XI RPL 1".'],
                ['Jurusan', 'Wajib', 'Ketik sama persis dengan nama di sheet "Referensi".'],
            ],
            headings: ['Nama', 'Jurusan'],
            example: ['XI RPL 1', self::sample($jurusan, 'Rekayasa Perangkat Lunak')],
            references: ['Jurusan' => $jurusan],
        );
    }

    public static function wakasek(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR WAKASEK',
            notes: self::accountNote(),
            dataTitle: 'Data Wakasek',
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap wakasek.'],
                ['Email', 'Wajib', 'Email unik untuk akun login.'],
            ],
            headings: ['Nama', 'Email'],
            example: ['Andi Wijaya, M.Pd.', 'andi@sekolah.sch.id'],
        );
    }

    public static function kaprog(): GenericTemplateExport
    {
        $jurusan = self::departemenNames();
        $contoh = implode('; ', array_slice($jurusan, 0, 2));

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR KEPALA PROGRAM',
            notes: self::accountNote().' Impor Jurusan terlebih dahulu bila ingin langsung menautkannya.',
            dataTitle: 'Data Kaprog',
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap kepala program.'],
                ['Email', 'Wajib', 'Email unik untuk akun login.'],
                ['Jurusan', 'Opsional', 'Jurusan yang dipimpin. Boleh lebih dari satu, pisahkan dengan tanda ";". Ketik sama persis dengan sheet "Referensi".'],
            ],
            headings: ['Nama', 'Email', 'Jurusan'],
            example: ['Rina Kusuma, S.Kom.', 'rina@sekolah.sch.id', $contoh !== '' ? $contoh : 'Rekayasa Perangkat Lunak; Teknik Komputer dan Jaringan'],
            references: ['Jurusan' => $jurusan],
        );
    }

    public static function teacher(): GenericTemplateExport
    {
        $jurusan = self::departemenNames();

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR GURU PEMBIMBING',
            notes: self::accountNote().' Impor Jurusan terlebih dahulu.',
            dataTitle: 'Data Guru',
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap guru (boleh dengan gelar).'],
                ['Email', 'Wajib', 'Email unik untuk akun login.'],
                ['No HP', 'Wajib', 'Nomor HP aktif, mis. 081234567890.'],
                ['Jurusan', 'Wajib', 'Ketik sama persis dengan nama di sheet "Referensi".'],
            ],
            headings: ['Nama', 'Email', 'No HP', 'Jurusan'],
            example: ['Siti Aminah, S.Pd.', 'siti@sekolah.sch.id', '081234567890', self::sample($jurusan, 'Rekayasa Perangkat Lunak')],
            references: ['Jurusan' => $jurusan],
        );
    }

    public static function pembimbing(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR PEMBIMBING INDUSTRI',
            notes: self::accountNote(),
            dataTitle: 'Data Pembimbing',
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap pembimbing industri.'],
                ['Email', 'Wajib', 'Email unik untuk akun login.'],
                ['No HP', 'Wajib', 'Nomor HP aktif.'],
                ['Jenis Kelamin', 'Opsional', 'Laki-laki atau Perempuan (boleh L / P).'],
            ],
            headings: ['Nama', 'Email', 'No HP', 'Jenis Kelamin'],
            example: ['Budi Hartono', 'budi@dudi.co.id', '081200001111', 'Laki-laki'],
        );
    }

    public static function parent(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR ORANG TUA',
            notes: self::accountNote(),
            dataTitle: 'Data Orang Tua',
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap orang tua/wali.'],
                ['Email', 'Wajib', 'Email unik untuk akun login.'],
                ['Jenis Kelamin', 'Wajib', 'Laki-laki atau Perempuan (boleh L / P).'],
                ['Alamat', 'Wajib', 'Alamat tempat tinggal.'],
                ['Pekerjaan', 'Wajib', 'Pekerjaan orang tua/wali.'],
                ['No HP', 'Wajib', 'Nomor HP aktif.'],
            ],
            headings: ['Nama', 'Email', 'Jenis Kelamin', 'Alamat', 'Pekerjaan', 'No HP'],
            example: ['Santoso', 'santoso@mail.com', 'Laki-laki', 'Jl. Merdeka No. 1', 'Wiraswasta', '081298765432'],
        );
    }

    public static function industry(): GenericTemplateExport
    {
        $teachers = self::teacherNames();
        $pembimbings = self::pembimbingNames();

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR INDUSTRI (DUDI)',
            notes: self::SKIP_NOTE.' Impor Guru & Pembimbing terlebih dahulu bila ingin langsung menautkannya.',
            dataTitle: 'Data Industri',
            instructions: [
                ['Nama', 'Wajib', 'Nama perusahaan/industri.'],
                ['Bidang', 'Wajib', 'Bidang usaha, mis. "Teknologi Informasi".'],
                ['Alamat', 'Wajib', 'Alamat lengkap industri.'],
                ['Longitude', 'Wajib', 'Koordinat bujur, mis. 107.60981.'],
                ['Latitude', 'Wajib', 'Koordinat lintang, mis. -6.914744.'],
                ['Radius', 'Opsional', 'Radius absen (meter). Dikosongkan = 100.'],
                ['Jam Masuk', 'Opsional', 'Format HH:MM, mis. 08:00.'],
                ['Jam Pulang', 'Opsional', 'Format HH:MM, mis. 16:00.'],
                ['Durasi', 'Opsional', 'Keterangan durasi PKL, mis. "6 bulan".'],
                ['Kuota', 'Opsional', 'Jumlah kuota siswa (angka).'],
                ['Guru Pembimbing', 'Opsional', 'Ketik sama persis dengan sheet "Referensi".'],
                ['Pembimbing Industri', 'Opsional', 'Ketik sama persis dengan sheet "Referensi".'],
            ],
            headings: [
                'Nama', 'Bidang', 'Alamat', 'Longitude', 'Latitude', 'Radius',
                'Jam Masuk', 'Jam Pulang', 'Durasi', 'Kuota',
                'Guru Pembimbing', 'Pembimbing Industri',
            ],
            example: [
                'PT Contoh Industri', 'Teknologi Informasi', 'Jl. Industri No. 5',
                '107.60981', '-6.914744', '100', '08:00', '16:00', '6 bulan', '10',
                self::sample($teachers, '(kosongkan / isi nama guru dari Referensi)'),
                self::sample($pembimbings, '(kosongkan / isi nama pembimbing dari Referensi)'),
            ],
            references: [
                'Guru Pembimbing' => $teachers,
                'Pembimbing Industri' => $pembimbings,
            ],
        );
    }

    /**
     * Nilai contoh untuk kolom relasi: pakai data referensi terkini bila ada,
     * agar contoh tidak salah ketik. Jatuh ke teks fallback bila data kosong.
     *
     * @param  array<int, string>  $values
     */
    private static function sample(array $values, string $fallback): string
    {
        return $values[0] ?? $fallback;
    }

    /**
     * @return array<int, string>
     */
    private static function departemenNames(): array
    {
        return Departemen::query()->orderBy('name')->pluck('name')->all();
    }

    /**
     * @return array<int, string>
     */
    private static function teacherNames(): array
    {
        return Teacher::query()->orderBy('name')->pluck('name')->all();
    }

    /**
     * @return array<int, string>
     */
    private static function pembimbingNames(): array
    {
        return Pembimbing::query()->orderBy('name')->pluck('name')->all();
    }
}
