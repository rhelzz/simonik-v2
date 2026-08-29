# Fase 34 — Pemeriksaan Jurnal Harian

**Request:** PKL-007 · **Risiko:** sedang · **Migrasi:** tidak.

**Status:** Selesai — pemeriksa scoped dapat mengubah status `verified` secara
idempoten, label tampil di detail jurnal, dan persentase hanya muncul setelah
seluruh jurnal siswa diperiksa.

## Keputusan data

Gunakan `activities.verified` yang sudah ada sebagai status pemeriksaan. Nilai
baru harus ditulis konsisten (`0/1` atau boolean cast), tanpa membuat kolom lain.
Default jurnal baru: belum dilihat.

## Role dan scope

Pembimbing industri dan guru pembimbing dapat menandai jurnal siswa dalam
scope mereka. Admin boleh melihat tetapi tidak otomatis dianggap pemeriksa,
kecuali diputuskan eksplisit saat eksekusi.

## Pengerjaan

1. Tambahkan route/action idempotent untuk menandai jurnal sudah/belum dilihat.
2. Terapkan scope siswa sebelum update activity.
3. Render tombol merah “Belum Dilihat” dan hijau “Sudah Dilihat” di posisi yang
   ditunjukkan gambar, dengan label/status yang tetap terbaca tanpa warna.
4. Persentase jurnal pada akun siswa hanya tampil bila siswa punya jurnal dan
   seluruh jurnalnya sudah dilihat.
5. Jurnal baru mengembalikan kondisi menjadi tersembunyi sampai diperiksa.

## File perkiraan

- `routes/web.php`
- `app/Models/Activity.php`
- `app/Http/Controllers/JournalMonitorController.php`
- `app/Http/Controllers/Concerns/SummarizesStudentPerformance.php`
- `app/Http/Controllers/DashboardController.php`
- `resources/js/pages/journal-monitor/show.tsx`
- dashboard/summary siswa
- test jurnal dan dashboard

## Test wajib

- Jurnal baru berstatus belum dilihat.
- Pemeriksa dalam scope dapat mengubah status; role/scope lain ditolak.
- Persentase tersembunyi saat satu jurnal belum diperiksa dan muncul ketika semua selesai.
- Menambah jurnal baru menyembunyikan persentase lagi.
- Rumus persentase tidak berubah; hanya visibilitasnya yang berubah.
