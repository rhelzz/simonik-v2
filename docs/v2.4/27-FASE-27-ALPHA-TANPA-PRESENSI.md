# Fase 27 — Siswa yang tidak presensi dianggap Alpha

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** sedang ·
**Migrasi:** tidak · **Ketergantungan:** Fase 23 · **Perkiraan:** ~3-4 jam

## 1. Permintaan

> "Siswa yang tidak melakukan presensi dianggap Alpha"

Satu kalimat, tapi menyembunyikan empat pertanyaan yang harus dijawab sebelum
satu baris kode ditulis:

1. Alpha itu **baris data** atau **tampilan**?
2. Hari apa saja yang dihitung? (akhir pekan? libur nasional? sebelum PKL mulai?)
3. Kapan hari "berubah" jadi Alpha — pukul berapa?
4. Alpha memengaruhi apa? (rate absensi, rapor, sertifikat, badge?)

---

## 2. Kondisi sekarang

### 2.1 Status yang ada semuanya berasal dari sebuah **peristiwa**

| Status | Dibuat oleh | Berkas |
|---|---|---|
| `hadir` | siswa absen sendiri | `AttendanceController::checkIn()` |
| `libur` | approval LeaveRequest | `ApproveRequest::handle()` |
| `sakit` / `izin` | approval SakitIzin | `ApproveRequest::handle()` |
| `proxy` (mode) | guru mempresensikan | Fase 24 |

**Alpha adalah satu-satunya "status" yang lahir dari ketiadaan peristiwa.**
Tidak ada yang menekan tombol; yang terjadi justru tidak ada yang menekan apa
pun. Perbedaan ini menentukan seluruh desainnya.

### 2.2 Tidak ada scheduler, tidak ada kalender hari kerja

- `routes/console.php` hanya berisi perintah `inspire` bawaan. `bootstrap/app.php`
  tidak memanggil `withSchedule()`. **Tidak ada infrastruktur cron sama sekali.**
- Tidak ada tabel hari libur nasional.
- `industries` punya `jam_masuk`/`jam_pulang`, **tidak** punya hari kerja.
- `pkl_periods` (`start_period`, `end_period`) menandai rentang PKL per siswa
  (`Student::pkl_period()`).

### 2.3 Fase 23 sudah menghitung "belum presensi"

Fase 23 §3.1 menetapkan: **belum presensi = tidak ada baris `attendances` pada
tanggal itu**, untuk siswa `status_pkl = 'proses'`. Alpha adalah himpunan bagian
dari itu — yang tanggalnya sudah lewat.

---

## 3. Keputusan implementasi

### 3.1 Alpha **turunan**, bukan baris data — ini keputusan utama fase ini

Dua jalan:

| | **A. Baris `attendances` status `alpha`** | **B. Turunan saat dibaca** |
|---|---|---|
| Infrastruktur | Scheduler + cron di server + command baru | Nol |
| Data historis | Perlu **backfill** ke belakang untuk seluruh riwayat | Langsung benar sejak hari pertama |
| Koreksi terlambat (siswa mengajukan sakit menyusul, guru presensikan menyusul) | Baris `alpha` harus dihapus/ditimpa — **jalur konflik baru** | Alpha hilang sendiri begitu baris asli ada |
| Kalau cron mati semalam | Lubang senyap di data | Tidak ada yang bisa mati |
| Deploy Dokploy | Butuh worker/cron container tambahan | Tidak |

**Dipilih: B.** Alasan terkuat bukan "lebih sedikit kode", tapi **koreksi
terlambat**. Approval sakit sering datang 2-3 hari setelah tanggalnya
(`ApproveRequest::handle()` memakai `updateOrCreate` justru karena itu), dan
Fase 24 seluruhnya tentang mengisi presensi yang terlewat. Dengan opsi A, setiap
koreksi harus tahu cara membersihkan baris `alpha` yang sudah dibuat cron —
setiap jalur penulisan absen jadi punya beban tambahan. Dengan opsi B, tidak ada
yang perlu dibersihkan.

```php
// ponytail: Alpha diturunkan saat dibaca, bukan disimpan sebagai baris.
// Tidak ada cron, tidak ada backfill, dan koreksi terlambat (sakit menyusul,
// presensi diwakilkan) otomatis menghapus Alpha tanpa jalur pembersihan.
// Simpan sebagai baris hanya kalau Alpha perlu bisa dikoreksi manual
// per-siswa (mis. "alpha ini dimaafkan").
```

### 3.2 Definisi Alpha (dan bukan-Alpha)

Sebuah `(siswa, tanggal)` adalah **Alpha** bila **semua** benar:

1. Tidak ada baris `attendances` pada tanggal itu *(Fase 23 §3.1)*.
2. Tanggal itu **sudah lewat** — `$date->isBefore(Carbon::today())`. Hari
   berjalan **tidak pernah** Alpha (§3.3).
3. Siswa `status_pkl = 'proses'` *(Fase 23 §3.2)*.
4. Tanggal itu **bukan Sabtu/Minggu** — `! $date->isWeekend()`.
5. Tanggal itu berada **dalam periode PKL** siswa
   (`pkl_periods.start_period … end_period`), bila periodenya ada.

Butir 4 & 5 adalah yang membedakan fitur berguna dari fitur yang langsung
dimatikan: tanpa keduanya, setiap siswa akan punya puluhan "Alpha" untuk akhir
pekan dan untuk hari sebelum PKL-nya dimulai, lalu tidak ada yang mempercayai
angkanya lagi.

**Yang sengaja TIDAK ditangani: libur nasional & cuti bersama.** Tidak ada
kalender di sistem, dan menambahkannya adalah modul tersendiri (tabel + CRUD +
pengisian tahunan). Konsekuensinya jujur: 17 Agustus akan tampil sebagai Alpha
massal.

```php
// ponytail: libur nasional tidak dikenali — tidak ada kalender hari libur di
// sistem. Konsekuensi: tanggal merah tampil sebagai Alpha massal. Tambahkan
// tabel `holidays` (tanggal + keterangan) kalau ini benar-benar mengganggu;
// itu modul tersendiri, bukan bagian dari fase ini.
```

**Mitigasi murah tanpa modul baru:** siswa/sekolah bisa mengajukan **libur**
lewat `LeaveRequest` yang sudah ada — approval-nya membuat baris `status = 'libur'`,
dan baris itu langsung mematikan Alpha (butir 1). Jalur ini sudah jalan hari ini.
Sebutkan ini ke operator; sering kali itu sudah cukup.

### 3.3 Hari berjalan tidak pernah Alpha

Tanpa aturan ini, setiap pagi pukul 07.00 seluruh sekolah tampil "Alpha" sampai
mereka absen satu per satu. Panel Fase 23 akan tampak seperti kabar buruk setiap
hari, dan orang berhenti membacanya.

Karena itu label di panel Fase 23 bergantung tanggal:

| Tanggal dilihat | Label untuk "tidak ada baris" |
|---|---|
| Hari ini / masa depan | **"Belum presensi"** (netral) |
| Sudah lewat, hari kerja, dalam periode PKL | **"Alpha"** (merah) |
| Sudah lewat, akhir pekan / di luar periode | **"—"** (tidak dihitung) |

Tidak ada ambang jam (mis. "Alpha setelah pukul 10"). Ambang jam berarti tampilan
yang sama berubah arti di tengah hari tanpa ada yang melakukan apa pun —
membingungkan, dan butuh angka konfigurasi yang tidak ada yang tahu harus diisi
berapa.

### 3.4 Satu tempat perhitungan: `AttendanceStatus::for(...)`

Alpha akan dibaca di ≥3 tempat (panel Fase 23, riwayat absen siswa, rekap
performa). Definisi §3.2 **tidak boleh** ditulis ulang di tiga tempat.

Karena ini logika murni tanpa state, tempatnya bukan trait controller melainkan
kelas kecil di `app/Support/` (folder itu sudah ada, mis. `ImportTemplates`):

```php
// app/Support/AttendanceStatus.php
final class AttendanceStatus
{
    /**
     * Status efektif satu (siswa, tanggal): baris nyata kalau ada, selain itu
     * turunan — 'alpha', 'belum', atau null (hari tidak dihitung).
     */
    public static function for(
        ?Attendance $attendance,
        CarbonInterface $date,
        ?CarbonInterface $pklStart,
        ?CarbonInterface $pklEnd,
    ): ?string
}
```

Parameternya nilai, bukan model `Student` — supaya bisa diuji unit tanpa
database dan tidak diam-diam memicu kueri relasi di dalam loop.

Pemetaan ke label Indonesia tetap di controller (`CLAUDE.md`: petakan enum di
backend), memakai konstanta `LABELS` di kelas yang sama agar tidak ada dua
kamus.

Test-nya: `tests/Unit/AttendanceStatusTest.php` — cepat, tanpa DB, mencakup
kelima butir §3.2 dan §3.3.

### 3.5 Rate absensi **tidak** diubah

`DashboardController::rate()` menghitung rasio hari-siswa yang **ada** dibagi
(siswa aktif × hari efektif). Alpha sudah tercermin di situ sebagai
*ketidakhadiran di pembilang* — tidak ada yang perlu ditambahkan.

Mengubah rumus rate di fase ini berarti seluruh angka historis dashboard
bergeser, dan `DashboardTest.php` (jaring pengaman Fase 22) berubah artinya.
**Jangan sentuh.**

Yang boleh ditambahkan **kalau diminta nanti**: kolom "Alpha (bulan ini)" di
rekap performa siswa — memakai `AttendanceStatus` yang sama. Tidak dibangun
sekarang.

### 3.6 Riwayat absen siswa: sisipkan hari Alpha, jangan diam saja

Di `attendance-monitor/show` (dan `attendance/index` milik siswa), riwayat saat
ini hanya menampilkan baris yang **ada**. Seorang siswa dengan 3 Alpha melihat
riwayat yang tampak sempurna — hanya lebih pendek.

Sisipkan baris Alpha di antara tanggal yang kosong, dibangun di **controller**
saat menyusun daftar, bukan di React.

**Peringatan implementasi:** halaman itu memakai `paginate(15)` atas tabel
`attendances`. Menyisipkan baris sintetis ke dalam paginator akan membuat
jumlah item per halaman tidak konsisten. Dua jalan:

- **(a) Batasi ke rentang tampilan** — hitung Alpha hanya untuk rentang tanggal
  yang tampil di halaman itu (dari tanggal tertua ke termuda di halaman
  tersebut), lalu gabungkan. Paginasi tetap milik `attendances`.
- **(b)** Bangun daftar dari **tanggal**, bukan dari baris absen — benar secara
  konseptual, tapi berarti menulis ulang paginasi halaman itu.

**Pilih (a).** Ia menjawab keluhan ("Alpha tidak terlihat") dengan perubahan
yang tidak menyentuh paginasi. Kalau (a) terasa aneh di batas halaman, itu
sinyal untuk (b) — bukan alasan memulai dari (b).

Kalau kerumitannya ternyata lebih dari ~30 baris, **tunda §3.6 ke fase terpisah**
dan kirimkan §3.7 saja. Panel Fase 23 sudah memenuhi permintaan aslinya.

### 3.7a Penyesuaian saat implementasi — dicatat, bukan disembunyikan

Rencana §3.7 menyebut "hari yang tidak dihitung **tidak muncul sama sekali**"
di tab "Belum". Saat implementasi, dua syarat itu ternyata berbeda biaya:

| Syarat | Diterapkan sebagai |
|---|---|
| **Akhir pekan** (§3.2 butir 4) | **disaring di kueri** — properti tanggal, bukan per-siswa, jadi cukup satu cek `$date->isWeekend()`; tab jadi kosong dan `summary.belum` = 0 |
| **Di luar periode PKL** (§3.2 butir 5) | **ditampilkan, tapi dilabeli "Tidak dihitung"** — bukan Alpha |

Alasan yang kedua tidak disaring di kueri: periode efektif siswa adalah
`COALESCE(students.pkl_start, pkl_periods.start_period)`, dan menyatakannya di
SQL — di dalam kueri yang sudah memuat `whereDoesntHave` — butuh empat cabang
`OR` dengan `whereHas`/`whereDoesntHave` bersarang. Itu menaruh kerumitan besar
di kueri terpanas halaman ini demi kasus yang sudah dipersempit oleh
`status_pkl = 'proses'`.

**Tujuan aslinya tetap tercapai:** tidak ada siswa yang ditandai Alpha secara
tidak adil — yang di luar periode dilabeli "Tidak dihitung". Yang tidak
tercapai: barisnya masih ikut terhitung di angka `summary.belum`.

```php
// ponytail: batas periode PKL per-siswa ditegakkan lewat LABEL, bukan lewat
// filter kueri — menyatakan COALESCE(pkl_start, pkl_periods.start_period) di
// SQL butuh 4 cabang OR bersarang di kueri terpanas halaman ini. Pindahkan ke
// kueri kalau angka "belum" yang ikut menghitung mereka jadi masalah nyata.
```

### 3.7 Panel Fase 23 mendapat label Alpha — ini yang wajib

Perubahan minimum yang memenuhi permintaan: pada panel harian (Fase 23), tab
"Belum" untuk tanggal lampau menampilkan **"Alpha"** (merah) alih-alih "Belum
presensi", dan hari yang tidak dihitung (§3.2 butir 4-5) **tidak muncul sama
sekali** di tab itu.

Butir terakhir penting: kalau akhir pekan tetap muncul di tab "Belum" dengan
label "—", operator tetap melihat daftar panjang yang harus diabaikan. Saring di
kueri.

---

## 4. Rencana implementasi

1. **`app/Support/AttendanceStatus.php`** (baru) — §3.4.
2. **`tests/Unit/AttendanceStatusTest.php`** (baru) — tulis **sebelum** memakai
   kelasnya; definisinya punya 5 syarat dan lebih mudah dibenarkan lewat test
   daripada lewat membaca.
3. **`AttendanceMonitorController::index()`** — eager-load `pkl_period` (sudah
   ada relasinya, dipakai `show()`), lalu petakan `statusLabel` lewat
   `AttendanceStatus`. Saring hari yang tidak dihitung dari tab "Belum" (§3.7).
4. **`daily-roster.tsx`** — gaya lencana Alpha (merah/`text-danger`; kalau token
   merah belum ada, lihat catatan Fase 19 §4.5 — putuskan sekali untuk kedua
   fase).
5. **`AttendanceMonitorController::show()` + `AttendanceController::index()`** —
   §3.6, **hanya jika ≤ ~30 baris**.
6. **`docs/ROADMAP.md`** — catat bahwa Alpha bersifat turunan dan libur nasional
   tidak dikenali. Ini akan ditanyakan lagi enam bulan lagi; tulis jawabannya
   sekarang.

---

## 5. Berkas yang disentuh

**Baru (2):**

```
app/Support/AttendanceStatus.php
tests/Unit/AttendanceStatusTest.php
```

**Diubah (3-5):**

```
app/Http/Controllers/AttendanceMonitorController.php
resources/js/components/attendance-monitor/daily-roster.tsx
docs/ROADMAP.md
app/Http/Controllers/AttendanceController.php          (§3.6, opsional)
resources/js/pages/attendance/index.tsx                (§3.6, opsional)
```

---

## 6. Test

**`tests/Unit/AttendanceStatusTest.php`** (tanpa DB, cepat):

| Test | Yang dijaga |
|---|---|
| `test_past_workday_without_record_is_alpha` | inti |
| `test_today_without_record_is_not_alpha` | §3.3 |
| `test_weekend_is_not_counted` | §3.2 butir 4 |
| `test_date_outside_pkl_period_is_not_counted` | §3.2 butir 5 |
| `test_existing_record_wins_over_derivation` | sakit/izin/libur/hadir **tidak pernah** jadi Alpha |
| `test_student_without_pkl_period_still_gets_alpha` | `pklStart`/`pklEnd` null tidak boleh mematikan fitur |

**`tests/Feature/AttendanceMonitorTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_past_date_roster_labels_missing_students_as_alpha` | §3.7 |
| `test_weekend_students_are_excluded_from_the_belum_tab` | §3.7 |
| `test_alpha_disappears_after_proxy_attendance_is_recorded` | **§3.1** — koreksi terlambat menghapus Alpha tanpa jalur pembersihan. Ini yang membuktikan pilihan "turunan" benar. |

Semua memakai `Carbon::setTestNow()` — tanpa itu, test akan lulus pada hari
Selasa dan gagal pada hari Sabtu.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Libur nasional tampil sebagai Alpha massal | Operator kehilangan kepercayaan pada angkanya | Diakui eksplisit (§3.2) + `LeaveRequest` sebagai jalan keluar hari ini. **Sampaikan ke user saat serah terima**, jangan biarkan jadi kejutan. |
| Test bergantung hari nyata | Suite hijau/merah tergantung kapan dijalankan | `Carbon::setTestNow()` di **semua** test fase ini |
| Hari kerja per-industri berbeda (mis. industri 6 hari kerja) | Sabtu yang seharusnya dihitung jadi tidak dihitung | Tidak dimodelkan. Terima; kalau nyata, kolom `industries.hari_kerja` adalah fase tersendiri. |
| Definisi Alpha tersebar ke beberapa berkas | Dua layar menampilkan angka berbeda | §3.4 — satu kelas, dipakai semua |
| N+1 dari `pkl_period` per baris | Halaman lambat | Eager-load `pkl_period:id,start_period,end_period` (pola sudah ada di `AttendanceMonitorController::show()`) |
| Alpha dianggap sanksi resmi padahal turunan | Sengketa dengan siswa/orang tua | Beri catatan kecil di UI: *"Alpha dihitung otomatis dari ketiadaan data presensi pada hari kerja."* Satu kalimat, mencegah percakapan panjang. |

**Test lama yang harus tetap hijau:** `AttendanceTest.php`,
`AttendanceMonitorTest.php`, `DashboardTest.php`, `RaporTest.php`,
`CertificateTest.php` (keduanya membaca rekap absen — pastikan tidak ada yang
ikut berubah).
