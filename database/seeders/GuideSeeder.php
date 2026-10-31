<?php

namespace Database\Seeders;

use App\Models\Guide;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class GuideSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (! $admin) {
            return;
        }

        $guides = [
            [
                'judul' => 'Pelaksanaan PKL',
                'kategori' => 'Pelaksanaan PKL',
                'deskripsi' => 'Peran dan tanggung jawab pembimbing industri dalam mendampingi kegiatan siswa di tempat PKL.',
                'konten' => '<p>Panduan ini mencakup tanggung jawab dan etika pelaksanaan Praktik Kerja Lapangan (PKL), mulai dari orientasi lingkungan kerja, tata tertib kehadiran, pembagian tugas harian, hingga pelaporan berkala bersama guru pembimbing sekolah.</p><h3>Poin Utama:</h3><ul><li>Orientasi pengenalan SOP dan K3 perusahaan.</li><li>Monitoring kehadiran dan aktivitas kerja harian.</li><li>Komunikasi berkala dengan pihak sekolah melalui SIMONIK.</li></ul>',
                'urutan' => 1,
                'status' => 'published',
            ],
            [
                'judul' => 'Penggunaan SIMONIK',
                'kategori' => 'SIMONIK',
                'deskripsi' => 'Panduan fitur dan alur penggunaan aplikasi SIMONIK untuk monitoring dan administrasi PKL.',
                'konten' => '<p>SIMONIK dirancang untuk mempermudah pemantauan jurnal, presensi digital berbasis geolokasi/foto, rekapitulasi penilaian, hingga verifikasi sertifikat PKL secara efisien.</p><h3>Fitur Aplikasi:</h3><ul><li>Presensi Masuk & Pulang harian.</li><li>Persetujuan Jurnal Harian oleh pembimbing.</li><li>Rekapitulasi nilai akhir dan cetak dokumen PKL.</li></ul>',
                'urutan' => 2,
                'status' => 'published',
            ],
            [
                'judul' => 'Penilaian Siswa',
                'kategori' => 'Penilaian',
                'deskripsi' => 'Panduan menilai kompetensi teknis, non-teknis, dan sikap kerja siswa peserta PKL.',
                'konten' => '<p>Penilaian PKL terdiri dari dua aspek utama: Aspek Teknis (keterampilan kejuruan spesifik di industri) dan Aspek Non-Teknis (kedisiplinan, kerja sama tim, tanggung jawab, dan inisiatif). Nilai diinput langsung melalui menu Rekap Penilaian.</p>',
                'urutan' => 3,
                'status' => 'published',
            ],
            [
                'judul' => 'FAQ',
                'kategori' => 'Bantuan',
                'deskripsi' => 'Jawaban atas pertanyaan umum dan kendala yang sering terjadi selama masa PKL.',
                'konten' => '<p>Temukan solusi cepat untuk berbagai kendala seputar lupa absen, revisi jurnal yang tertolak, pengajuan izin/sakit, hingga sinkronisasi data penilaian akhir siswa.</p>',
                'urutan' => 4,
                'status' => 'published',
            ],
        ];

        foreach ($guides as $data) {
            Guide::updateOrCreate(
                ['judul' => $data['judul']],
                array_merge($data, [
                    'user_id' => $admin->id,
                    'published_at' => Carbon::now(),
                ])
            );
        }
    }
}
