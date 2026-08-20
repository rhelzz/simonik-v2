# Fase 22 — Data Absen: card Rate absensi + rapikan grid kartu jurusan

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** rendah ·
**Migrasi:** tidak · **Perkiraan:** ~2-3 jam

## 1. Permintaan (tiga butir, satu file)

> **Admin #2:** "Pada page admin modul Data Absen, buatkan fitur card Rate
> absensi (bisa diambil dari dashboard)"
>
> **Admin #3:** "hapus grid gap agar pada komponen card data jurusan tidak
> memakan space ke bawah"
>
> **Guru #1:** *(identik dengan Admin #3)*

Ketiganya menyentuh **satu berkas**: `resources/js/pages/attendance-monitor/index.tsx`.
Digabung agar layoutnya tidak ditata dua kali.

---

## 2. Kondisi sekarang

### 2.1 Card Rate absensi sudah ada — di dashboard

Komponen `RateCard` sudah lengkap di
`resources/js/components/dashboard/widgets.tsx:148` — ikon, judul, subtitle,
**tab rentang** (Hari ini / Minggu / Bulan / Semua), angka besar. Dipakai di
`dashboard.tsx`, `dashboard-staff.tsx`, `dashboard-kaprog.tsx`,
`dashboard-wakasek.tsx`.

Permintaan user sendiri sudah menunjuk ke sana: *"bisa diambil dari dashboard"*.
Jadi tidak ada komponen baru — **impor komponen yang sudah ada.**

### 2.2 Perhitungannya **private di DashboardController** — ini hambatannya

`DashboardController` menghitung rate lewat 3 method privat:

| Method | Baris | Isi |
|---|---|---|
| `participation(array $activeUserIds): array` | ~396 | mengembalikan `['attendance' => [...], 'journal' => [...]]` |
| `rates(array $days, int $activeCount): array` | ~549 | rate per rentang (today/week/month/all) |
| `rate(array $days, int $activeCount, int $effectiveDays): int` | ~617 | rasio hari-siswa aktif ÷ (siswa aktif × hari efektif), dibatasi 100% |

Ketiganya `private`. `AttendanceMonitorController` tidak bisa memanggilnya.

**Definisi "siswa aktif" yang dipakai dashboard** (`adminDashboard()` baris 91):

```php
Student::query()->where('status_pkl', 'proses')->pluck('user_id')->all()
```

### 2.3 Grid kartu jurusan

`resources/js/pages/attendance-monitor/index.tsx` baris ~53:

```tsx
<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
```

Tiap kartu: `rounded-2xl border p-4` berisi ikon `size-10`, nama jurusan, dan
"N murid" — tinggi ± 74px per kartu.

---

## 3. Keputusan implementasi

### 3.1 Ekstrak 3 method rate ke trait `SummarizesParticipation` (memenuhi syarat ≥2 pemakai)

Tiga opsi ditimbang:

| Opsi | Putusan |
|---|---|
| Salin `rate()`/`rates()` ke `AttendanceMonitorController` | ❌ Duplikasi rumus. Dua salinan akan berbeda diam-diam, lalu dashboard dan Data Absen menampilkan angka berbeda untuk hal yang sama — dan tidak ada yang tahu mana yang benar. |
| Jadikan `public` lalu panggil `app(DashboardController::class)` | ❌ `CLAUDE.md`: jangan `app()`/`resolve()` di dalam kelas. Controller memanggil controller juga bukan pola yang ada di repo ini. |
| **Ekstrak ke trait `Concerns/SummarizesParticipation`** | ✅ Persis pola yang sudah dipakai repo: `SummarizesStudentPerformance`, `ScopesStudentsByRole`, `ScopesProgramByKaprog` — semuanya trait di `app/Http/Controllers/Concerns/`. |

Pemakai setelah ekstraksi: `DashboardController` (5 method dashboard) +
`AttendanceMonitorController` = **≥2 tempat hari ini**. Syarat README §2.1
terpenuhi.

**Ekstraksi ini murni pemindahan — nol perubahan logika.** Kalau ada satu baris
pun yang tergoda untuk "sekalian dirapikan", jangan: `DashboardTest.php` adalah
jaring pengamannya, dan jaring itu hanya berguna kalau perilakunya identik.

### 3.2 Rate di Data Absen dibatasi cakupan role — tidak menyalin `where('status_pkl','proses')` mentah

Dashboard admin menghitung dari **seluruh** siswa aktif. Halaman Data Absen
harus mengikuti cakupan role (README §2.2), kalau tidak seorang guru akan
melihat angka rate sekolah di halaman yang seluruh isinya adalah siswanya
sendiri — dua angka yang saling bertentangan di satu layar.

```php
$activeUserIds = $this->scopedStudents($user)
    ->where('status_pkl', 'proses')
    ->whereNotNull('user_id')
    ->pluck('user_id')
    ->all();

$participation = $this->participation($activeUserIds);
```

`whereNotNull('user_id')` — alasan sama seperti Fase 19 §3.4 (siswa bisa tanpa
akun).

### 3.3 Hanya card **absensi** yang ditampilkan, bukan pasangan absensi+jurnal

`participation()` mengembalikan keduanya sekaligus, dan menampilkan keduanya
"karena datanya sudah ada" itu menggoda. Tapi ini halaman **Data Absen**; rate
jurnal punya rumahnya sendiri di `/monitoring/jurnal`. Kirim hanya
`$participation['attendance']` sebagai prop.

> Kalau nanti diminta, rate jurnal di halaman Data Jurnal = 3 baris (trait sudah
> ada, tinggal render `$participation['journal']`).

### 3.4 Hapus `gap` — sesuai permintaan, apa adanya

**Dikonfirmasi user (2026-08-20): ikuti instruksinya.** Gap dihilangkan.

```tsx
- <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
+ <div className="mt-5 grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
```

Satu kelas berubah. Jumlah kolom, padding kartu, dan ukuran ikon **tidak
disentuh** — itu penataan ulang yang tidak diminta, dan permintaannya sudah
spesifik.

**Satu hal yang tetap harus dikerjakan** (bukan tambahan, tapi konsekuensi
langsung dari menghapus gap): tiap kartu punya `border border-line`, jadi kartu
yang bersentuhan menghasilkan **garis ganda 2px** di setiap sambungan. Itu
terlihat seperti bug rendering, bukan desain.

Perbaikannya satu kelas juga — tarik border yang bersebelahan agar bertumpuk:

```tsx
className="… rounded-2xl border border-line … -mt-px -ml-px"
```

atau, kalau hasilnya kurang rapi dengan `rounded-2xl`, buang radius pada kartu
dan pindahkan ke wadah grid (`overflow-hidden rounded-2xl` di grid, kartu tanpa
radius) — ini pola "tabel kartu" yang umum dan tidak menambah komponen apa pun.

Putuskan mana yang dipakai **dengan melihat hasilnya di browser**, bukan dari
dokumen ini. Keduanya nol dependensi, nol komponen baru.

```
// ponytail: gap-0 sesuai permintaan; border kartu ditarik agar tidak dobel.
// Kalau nanti terasa terlalu padat di HP, yang diubah adalah jumlah kolom
// (grid-cols-2 di base), bukan mengembalikan gap.
```

Catatan pengukuran, untuk arsip kalau keluhan "memakan space ke bawah" ternyata
belum hilang: `gap-3` = 12px per sambungan, dan di HP grid ini **1 kolom**, jadi
8 jurusan → 8 baris ≈ 690px, di mana gap hanya menyumbang ~84px. Sisanya berasal
dari jumlah baris. Kalau setelah perubahan ini halamannya masih terasa panjang,
**itu** tuasnya — `grid-cols-2` di base memangkas ±50%, jauh lebih besar dari
gap. Jangan dikerjakan sekarang; tunggu keluhannya muncul lagi.

### 3.5 Perubahan yang sama **otomatis** berlaku untuk guru pembimbing

Butir Guru #1 selesai tanpa satu baris tambahan: `attendance-monitor/index.tsx`
adalah halaman yang sama untuk semua role (README §0). Rate card pun ikut muncul
untuk guru — dengan angka yang sudah ter-scope berkat §3.2.

**Apakah rate card juga untuk orangtua & pembimbing?** Ya, dan itu masuk akal
(orang tua melihat rate anaknya). Tidak ada `can` gate — datanya sudah ter-scope,
dan menyembunyikannya justru butuh kode tambahan tanpa alasan.

---

## 4. Rencana implementasi

### 4.1 Trait baru — `app/Http/Controllers/Concerns/SummarizesParticipation.php`

Pindahkan **apa adanya** dari `DashboardController`:
`participation()`, `rates()`, `rate()` (ubah `private` → `protected`), beserta
seluruh PHPDoc array-shape-nya (dibutuhkan PHPStan).

Periksa apakah ketiganya memanggil helper privat lain di `DashboardController`
(mis. konstanta rentang atau `buildTrend()`). Kalau `participation()` ternyata
bergantung pada `buildTrend()` / `participationTrend()`, **jangan** ikut
memindahkan tren — `AttendanceMonitorController` tidak membutuhkannya. Putuskan
saat membaca kodenya.

`DashboardController` menambahkan `use SummarizesParticipation;` dan menghapus
ketiga method itu dari badannya. **Tidak ada perubahan lain di file itu.**

### 4.2 `AttendanceMonitorController::index()`

```php
use SummarizesParticipation;

public function index(Request $request): Response
{
    /** @var User $user */
    $user = $request->user();

    // …kode counts & departemens yang sudah ada, tidak berubah…

    $activeUserIds = $this->scopedStudents($user)
        ->where('status_pkl', 'proses')
        ->whereNotNull('user_id')
        ->pluck('user_id')
        ->all();

    return Inertia::render('attendance-monitor/index', [
        'departemens' => $departemens,
        'scopeLabel' => $this->scopeLabel($user),
        'attendanceRate' => $this->participation($activeUserIds)['attendance'],
    ]);
}
```

Catatan performa: ini **satu kueri agregat tambahan** pada halaman yang sudah
melakukan satu agregat. Dapat diterima. Kalau `participation()` ternyata
menjalankan >2 kueri, ukur dulu sebelum memutuskan apa pun.

### 4.3 `resources/js/pages/attendance-monitor/index.tsx`

```tsx
import { RateCard, type RateByRange } from '@/components/dashboard/widgets';

type Props = {
    departemens: DepartemenCard[];
    scopeLabel: string;
    attendanceRate: RateByRange;
};
```

`RateCard` dirender **di atas** seksi jurusan (angka ringkas dulu, detail
drill-down setelahnya) — konsisten dengan urutan di semua dashboard.

`subtitle` harus mengikuti cakupan, bukan teks tetap: pakai `scopeLabel` yang
sudah dikirim, atau kalimat pendek turunannya. Kartu bertuliskan "Siswa yang
hadir di tempat PKL" di layar seorang guru harus berarti *siswanya*.

Lalu terapkan §3.4 pada grid & kartu.

---

## 5. Berkas yang disentuh

**Baru (1):**

```
app/Http/Controllers/Concerns/SummarizesParticipation.php
```

**Diubah (3):**

```
app/Http/Controllers/DashboardController.php          (−3 method, +1 use)
app/Http/Controllers/AttendanceMonitorController.php  (+1 use, +1 prop)
resources/js/pages/attendance-monitor/index.tsx       (+RateCard, layout grid)
```

---

## 6. Test

**Tambahkan ke `tests/Feature/AttendanceMonitorTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_attendance_monitor_index_includes_attendance_rate` | prop `attendanceRate` ada dan berisi 4 kunci rentang |
| `test_attendance_rate_is_scoped_to_the_teacher` | **inti §3.2** — guru dengan 1 siswa hadir dari 1 siswa aktif melihat 100%, meski sekolah punya puluhan siswa aktif yang tidak absen |

**Jaring pengaman ekstraksi:** seluruh `tests/Feature/DashboardTest.php` harus
tetap hijau **tanpa satu pun perubahan pada file test itu**. Kalau ada
assertion dashboard yang perlu disesuaikan, berarti §4.1 bukan pemindahan murni
— berhenti dan cari tahu apa yang berubah.

Layout (§3.4) tidak punya test otomatis — verifikasi manual di 375px, 768px, dan
1366px, dengan minimal 6 jurusan. Yang dicari: **tidak ada garis dobel** di
sambungan antar-kartu, dan sudut membulat masih terlihat benar di kartu
pojok.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Ekstraksi trait mengubah perilaku diam-diam | Angka dashboard bergeser | `DashboardTest.php` hijau **tanpa diedit** (§6) |
| PHPStan gagal setelah pindah trait | CI merah | Bawa serta seluruh PHPDoc array-shape; `vendor/bin/phpstan analyse app/Http/Controllers/Concerns/SummarizesParticipation.php` |
| Rate di Data Absen ≠ rate di dashboard untuk admin | Operator bingung | Untuk admin keduanya **memang** sama (cakupan admin = semua siswa). Untuk guru sengaja berbeda dan itu benar — jelaskan lewat `ScopeNote` yang sudah ada di halaman. |
| Border kartu jadi dobel 2px setelah `gap-0` | Terlihat seperti bug rendering | §3.4 — tarik border (`-mt-px -ml-px`) atau pindahkan radius ke wadah grid. **Wajib diverifikasi di browser**, bukan diasumsikan |
| Rate 0% terlihat seperti fitur rusak | Laporan bug palsu | Kalau tidak ada siswa `status_pkl = 'proses'` dalam cakupan, tampilkan `—`, bukan `0%`. Cek perilaku `RateCard` untuk nilai 0 sebelum memutuskan. |

**Test lama yang harus tetap hijau:** `DashboardTest.php` (seluruhnya, tanpa
diedit), `AttendanceMonitorTest.php`, `KaprogScopeTest.php`.
