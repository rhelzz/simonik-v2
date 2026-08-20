# Fase 23 — Tabel murid yang sudah & belum presensi

**Status:** 📝 Rencana · **Prioritas:** P1 · **Risiko regresi:** sedang ·
**Migrasi:** tidak · **Perkiraan:** ~4-5 jam

## 1. Permintaan (dua butir identik)

> **Admin #4 / Guru #2:** "Pada page https://simonik.pro/monitoring/absen modul
> Data Absen, buatkan fitur tabel murid yang sudah melakukan presensi dan yang
> belum melakukan presensi"

Satu halaman, satu implementasi (README §0).

**Fase ini adalah fondasi Fase 24 dan Fase 27.** Definisi "belum presensi" yang
ditetapkan di sini dipakai ulang oleh keduanya — jadi definisinya harus dibuat
sekali, benar, di satu tempat.

---

## 2. Kondisi sekarang

`/monitoring/absen` (`AttendanceMonitorController::index()`) hanya menampilkan
**kartu jurusan**. Daftar murid baru muncul dua level di bawahnya
(`students()`, per-kelas) dan isinya rekap **kumulatif** (`withCount('attendances')`),
bukan status hari ini.

Artinya: **tidak ada satu pun layar** yang menjawab "siapa yang belum absen hari
ini?" — pertanyaan operasional paling sering di aplikasi absensi. Untuk
menjawabnya sekarang, seorang guru harus membuka jurusan → kelas → tiap murid
satu per satu.

Bahan yang sudah ada:

| Kebutuhan | Sumber |
|---|---|
| Siswa dalam cakupan | `ScopesStudentsByRole::scopedStudents()` |
| Baris absen hari itu | `attendances` (`user_id`, `date`, `status`, `arrivalTime`) |
| Relasi | `Attendance::users(): BelongsTo` → **`users.id`**, bukan `students.id` |
| Status yang ada | `hadir` (checkIn), `libur` / `sakit` / `izin` (dari approval, `ApproveRequest::handle()`) |
| Pola tabel + filter + paginasi | `pages/students/index.tsx`, `docs/UI-PATTERNS.md` |
| Komponen | `Select`, `Pagination`, `Breadcrumb`, `ScopeNote` |

---

## 3. Keputusan implementasi

### 3.1 Definisi "sudah presensi" = ada baris `attendances` pada tanggal itu

Bukan `status === 'hadir'`. Siswa yang sakit/izin/libur (dengan approval)
**punya** baris absen — mereka sudah terhitung, tidak boleh muncul di daftar
"belum". Yang "belum" adalah **tidak adanya baris sama sekali**.

```
sudah  = EXISTS(attendances WHERE user_id = students.user_id AND date = :tanggal)
belum  = NOT EXISTS(...)
```

Tabel "sudah" tetap menampilkan **kolom status** (`Hadir` / `Sakit` / `Izin` /
`Libur`) supaya perbedaan itu terbaca, bukan disembunyikan di balik satu kata
"sudah".

Definisi inilah yang dipakai Fase 27 untuk menurunkan **Alpha**, dan Fase 24
untuk menentukan siapa yang boleh dipresensikan.

### 3.2 Populasi = siswa **aktif PKL** dalam cakupan, bukan semua siswa

```php
$this->scopedStudents($user)->where('status_pkl', 'proses')->whereNotNull('user_id')
```

Siswa yang belum mulai (`belum`) atau sudah selesai (`selesai`) memang tidak
absen — memasukkannya ke daftar "belum presensi" akan mengubur nama yang benar
di bawah puluhan nama yang tidak relevan, dan membuat fiturnya tak terpakai
dalam sebulan.

`whereNotNull('user_id')`: siswa tanpa akun tidak bisa absen sama sekali
(alasan sama dengan Fase 19 §3.4).

Konsisten dengan definisi "siswa aktif" yang sudah dipakai
`DashboardController::adminDashboard()` (baris 91) dan Fase 22 §3.2.

### 3.3 Ditaruh di halaman `index` sebagai panel "Presensi hari ini", di atas kartu jurusan

Permintaannya menyebut `/monitoring/absen` — itu halaman `index`.

Panel ini menjawab pertanyaan harian; kartu jurusan menjawab pertanyaan
penelusuran. Yang harian di atas.

Urutan halaman setelah Fase 22 + 23:

```
1. Card Rate absensi          (Fase 22)
2. Panel "Presensi hari ini"  (Fase 23)  ← tabel Sudah / Belum
3. Kartu jurusan drill-down   (sudah ada)
```

### 3.4 Satu tabel dengan **tab**, bukan dua tabel bersanding

Permintaan menyebut "tabel murid yang sudah … dan yang belum" — terbaca seperti
dua tabel. Ditolak, karena:

- Dua tabel = dua paginasi independen di satu layar. Membingungkan, dan di HP
  keduanya menumpuk jadi layar yang sangat panjang (persis keluhan yang jadi
  dasar Fase 22 §3.4).
- Kolomnya identik kecuali satu (status vs. tidak ada status).

**Dipilih:** satu tabel + tab `Belum (12)` / `Sudah (48)` dengan **jumlah di
label tab** — jadi kedua angka tetap terlihat sekaligus tanpa dua tabel.

**Tab default = "Belum".** Itu daftar yang butuh tindakan. "Sudah" adalah
konfirmasi, dan konfirmasi tidak perlu jadi layar pembuka.

### 3.5 Tanggal bisa dipilih, default hari ini

`?tanggal=YYYY-MM-DD`, default `Carbon::today()`. Satu `<input type="date">`
native.

Diperlukan karena: (a) operator menyusul rekap kemarin, (b) Fase 24 (presensi
diwakilkan dengan waktu custom) butuh konteks tanggal yang sama, (c) Fase 27
(Alpha) hanya bermakna untuk tanggal lampau.

Validasi: `date`. Tidak ada batas atas — memilih tanggal besok menghasilkan
"semua belum", yang tidak berbahaya dan tidak perlu dilarang dengan kode.

### 3.6 Paginasi wajib, `withQueryString()`, urutan eksplisit

`paginate(15)->withQueryString()` dengan `orderBy('name')` — `CLAUDE.md`
mewajibkan urutan sebelum paginasi. Tanpa `withQueryString()`, klik halaman 2
akan kehilangan filter tanggal & tab.

Untuk admin sekolah besar daftar "sudah" bisa ratusan baris; mengirim semuanya
sebagai prop Inertia akan membengkakkan setiap muat halaman.

### 3.7 Satu kueri, `whereHas`/`whereDoesntHave` — bukan dua kueri lalu diselisihkan di PHP

```php
$students = $base
    ->when($tab === 'sudah',
        fn (Builder $q) => $q->whereHas('user.attendances', $onDate),
        fn (Builder $q) => $q->whereDoesntHave('user.attendances', $onDate),
    )
```

Mengambil semua siswa + semua absen lalu `array_diff` di PHP akan menarik
ribuan baris ke memori setiap muat halaman, dan **tidak bisa dipaginasi di
database**. `whereDoesntHave` menghasilkan `NOT EXISTS` yang dipaginasi
langsung oleh SQL.

**Prasyarat — sudah terpenuhi, tidak perlu menambah apa pun.** `User::attendances()`
dan `User::activities()` **sudah ada**; keduanya dipakai
`BadgeAwarder::buildStats()` (`$user->attendances()->…`, `$user->activities()->count()`).
Jadi `whereHas('user.attendances', …)` langsung bisa dipakai.

Kalau relasi lewat `Student → User → Attendance` terasa berbelit, alternatif
yang setara: `whereIn('user_id', …)` / `whereNotIn(…)` terhadap sub-kueri
`attendances` pada tanggal itu. **Pilih mana pun yang lebih terbaca**; keduanya
menghasilkan satu SQL dan dapat dipaginasi. Jangan pilih yang menarik data ke
PHP.

### 3.8 Hitungan tab: 2 `count()` ringan, bukan `count()` atas koleksi penuh

```php
$sudah = (clone $base)->whereHas('user.attendances', $onDate)->count();
$belum = (clone $base)->count() - $sudah;
```

`$belum` dihitung dengan pengurangan, bukan `whereDoesntHave(...)->count()`
kedua — hasilnya identik dan menghemat satu `NOT EXISTS` di setiap muat halaman.

---

## 4. Rencana implementasi

### 4.1 `AttendanceMonitorController::index()`

```php
$date = $request->date('tanggal') ?? Carbon::today();
$tab = $request->query('tab') === 'sudah' ? 'sudah' : 'belum';

$base = $this->scopedStudents($user)
    ->where('status_pkl', 'proses')
    ->whereNotNull('user_id');

$onDate = fn (Builder $q) => $q->whereDate('date', $date);

// …§3.7 & §3.8…

return Inertia::render('attendance-monitor/index', [
    'departemens' => $departemens,          // sudah ada
    'scopeLabel' => $this->scopeLabel($user), // sudah ada
    'attendanceRate' => …,                   // Fase 22
    'roster' => $students,                   // paginator
    'summary' => ['sudah' => $sudah, 'belum' => $belum],
    'filters' => ['tanggal' => $date->format('Y-m-d'), 'tab' => $tab],
    'dateLabel' => $date->translatedFormat('l, d F Y'),
]);
```

`$request->date()` (helper bawaan Laravel) mengembalikan `Carbon|null` dan
menangani format tak valid — tidak perlu `Carbon::parse()` manual di dalam
`try`.

Baris paginator yang dikirim (`through()`), **status dipetakan di backend**
sesuai `CLAUDE.md`:

```php
'id' => $student->id,
'name' => $student->name,
'nis' => $student->nis,
'class' => $student->classes?->name,
'industry' => $student->industries?->name,
'status' => $attendance?->status,            // 'hadir'|'sakit'|'izin'|'libur'|null
'statusLabel' => $labels[$attendance?->status] ?? 'Belum presensi',
'arrivalTime' => $attendance?->arrivalTime ? mb_substr($attendance->arrivalTime, 0, 5) : null,
```

**Eager-load wajib** (`CLAUDE.md`: hindari N+1 pada kueri yang memberi makan
halaman Inertia):

```php
->with([
    'classes:id,name',
    'industries:id,name',
    'user.attendances' => fn ($q) => $q->whereDate('date', $date),
])
```

Tanpa baris ketiga, tabel 15 baris = 15 kueri tambahan.

### 4.2 Frontend

**Berkas baru:** `resources/js/components/attendance-monitor/daily-roster.tsx`

- Header: judul "Presensi hari ini" + `dateLabel` + `<input type="date">`.
- Tab `Belum (N)` / `Sudah (N)` — gaya tab mengikuti pemilih rentang di
  `RateCard` (`widgets.tsx:181-199`) supaya halaman ini tidak memperkenalkan
  gaya tab kedua.
- Tabel: Nama · NIS · Kelas · Industri · Status (+ Jam, hanya di tab "sudah").
- `<Pagination>` yang sudah ada.
- Empty state: **"Semua murid sudah presensi hari ini 🎉"** untuk tab "belum"
  yang kosong. Ini keadaan sukses, bukan "tidak ada data" — bedakan.
- Ganti tab / tanggal → `router.get(url, {...}, { preserveState: true, preserveScroll: true, replace: true })`.
  Tanpa `preserveScroll`, mengganti tab akan melompatkan operator ke atas halaman.

**Diubah:** `resources/js/pages/attendance-monitor/index.tsx` — render komponen
di atas, plus tipe props.

> **Partial reload (opsional, kalau terasa lambat):** `only: ['roster','summary','filters']`
> agar `departemens` & `attendanceRate` tidak dihitung ulang tiap ganti tab.
> Inertia v2 mendukungnya. **Ukur dulu** — jangan tambahkan sebelum ada gejala.

---

## 5. Berkas yang disentuh

**Baru (1):**

```
resources/js/components/attendance-monitor/daily-roster.tsx
```

**Diubah (3-4):**

```
app/Http/Controllers/AttendanceMonitorController.php  (index diperluas)
resources/js/pages/attendance-monitor/index.tsx
tests/Feature/AttendanceMonitorTest.php               (+test)
```

---

## 6. Test — tambahan di `tests/Feature/AttendanceMonitorTest.php`

| Test | Yang dijaga |
|---|---|
| `test_daily_roster_separates_present_and_absent_students` | inti fitur: 1 siswa punya baris hari ini → tab "sudah"; 1 tidak → tab "belum" |
| `test_students_with_sakit_status_count_as_present` | **§3.1** — sakit/izin/libur **tidak** masuk daftar "belum" |
| `test_daily_roster_only_includes_active_pkl_students` | **§3.2** — `status_pkl = 'belum'` tidak muncul di mana pun |
| `test_daily_roster_is_scoped_to_the_teacher` | **keamanan** — guru tidak melihat siswa di luar bimbingannya |
| `test_daily_roster_respects_selected_date` | absen kemarin tidak membuat siswa terhitung "sudah" hari ini |
| `test_daily_roster_summary_counts_match_the_tabs` | §3.8 — `belum` hasil pengurangan cocok dengan isi tab |

Test kedua adalah yang paling mudah dilanggar oleh implementasi naif
(`where('status','hadir')`), dan konsekuensinya paling buruk: siswa sakit
ber-approval lengkap muncul sebagai "belum presensi", lalu dipresensikan
paksa oleh guru lewat Fase 24 — menimpa status sakitnya.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| N+1 pada kolom status | Halaman lambat, makin parah seiring data | Eager-load berkondisi (§4.1) + periksa dengan Debugbar |
| Siswa sakit/izin masuk daftar "belum" | Data absen tertimpa lewat Fase 24 | §3.1 + test khusus |
| Daftar admin sangat besar | Halaman berat | Paginasi 15 (§3.6) |
| Timezone: `whereDate` vs `Carbon::today()` | "Belum presensi" palsu setelah tengah malam | Pakai `config('app.timezone')` yang sama dengan `AttendanceController::checkIn()` (`Carbon::today()`); test dengan `Carbon::setTestNow()` |
| Fase 26 menghapus approval Ortu → status sakit muncul lebih cepat | Tidak ada — justru membuat tab "belum" lebih akurat | — |
| Halaman `index` jadi terlalu ramai (rate + roster + jurusan) | Kebingungan | Urutan §3.3; kartu jurusan tetap di bawah dengan judul seksi yang jelas |

**Test lama yang harus tetap hijau:** `AttendanceMonitorTest.php` (seluruhnya),
`KaprogScopeTest.php`, `AttendanceTest.php`.
