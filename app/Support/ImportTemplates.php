<?php

namespace App\Support;

use App\Exports\GenericTemplateExport;
use App\Models\Departemen;
use App\Models\Pembimbing;
use App\Models\Student;
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
        .'Isi mulai baris ke-2 pada sheet data (baris ke-1 adalah judul kolom, jangan diubah). Baris yang salah dilaporkan satu per satu; baris lain tetap diimpor.';

    private static function accountNote(): string
    {
        return 'Setiap akun dibuat dengan kata sandi default "'.self::PW.'". '.self::SKIP_NOTE;
    }

    public static function departemen(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR JURUSAN',
            notes: self::SKIP_NOTE,
            dataTitle: ImportDefaults::SHEETS['jurusan'],
            instructions: [
                ['Nama', 'Wajib', 'Nama jurusan / program keahlian, mis. "Rekayasa Perangkat Lunak".'],
            ],
            headings: ['Nama'],
        );
    }

    public static function kelas(): GenericTemplateExport
    {
        $jurusan = self::departemenNames();

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR KELAS',
            notes: self::SKIP_NOTE.' Impor Jurusan terlebih dahulu sebelum Kelas.',
            dataTitle: ImportDefaults::SHEETS['kelas'],
            instructions: [
                ['Nama', 'Wajib', 'Nama kelas, mis. "XI RPL 1".'],
                ['Jurusan', 'Wajib', 'Ketik sama persis dengan nama di sheet "Referensi".'],
            ],
            headings: ['Nama', 'Jurusan'],
            references: ['Jurusan' => $jurusan],
        );
    }

    public static function wakasek(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR WAKASEK',
            notes: self::accountNote(),
            dataTitle: ImportDefaults::SHEETS['wakasek'],
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap wakasek.'],
                ['Email', 'Wajib', 'Boleh diisi username saja, mis. "rasyad.helza" — otomatis menjadi rasyad.helza@'.ImportDefaults::EMAIL_DOMAIN.'. Harus unik.'],
            ],
            headings: ['Nama', 'Email'],
        );
    }

    public static function kaprog(): GenericTemplateExport
    {
        $jurusan = self::departemenNames();

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR KEPALA PROGRAM',
            notes: self::accountNote().' Impor Jurusan terlebih dahulu bila ingin langsung menautkannya.',
            dataTitle: ImportDefaults::SHEETS['kaprog'],
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap kepala program.'],
                ['Email', 'Wajib', 'Boleh diisi username saja, mis. "rasyad.helza" — otomatis menjadi rasyad.helza@'.ImportDefaults::EMAIL_DOMAIN.'. Harus unik.'],
                ['Jurusan', 'Opsional', 'Jurusan yang dipimpin. Boleh lebih dari satu, pisahkan dengan tanda ";". Ketik sama persis dengan sheet "Referensi".'],
            ],
            headings: ['Nama', 'Email', 'Jurusan'],
            references: ['Jurusan' => $jurusan],
        );
    }

    public static function teacher(): GenericTemplateExport
    {
        $jurusan = self::departemenNames();

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR GURU PEMBIMBING',
            notes: self::accountNote().' Impor Jurusan terlebih dahulu.',
            dataTitle: ImportDefaults::SHEETS['guru'],
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap guru (boleh dengan gelar).'],
                ['Email', 'Wajib', 'Boleh diisi username saja, mis. "rasyad.helza" — otomatis menjadi rasyad.helza@'.ImportDefaults::EMAIL_DOMAIN.'. Harus unik.'],
                ['No HP', 'Wajib', 'Nomor HP aktif, mis. 081234567890.'],
                ['Jurusan', 'Wajib', 'Ketik sama persis dengan nama di sheet "Referensi".'],
            ],
            headings: ['Nama', 'Email', 'No HP', 'Jurusan'],
            references: ['Jurusan' => $jurusan],
        );
    }

    public static function pembimbing(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR PEMBIMBING INDUSTRI',
            notes: self::accountNote(),
            dataTitle: ImportDefaults::SHEETS['pembimbing'],
            instructions: [
                ['Nama', 'Wajib', 'Nama lengkap pembimbing industri.'],
                ['Email', 'Wajib', 'Boleh diisi username saja, mis. "rasyad.helza" — otomatis menjadi rasyad.helza@'.ImportDefaults::EMAIL_DOMAIN.'. Harus unik.'],
                ['No HP', 'Wajib', 'Nomor HP aktif.'],
                ['Jenis Kelamin', 'Opsional', 'Laki-laki atau Perempuan (boleh L / P).'],
            ],
            headings: ['Nama', 'Email', 'No HP', 'Jenis Kelamin'],
        );
    }

    public static function parent(): GenericTemplateExport
    {
        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR ORANG TUA',
            notes: 'Impor siswa terlebih dahulu. Akun login orang tua hanya dibuat bila Email diisi. '.self::SKIP_NOTE,
            dataTitle: ImportDefaults::SHEETS['orangtua'],
            instructions: [
                ['Nama Anak', 'Wajib', 'Ketik sama persis dengan nama siswa di sheet "Referensi". Nama harus unik.'],
                ['Nama Orang Tua', 'Wajib', 'Nama lengkap orang tua/wali.'],
                ['No HP', 'Wajib', 'Nomor HP aktif.'],
                ['Email', 'Opsional', 'Boleh diisi username saja; otomatis memakai @'.ImportDefaults::EMAIL_DOMAIN.'. Jika kosong, profil dibuat tanpa akun login.'],
                ['Jenis Kelamin', 'Opsional', 'Laki-laki atau Perempuan (boleh L / P).'],
                ['Alamat', 'Opsional', 'Alamat tempat tinggal.'],
                ['Pekerjaan', 'Opsional', 'Pekerjaan orang tua/wali.'],
            ],
            headings: ['Nama Anak', 'Nama Orang Tua', 'No HP', 'Email', 'Jenis Kelamin', 'Alamat', 'Pekerjaan'],
            references: ['Nama Anak' => Student::query()->orderBy('name')->pluck('name')->all()],
        );
    }

    public static function industry(): GenericTemplateExport
    {
        $teachers = self::teacherNames();
        $pembimbings = self::pembimbingNames();

        return new GenericTemplateExport(
            heading: 'PETUNJUK IMPOR INDUSTRI (DUDI)',
            notes: self::SKIP_NOTE.' Impor Guru & Pembimbing terlebih dahulu bila ingin langsung menautkannya.',
            dataTitle: ImportDefaults::SHEETS['industri'],
            instructions: [
                ['Nama', 'Wajib', 'Nama perusahaan/industri.'],
                ['Bidang', 'Wajib', 'Bidang usaha, mis. "Teknologi Informasi".'],
                ['Alamat', 'Wajib', 'Alamat lengkap industri.'],
                ['Longitude', 'Opsional', 'Koordinat bujur, mis. 107.60981.'],
                ['Latitude', 'Opsional', 'Koordinat lintang, mis. -6.914744.'],
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
            references: [
                'Guru Pembimbing' => $teachers,
                'Pembimbing Industri' => $pembimbings,
            ],
        );
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
