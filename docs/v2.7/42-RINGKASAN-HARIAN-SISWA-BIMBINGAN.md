# Fase 42 — Ringkasan Harian Siswa Bimbingan

**Request:** PKL-017, 31 Agustus 2026 · **Prioritas:** P1 · **Risiko:** rendah ·
**Migrasi:** tidak.

**Status:** Selesai.

## Cakupan

Card **Siswa bimbingan terbaru** pada dashboard Guru Pembimbing dan Pembimbing
Industri menampilkan ringkasan pada tanggal hari ini, hanya untuk lima siswa
terbaru dalam cakupan pembimbing.

| Urutan | Kolom | Nilai |
|---:|---|---|
| 1 | Nama | Nama dan NIS siswa |
| 2 | Kelas | Kelas siswa |
| 3 | Industri | Industri penempatan |
| 4 | Status | Belum lengkap, Hadir, Terlambat, atau Alpa |
| 5 | Jam Masuk | Waktu presensi masuk |
| 6 | Jam Pulang | Waktu presensi pulang |
| 7 | Keterlambatan | Selisih menit terhadap jam masuk industri |
| 8 | Jurnal | Sudah isi atau Belum |

## Aturan

- Alpa mengikuti status presensi `alpha`.
- Presensi tanpa jam masuk atau pulang adalah **Belum lengkap**.
- Presensi lengkap yang melewati jam masuk industri adalah **Terlambat**;
  lainnya **Hadir**.
- Data presensi dan jurnal dimuat per-batch, bukan query per siswa.
- Card Kaprog yang memakai komponen tabel sama tetap menampilkan format lama.

## Verifikasi

- Test dashboard pembimbing memeriksa status terlambat, jam masuk/pulang,
  menit keterlambatan, dan jurnal hari ini: **11/11 test, 126 assertion**.
- TypeScript check berhasil.
