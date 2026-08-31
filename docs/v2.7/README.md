# SIMONIK v2.7 — Revisi Count Keterlambatan

Sumber request: **4PKL-004 / PKL-004**, 27 Agustus 2026.
Revisi: **30 Agustus 2026 — count keterlambatan belum berfungsi dan hanya
menampilkan strip (`—`)**.

Dokumen ini mencatat koreksi setelah v2.6 Fase 32 yang sudah diimplementasikan
dan diverifikasi pada 31 Agustus 2026.

| Fase | Isi | Prioritas | Risiko | Migrasi | Status |
|---|---|---:|---|---|---|
| [38](38-REVISI-COUNT-KETERLAMBATAN.md) | Perbaiki count dan akumulasi menit keterlambatan pada seluruh role terkait modul presensi | P1 | Sedang | Tidak | **Selesai** |
| [39](39-ANULIR-PRESENSI-PEMBIMBING.md) | Izinkan pembimbing melakukan presensi masuk/pulang untuk murid dalam cakupannya | P1 | Sedang | Tidak | **Selesai** |
| [40](40-INFORMASI-GRADE-PENILAIAN.md) | Informasi kategori grade pada Rekap Penilaian Industri serta revisi rentang grade | P1 | Rendah | Tidak | **Selesai** |

## Cakupan role

“Semua role” berarti semua role yang mempunyai hubungan dengan modul
presensi, tetap mengikuti cakupan data masing-masing:

| Role | Data yang boleh dilihat |
|---|---|
| Murid | Keterlambatan miliknya sendiri pada dashboard dan riwayat presensi |
| Orang tua | Keterlambatan anak yang tertaut melalui Data Absen |
| Guru pembimbing | Murid dalam cakupan bimbingannya |
| Pembimbing industri | Murid pada industrinya |
| Kaprog | Murid pada program keahlian yang dipimpinnya |
| Wakasek | Seluruh murid melalui Data Absen |
| Admin | Seluruh murid melalui Data Absen |

Tidak dibuat card baru di setiap dashboard. Request hanya menyebut card khusus
dashboard murid; role lain memakai halaman **Data Absen** yang memang sudah
menjadi surface lintas-role.

## Definisi selesai

- Nilai utama adalah **total menit terlambat**, bukan jumlah hari terlambat.
- `0 menit` harus tampil sebagai angka yang sah, bukan strip.
- Strip tidak dipakai untuk menyamarkan konfigurasi yang belum lengkap;
  tampilkan keterangan bahwa jam masuk industri belum diatur.
- Akumulasi hanya mencakup periode PKL efektif murid.
- Cakupan role tetap ditegakkan oleh `ScopesStudentsByRole`.
- Tidak ada kolom atau migrasi baru; menit tetap diturunkan dari jam kedatangan
  dan jam masuk industri.
