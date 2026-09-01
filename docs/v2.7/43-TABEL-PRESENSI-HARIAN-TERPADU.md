# Fase 43 - Tabel Presensi Harian Terpadu

**Request:** PKL-018, 31 Agustus 2027 · **Prioritas:** P1 · **Risiko:** sedang ·
**Migrasi:** tidak.

**Status:** Selesai.

## Perubahan

Panel Data Absen untuk Admin, Guru Pembimbing, dan Pembimbing Industri memakai
satu tabel. Pemisahan tabel/tab Belum dan Sudah diganti kategori:

1. Hadir semua;
2. Terlambat;
3. Alpa; dan
4. WFH (data tersimpan dengan mode `wfa`).

Tabel selalu memakai urutan Nama, Kelas, Industri, Status, Jam Masuk, Jam
Pulang, dan Keterlambatan. Pencarian nama serta filter industri bekerja di
server sehingga hasil tetap benar saat data memiliki beberapa halaman.

## Aturan penggunaan

- Hadir semua memuat murid yang mempunyai catatan presensi pada tanggal aktif.
- Terlambat memakai selisih jam masuk terhadap jam masuk industri.
- Alpa memuat murid tanpa catatan. Pada hari berjalan statusnya masih Belum
  lengkap; Alpa baru ditetapkan setelah hari kerja berlalu.
- WFH memuat presensi remote yang secara internal menggunakan mode WFA.
- Checkbox hanya aktif bagi baris yang memenuhi syarat presensi Masuk atau
  Pulang. Kedua aksi tersedia dari tabel yang sama.
- Seluruh data dan pilihan industri tetap mengikuti scope role pemanggil.

## Verifikasi minimum

- Test Data Absen mencakup kategori terlambat, Alpa, WFH, pencarian nama,
  filter industri, dan kompatibilitas URL lama.
- TypeScript check dan formatter berhasil.
- Tidak ada dependency atau migrasi baru.
