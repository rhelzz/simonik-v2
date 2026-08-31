# Fase 38 — Revisi Count Keterlambatan Lintas Role

**Request:** 4PKL-004 / PKL-004 · **Prioritas:** P1 · **Risiko:** sedang ·
**Migrasi:** tidak.

**Status:** Selesai — koreksi regresi v2.6 Fase 32 diterapkan dan diuji pada
31 Agustus 2026.

## 1. Masalah

Fitur keterlambatan sudah mempunyai helper perhitungan, tetapi count pada
dashboard murid dan tabel harian Data Absen dapat tampil `—` walaupun industri
sudah memiliki jam masuk.

Revisi 30 Agustus 2026 meminta:

1. count keterlambatan benar-benar berfungsi;
2. akumulasi waktu terlambat selama periode PKL tampil pada murid; dan
3. data yang sama dapat dilihat seluruh role yang terkait modul presensi,
   sesuai cakupan kewenangannya.

## 2. Hasil audit dan akar masalah

Rumus bersama di `Attendance::lateMinutes()` sudah benar:

```text
max(0, arrivalTime - industry.jam_masuk)
```

Masalahnya berada pada data yang dimuat sebelum helper dipanggil:

| Jalur | Kondisi sekarang | Akibat |
|---|---|---|
| Dashboard murid | `DashboardController` memuat `industries:id,name`, lalu membaca `jam_masuk` | `jam_masuk` selalu `null`; `stats.lateMinutes` menjadi `null`; card menampilkan `—` |
| Roster harian Data Absen | `AttendanceMonitorController` memuat `industries:id,name`, lalu membaca `jam_masuk` | `lateMinutes` setiap baris menjadi `null`; seluruh role monitor melihat `—` |
| Detail murid Data Absen | Record dan `PerformanceSummary` belum menerima menit terlambat | Role terkait belum dapat melihat akumulasi keterlambatan murid |

Jadi perbaikannya bukan mengganti tampilan strip menjadi nol. Field
`jam_masuk` harus benar-benar tersedia saat rumus dijalankan; setelah itu UI
membedakan nilai nol dari konfigurasi yang tidak ada.

## 3. Aturan bisnis

### 3.1 Satuan dan rumus

- Sumber kebenaran tetap `Attendance::lateMinutes()`.
- Satuan penyimpulan adalah bilangan bulat **menit**.
- Tepat atau sebelum jam masuk = `0 menit`.
- Setelah jam masuk = selisih menit positif.
- Baris tanpa `arrivalTime` tidak dihitung sebagai keterlambatan.
- Presensi mandiri dan presensi yang diwakilkan memakai rumus yang sama.

### 3.2 Akumulasi periode PKL

Total murid adalah jumlah menit terlambat dari seluruh presensi dalam rentang
inklusif:

1. `students.pkl_start` / `students.pkl_end` bila diisi;
2. jika kosong, gunakan `pkl_period.start_period` / `pkl_period.end_period`;
3. jika kedua sumber tanggal tidak tersedia, jumlahkan riwayat yang tersedia
   dan jangan mengarang tanggal periode.

Perubahan jam masuk industri tetap mengubah hitungan historis, sesuai keputusan
v2.6 Fase 32. Snapshot jam kerja per hari tidak ditambahkan.

### 3.3 Arti nol dan data tidak tersedia

| Kondisi | Tampilan |
|---|---|
| Jam masuk tersedia, belum pernah terlambat | `0 menit` / `Tepat waktu` |
| Jam masuk tersedia, total terlambat 90 menit | `90 menit` |
| Jam masuk industri belum diatur | `Jam masuk belum diatur` |
| Record sakit/izin/libur tanpa jam masuk aktual | Tidak diberi menit keterlambatan |

`—` boleh tetap dipakai untuk field waktu presensi yang memang kosong, tetapi
tidak untuk hasil count yang sebenarnya nol atau konfigurasi yang perlu
ditindaklanjuti.

## 4. Surface lintas role

| Surface | Role | Data keterlambatan |
|---|---|---|
| Dashboard murid | Murid | Card total menit selama periode PKL |
| Riwayat Absen Foto + Geo | Murid | Menit pada setiap hari hadir |
| Roster harian Data Absen | Admin, wakasek, kaprog, guru, pembimbing industri, orang tua | Menit per murid pada tanggal terpilih |
| Detail murid Data Absen | Admin, wakasek, kaprog, guru, pembimbing industri, orang tua | Total periode PKL pada Rekap Performa dan menit pada setiap record |

Semua query Data Absen tetap melalui `ScopesStudentsByRole`. Penambahan angka
tidak boleh memperluas daftar murid yang bisa dibuka oleh suatu role.

## 5. Rencana perubahan minimum

1. Di `DashboardController::studentDashboard()`, sertakan `jam_masuk` pada
   proyeksi relasi industri dan gunakan batas periode efektif murid, termasuk
   fallback ke `pkl_period`.
2. Di `AttendanceMonitorController::index()`, sertakan `jam_masuk` pada eager
   load industri. Ini memperbaiki strip pada roster untuk semua role monitor
   sekaligus.
3. Di `AttendanceMonitorController::show()`, muat `jam_masuk` sebelum record
   dipresentasikan, kirim `lateMinutes` per record, dan sertakan total periode
   dalam data rekap performa.
4. Tambahkan total menit pada `SummarizesStudentPerformance` agar semua pemakai
   `PerformanceSummary` memakai satu definisi yang sama.
5. Tampilkan total tersebut pada `PerformanceSummary`; dashboard role lain
   tidak mendapat card duplikat.
6. Pertahankan `Attendance::lateMinutes()` sebagai satu-satunya rumus per
   record. Jangan membuat kolom `late_minutes`, service, atau tabel baru.

## 6. Berkas perkiraan

```text
app/Http/Controllers/DashboardController.php
app/Http/Controllers/AttendanceMonitorController.php
app/Http/Controllers/Concerns/SummarizesStudentPerformance.php
resources/js/pages/dashboard-student.tsx
resources/js/pages/attendance/index.tsx
resources/js/pages/attendance-monitor/show.tsx
resources/js/components/attendance-monitor/daily-roster.tsx
resources/js/components/performance-summary.tsx
tests/Feature/DashboardTest.php
tests/Feature/AttendanceMonitorTest.php
```

Daftar ini adalah hasil audit, bukan kewajiban menyentuh semuanya. Pertahankan
diff sekecil mungkin dan hapus file dari daftar bila acceptance criteria sudah
terpenuhi oleh komponen yang ada.

## 7. Test wajib

### Dashboard murid

- Industri `08:00`, kedatangan `08:17` dan `08:13` dalam periode PKL →
  `stats.lateMinutes = 30`, bukan `null`.
- Kedatangan tepat waktu saja → `stats.lateMinutes = 0`, bukan `null`.
- Presensi sebelum atau sesudah periode efektif tidak ikut total.
- `pkl_start`/`pkl_end` kosong → batas dari `pkl_period` tetap dipakai.
- Industri tanpa `jam_masuk` → status konfigurasi belum lengkap, bukan angka
  palsu.

### Data Absen lintas role

- Roster tanggal terpilih mengirim `lateMinutes = 17` untuk kedatangan `08:17`
  pada industri `08:00`; test ini wajib menangkap proyeksi eager-load yang
  melupakan `jam_masuk`.
- Detail murid mengirim total akumulasi dan menit tiap record.
- Guru, pembimbing industri, kaprog, dan orang tua hanya dapat melihat murid
  dalam cakupannya; admin/wakasek dapat melihat seluruh murid.
- Murid tetap tidak dapat membuka endpoint monitoring lintas siswa.

## 8. Acceptance criteria

- Card Keterlambatan dashboard murid menampilkan angka menit yang benar.
- Nilai nol tampil sebagai `0 menit`, bukan `—`.
- Roster harian dan detail murid menampilkan nilai yang konsisten dengan card
  murid untuk record/periode yang sama.
- Semua role terkait modul dapat melihat data sesuai matriks §4 tanpa kebocoran
  scope.
- Tidak ada migrasi dan tidak ada data turunan keterlambatan yang disimpan.
- Test fokus, `composer ci:check`, dan build frontend hijau.

## 9. Tidak termasuk

- Card keterlambatan baru pada setiap dashboard role.
- Jumlah kejadian/hari terlambat sebagai metrik kedua.
- Ranking murid paling terlambat, notifikasi, denda, atau export baru.
- Snapshot historis jam masuk industri.
- Perubahan aturan batas checkout v2.6 Fase 32.

Tambahkan hal-hal tersebut hanya jika ada request terpisah.

## 10. Bukti selesai

- Akar masalah diperbaiki dengan memuat `jam_masuk` pada dashboard murid dan
  roster Data Absen.
- Akumulasi periode PKL dipusatkan pada `Student::cumulativeLateMinutes()` dan
  dipakai dashboard serta rekap performa lintas role.
- Test regresi fokus: **35/35 test, 425 assertion**.
- Gate penuh: **567/567 test, 2.534 assertion**; ESLint, Prettier, TypeScript,
  Pint, dan PHPStan lolos.
- Build produksi Vite/PWA berhasil tanpa migrasi database.
