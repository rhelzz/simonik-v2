# Fase 19 — Reset Data Absen (jurusan / kelas / industri / tanggal / murid)

**Status:** 📝 Rencana · **Prioritas:** P1 · **Risiko regresi:** **TINGGI (destruktif)** ·
**Migrasi:** tidak · **Perkiraan:** ~5-7 jam

> ⚠️ **Fase ini menghapus data produksi secara permanen.** Baca §3.1 (kenapa
> tanpa undo) dan §7 sebelum implementasi.

## 1. Permintaan (dua butir yang digabung)

**Butir "Fitur 2 — Reset Data Absen":**

> "Admin bisa reset data absen & data jurnal agar dapat direset dari awal. Nah
> untuk resetnya dibuat pilihan bisa reset berdasarkan: 1. Jurusan 2. Kelas
> 3. Industri. Setelah memilih kategori di atas baru minta masukin password,
> untuk passwordnya pake password login admin aja"

**Butir "Page role admin #6":**

> "buatkan fitur untuk reset (button) data presensi, kemudian menampilkan modal
> yang isi modalnya bisa diatur berdasarkan tanggal, bisa di atur berdasarkan
> semua murid, bisa diatur berdasarkan beberapa murid"

**Ini fitur yang sama, diminta dua kali dengan sumbu filter berbeda.** Membuat
dua tombol reset di halaman yang sama adalah cara tercepat membuat operator
menghapus hal yang salah. **Satu tombol, satu modal, lima sumbu filter.**

## 2. Kondisi sekarang

**Tidak ada fitur reset/hapus massal absen sama sekali.** Grep
`reset|bulkDestroy|truncate` di `app/Http/Controllers/AttendanceMonitorController.php`
→ 0 hasil. Halaman `/monitoring/absen` (`AttendanceMonitorController::index`)
saat ini murni baca (4 layer drill-down).

Yang sudah ada dan dipakai ulang:

| Kebutuhan | Sudah ada | Bukti |
|---|---|---|
| Pembatasan siswa per role | `ScopesStudentsByRole::scopedStudents()` | dipakai 7 controller |
| Sumbu **jurusan** | `students.departemen_id` | `AttendanceMonitorController::index()` mengelompokkan dengan kolom ini |
| Sumbu **kelas** | `students.class_id` | `AttendanceMonitorController::classes()` |
| Sumbu **industri** | `students.industri_id` | `ScopesStudentsByRole::studentsAtIndustries()` |
| Hapus massal + konfirmasi | pola hapus massal siswa | `docs/PROGRESS.md` §53 ("Pilih beberapa siswa → hapus massal") |
| Verifikasi password | aturan `current_password` bawaan Laravel | — |
| Modal | `resources/js/components/ui/modal.tsx` | |
| Dropdown | `resources/js/components/ui/select.tsx` | wajib, bukan `<select>` |

**Bentuk data yang akan dihapus:** `attendances` (`user_id`, `date`, …).
Perhatikan: relasinya ke **`users.id`**, bukan `students.id`
(`Attendance::users(): BelongsTo` → `User::class, 'user_id'`). Setiap filter
berbasis siswa harus melewati `students.user_id`. Salah di titik ini = menghapus
baris milik orang lain.

**Relasi yang ikut terdampak — WAJIB diperhatikan:**
`Attendance` punya `morphOne(Approval::class, 'approvable')`
(`app/Models/Attendance.php`). Menghapus baris absen **tanpa** menghapus
`approvals` yang menunjuk ke sana meninggalkan approval yatim yang tetap muncul
di Inbox Persetujuan dan **meledak saat di-render** (`ApprovalController::index()`
memanggil `$approvable->users->name` — `$approvable` jadi `null`). Lihat §3.5.

## 3. Keputusan implementasi

### 3.1 Hard delete, tanpa undo, tanpa audit log — tapi dengan tiga lapis pengaman

Permintaannya "direset dari awal". Itu hard delete.

**Ditolak — soft delete:** menambah `deleted_at` + `SoftDeletes` ke `attendances`
berarti **setiap** kueri absen di seluruh aplikasi (dashboard, monitoring,
rekap, rapor, sertifikat, badge) diam-diam berubah semantiknya. Itu perubahan
menyeluruh pada modul terpanas demi fitur yang dipakai sekali per semester —
persis definisi over-engineering yang menyebabkan regresi.

**Ditolak — tabel `reset_logs`:** tabel baru tanpa pembaca. Tidak ada halaman
yang akan menampilkannya, tidak ada yang akan membukanya.

**Dipilih — tiga lapis pengaman (README §2.4):**

1. **Pratinjau server-side** — modal menampilkan `N baris akan dihapus` sebelum
   tombol Reset aktif. **Angkanya dari server**, bukan tebakan React.
2. **Password** — `current_password` (README §2.3).
3. **Laporan angka** — flash `"240 data absen berhasil direset."`, bukan
   `"berhasil"`.

```php
// ponytail: hard delete tanpa undo. Soft-delete akan mengubah semantik setiap
// kueri absen di seluruh aplikasi demi fitur sekali-per-semester. Tambahkan
// SoftDeletes hanya kalau ada insiden salah-reset yang nyata.
```

### 3.2 Satu action class `ResetStudentRecords`, dipakai absen & jurnal

Syarat "abstraksi baru hanya kalau dipakai ≥2 tempat hari ini" (README §2.1)
**terpenuhi**: Fase 19 (absen) dan Fase 20 (jurnal). Struktur `attendances` dan
`activities` identik untuk keperluan ini — keduanya `user_id` + `date`.

```php
// app/Actions/ResetStudentRecords.php
class ResetStudentRecords
{
    /**
     * Hapus baris milik siswa dalam cakupan pemanggil sesuai kriteria.
     *
     * @param  Builder<Student>  $scopedStudents  WAJIB sudah dibatasi role
     * @param  class-string<Model>  $model  Attendance::class | Activity::class
     * @param  array{departemen_id?:int|null, class_id?:int|null, industri_id?:int|null,
     *               student_ids?:array<int,int>, from?:string|null, to?:string|null}  $criteria
     * @return int jumlah baris terhapus
     */
    public function handle(Builder $scopedStudents, string $model, array $criteria): int
    public function count(Builder $scopedStudents, string $model, array $criteria): int
}
```

`handle()` dan `count()` memakai **satu** method privat pembangun kueri
(`query()`), sehingga pratinjau dan penghapusan **tidak mungkin** memakai
kriteria yang berbeda. Ini bukan sekadar kerapian: pratinjau yang menghitung
himpunan berbeda dari yang dihapus adalah bug paling berbahaya di fitur ini.

### 3.3 Kriteria: AND, bukan OR — dan penjelasannya harus terbaca di UI

Kelima sumbu bersifat **menyempitkan** (AND), bukan alternatif:

```
jurusan=RPL + kelas=XI RPL 1 + tanggal 01–31 Agt
  → hanya absen siswa XI RPL 1 (yang memang di RPL) pada Agustus
```

Ini yang diharapkan orang dari sebuah panel filter. Tapi **harus ditulis di
modal**, karena permintaan aslinya berbunyi seperti pilihan tunggal ("reset
berdasarkan: 1. Jurusan 2. Kelas 3. Industri"). Satu kalimat di modal:

> "Kriteria yang diisi akan digabung (AND). Kosongkan yang tidak dipakai."

Sumbu yang **kosong** = tidak menyaring. Semua kosong = **hapus seluruh absen
dalam cakupan Anda** — ini sah (itulah "reset dari awal") tapi pratinjau akan
menunjukkan angka besar, yang justru gunanya pratinjau.

`student_ids` menutupi butir "semua murid / beberapa murid": kosong = semua
murid yang lolos filter lain; terisi = hanya murid itu.

### 3.4 `whereIn('user_id', ...)` sebagai satu-satunya penjaga cakupan

```php
private function query(Builder $scopedStudents, string $model, array $criteria)
{
    $students = (clone $scopedStudents)
        ->when($criteria['departemen_id'] ?? null, fn ($q, $id) => $q->where('departemen_id', $id))
        ->when($criteria['class_id'] ?? null, fn ($q, $id) => $q->where('class_id', $id))
        ->when($criteria['industri_id'] ?? null, fn ($q, $id) => $q->where('industri_id', $id))
        ->when($criteria['student_ids'] ?? null, fn ($q, $ids) => $q->whereIn('id', $ids))
        ->whereNotNull('user_id');

    return $model::query()
        ->whereIn('user_id', $students->select('user_id'))
        ->when($criteria['from'] ?? null, fn ($q, $d) => $q->whereDate('date', '>=', $d))
        ->when($criteria['to'] ?? null, fn ($q, $d) => $q->whereDate('date', '<=', $d));
}
```

Tiga hal yang **tidak boleh** diubah tanpa berpikir ulang:

1. **`$scopedStudents` datang dari `$this->scopedStudents($user)`** —
   action tidak pernah memanggil `Student::query()` sendiri. Kalau action bisa
   membuat kuerinya sendiri, suatu hari seseorang akan memanggilnya tanpa
   scoping.
2. **`whereNotNull('user_id')`** — `students.user_id` bisa `null` (siswa tanpa
   akun; preseden: `parents.user_id` dibuat nullable di Fase 12). Tanpa guard
   ini `whereIn` menerima `NULL` dalam sub-kueri dan hasilnya
   *implementation-defined* antar-database. Sepele ditulis, mahal kalau lupa.
3. **`student_ids` disaring lewat `$scopedStudents`, bukan langsung ke
   `attendances`** — inilah yang membuat "kirim ID siswa sekolah lain dari
   devtools" menghasilkan 0 baris, bukan bencana.

**Sub-kueri, bukan `->pluck()`:** `whereIn(..., $students->select('user_id'))`
mengirim satu SQL. `pluck()` akan menarik ribuan ID ke memori PHP lalu
mengirimnya kembali sebagai literal `IN (...)` raksasa.

### 3.5 Approval yatim harus ikut dibersihkan (bug yang dicegah sebelum lahir)

`Attendance` punya `morphOne(Approval::class)`. Penghapusan massal lewat
`->delete()` pada query builder **tidak** memicu event model, jadi tidak ada
cascade apa pun.

Wajib, di dalam transaksi yang sama:

```php
DB::transaction(function () use ($query, $model): int {
    if ($model === Attendance::class) {
        // Approval polimorfik tidak punya FK ke attendances — tidak ada
        // cascade dari database. Tanpa baris ini, Inbox Persetujuan akan
        // menampilkan approval yatim dan ApprovalController::index() fatal
        // saat memanggil $approvable->users->name pada approvable null.
        Approval::query()
            ->where('approvable_type', Attendance::class)
            ->whereIn('approvable_id', (clone $query)->select('id'))
            ->delete();
    }

    return $query->delete();
});
```

**Verifikasi sebelum menulis kode:** cek juga apakah `activities` punya relasi
morph serupa (Fase 20). Dari `app/Models/Activity.php` saat ini: **tidak ada**
— tapi cek ulang saat mengerjakan, bukan percaya dokumen ini.

`DB::transaction` dipakai karena dua `DELETE` harus berhasil bersama; separuh
terhapus lebih buruk daripada tidak terhapus sama sekali.

### 3.6 Siapa yang boleh: admin saja (untuk sekarang)

Permintaan menyebut **"Admin bisa reset"**. Rute di-gate `role:admin`.

Action-nya sendiri sudah aman untuk role lain (dibatasi `scopedStudents`), jadi
membuka ke kaprog nanti = mengubah satu string middleware. Tapi **jangan dibuka
sekarang** — memberi wewenang menghapus kepada role yang tidak memintanya adalah
penambahan risiko tanpa permintaan.

```php
// ponytail: reset dikunci ke admin sesuai permintaan. Action-nya sendiri
// sudah aman untuk role lain (dibatasi scopedStudents), jadi membuka ke
// kaprog nanti = mengubah satu string middleware.
```

### 3.7 Sumbu tanggal: `from` & `to`, keduanya opsional

Permintaan admin #6 bilang "berdasarkan tanggal" (tunggal). Rentang
(`from`–`to`) mencakup kasus tanggal-tunggal (isi keduanya sama) **dan** kasus
"reset semester ini" — dengan jumlah field yang sama-sama dua. Rentang menang.

`to` divalidasi `after_or_equal:from`. Keduanya `<input type="date">` native.

---

## 4. Rencana implementasi

### 4.1 Action — `app/Actions/ResetStudentRecords.php`

Isi persis seperti §3.2 + §3.4 + §3.5. Tidak ada state, tidak ada konstruktor.

### 4.2 Form Request — `app/Http/Requests/ResetAttendanceRequest.php`

```php
public function rules(): array
{
    return [
        'password' => ['required', 'current_password'],
        'departemen_id' => ['nullable', 'integer', 'exists:departemens,id'],
        'class_id' => ['nullable', 'integer', 'exists:classes,id'],
        'industri_id' => ['nullable', 'integer', 'exists:industries,id'],
        'student_ids' => ['nullable', 'array'],
        'student_ids.*' => ['integer', 'exists:students,id'],
        'from' => ['nullable', 'date'],
        'to' => ['nullable', 'date', 'after_or_equal:from'],
    ];
}
```

`exists:` bukan demi keamanan (itu tugas `scopedStudents`) tapi demi pesan error
yang benar: ID sampah harus jadi galat validasi, bukan diam-diam menghapus 0
baris.

Untuk endpoint pratinjau, `password` **tidak** diwajibkan — dibuat Form Request
kedua `PreviewResetAttendanceRequest` yang `extends` dan membuang aturan
`password`. Kalau pratinjau juga meminta password, operator harus mengetik
password sebelum tahu berapa yang akan terhapus — urutannya terbalik.

### 4.3 Controller — method baru di `AttendanceMonitorController`

Menempel di controller yang sudah ada (halamannya sama), bukan controller baru:

```php
public function __construct(private readonly ResetStudentRecords $reset) {}

/** Pratinjau: berapa baris yang akan terhapus. Tidak mengubah apa pun. */
public function resetPreview(PreviewResetAttendanceRequest $request): JsonResponse
{
    return response()->json([
        'count' => $this->reset->count(
            $this->scopedStudents($request->user()),
            Attendance::class,
            $request->validated(),
        ),
    ]);
}

/** Hapus permanen data absen sesuai kriteria. */
public function reset(ResetAttendanceRequest $request): RedirectResponse
{
    $deleted = $this->reset->handle(
        $this->scopedStudents($request->user()),
        Attendance::class,
        $request->validated(),
    );

    return back()->with('success', "{$deleted} data absen berhasil direset.");
}
```

`resetPreview` mengembalikan **JSON**, bukan Inertia render — ini satu-satunya
pengecualian "no separate API" di `CLAUDE.md`, dan alasannya harus ditulis di
komentar: pratinjau dipanggil berkali-kali saat operator mengubah filter di
dalam modal yang sedang terbuka; `router.reload` akan menutup/merender ulang
halaman di belakang modal.

> **Alternatif yang lebih Inertia-ish, dipertimbangkan:** `router.reload({ only: ['resetPreview'], data: {...} })`
> dengan `resetPreview` sebagai prop halaman. Ini menghindari endpoint JSON,
> tapi memaksa `index()` menerima 7 query-param filter dan menghitung pratinjau
> di setiap muat halaman. **Pilih JSON** — lebih sedikit kode dan tidak
> membebani jalur baca normal. Catat pilihannya di komentar method.

### 4.4 Rute

```php
// Reset data absen — destruktif, admin saja, wajib password akun sendiri.
Route::middleware('role:admin')->group(function (): void {
    Route::post('monitoring/absen/reset/pratinjau', [AttendanceMonitorController::class, 'resetPreview'])
        ->name('attendance-monitor.reset-preview');
    Route::delete('monitoring/absen/reset', [AttendanceMonitorController::class, 'reset'])
        ->name('attendance-monitor.reset');
});
```

`POST` untuk pratinjau (kriteria bisa berisi array `student_ids`; terlalu
panjang untuk query string) dan `DELETE` untuk aksinya.

Rute ditaruh **di luar** grup `role:admin|kaprog|wakasek|guru|pembimbing|orangtua`
yang ada, di grup `role:admin` sendiri.

### 4.5 Frontend — `resources/js/components/attendance-monitor/reset-modal.tsx`

Komponen baru, dipanggil dari `pages/attendance-monitor/index.tsx` (dan di Fase
20 disalin-sesuaikan untuk jurnal — **bukan** dijadikan generik lebih dulu;
lihat catatan di Fase 20 §3.1).

Isi modal, dari atas ke bawah:

1. Kalimat AND (§3.3).
2. `Select` **Jurusan** (opsi dari prop `departemens` yang **sudah** ada di
   halaman — nol kueri tambahan).
3. `Select` **Kelas** — opsi ikut menyempit saat jurusan dipilih.
4. `Select` **Industri**.
5. Dua `<input type="date">` — Dari / Sampai.
6. Pemilih murid (opsional) — hanya muncul kalau jurusan **atau** kelas sudah
   dipilih; tanpa itu daftarnya bisa ribuan.
7. **Kotak pratinjau** — `N baris akan dihapus`, di-fetch ulang (debounce
   ~300ms) setiap kali kriteria berubah.
8. Input password (`type="password"`, `autoComplete="current-password"`).
9. Tombol **Reset** — `disabled` selama: pratinjau sedang dimuat, atau
   `count === 0`, atau password kosong, atau request sedang berjalan.

Gaya visual: **destruktif**. Tombol merah (token `bg-danger`/`text-danger` —
periksa token yang tersedia di `resources/css/app.css`; kalau belum ada token
merah, pakai `bg-warning` dan catat di `docs/UI-PATTERNS.md` bahwa token
destruktif perlu ditambahkan). Ikon `Trash2`. Judul modal: "Reset Data Absen".

Tombol pemicu di `pages/attendance-monitor/index.tsx`, di header seksi, **hanya
saat `can.reset`** (prop baru dari `index()`:
`'can' => ['reset' => $user->hasRole('admin')]`).

Kirim dengan `router.delete(resetUrl.url(), { data: {...} })` dari
`@inertiajs/react` — galat validasi (`password` salah) otomatis masuk ke objek
`errors` dan ditampilkan di bawah field password.

---

## 5. Berkas yang disentuh

**Baru (5):**

```
app/Actions/ResetStudentRecords.php
app/Http/Requests/ResetAttendanceRequest.php
app/Http/Requests/PreviewResetAttendanceRequest.php
resources/js/components/attendance-monitor/reset-modal.tsx
tests/Feature/ResetAttendanceTest.php
```

**Diubah (3):**

```
app/Http/Controllers/AttendanceMonitorController.php  (+konstruktor, +2 method, +prop can)
routes/web.php                                        (+2 rute)
resources/js/pages/attendance-monitor/index.tsx       (+tombol, +modal, +prop)
```

**Kemungkinan diubah (1):** `docs/UI-PATTERNS.md` — bagian tombol destruktif,
kalau token merah belum ada.

---

## 6. Test — `tests/Feature/ResetAttendanceTest.php`

**Minimal 8 test.** Fitur destruktif tidak boleh lolos dengan satu happy path.

| Test | Yang dijaga |
|---|---|
| `test_admin_can_reset_attendance_by_departemen` | happy path; absen jurusan lain **tetap ada** (assert positif, bukan cuma negatif) |
| `test_admin_can_reset_attendance_by_class` | sumbu kelas |
| `test_admin_can_reset_attendance_by_industry` | sumbu industri (lewat `students.industri_id`) |
| `test_admin_can_reset_attendance_by_date_range` | `from`/`to` inklusif; hari di luar rentang selamat |
| `test_admin_can_reset_attendance_for_selected_students_only` | `student_ids` |
| `test_reset_is_rejected_when_password_is_wrong` | 302 + error `password`, **dan `assertDatabaseCount('attendances', N)` tidak berubah** |
| `test_non_admin_cannot_reset_attendance` | guru/kaprog/siswa → 403 dari middleware |
| `test_reset_also_deletes_related_approvals` | **§3.5** — tidak ada `Approval` yatim dengan `approvable_type = Attendance::class` |
| `test_preview_count_matches_deleted_count` | pratinjau dan penghapusan memakai himpunan yang sama (§3.2) |

Test terakhir bentuknya: panggil `resetPreview` → simpan `count` → panggil
`reset` → `assertEquals($count, $deletedFromFlashOrDbDiff)`.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Approval yatim** (§3.5) | Inbox Persetujuan **fatal error** untuk pembimbing/guru | Hapus approval dalam transaksi yang sama + test khusus |
| Operator reset dengan filter kosong → semua absen sekolah hilang | **Katastrofik, tak bisa dibatalkan** | Pratinjau menampilkan angkanya sebelum tombol aktif; password; flash menyebut angka. **Tetap mungkin terjadi.** Backup DB terjadwal adalah mitigasi sebenarnya — catat di `docs/PROGRESS.md`. |
| Pratinjau ≠ penghapusan | Operator menyetujui angka yang salah | Satu builder kueri untuk `count()` & `handle()` (§3.2) + test |
| `students.user_id` null | Hasil `whereIn` tak terdefinisi | `whereNotNull('user_id')` (§3.4) |
| Penghapusan besar mengunci tabel / timeout | Request gagal separuh jalan | Ada dalam transaksi (atomik). Kalau volume produksi nyata > ~50k baris, ubah jadi `chunkById` **dan ukur dulu** — jangan optimalkan sebelum melihat angkanya. |
| Rate/streak/badge basi setelah reset | Angka dashboard menampilkan nilai lama | Semuanya dihitung on-the-fly dari `attendances` (`DashboardController::participation()`) — **tidak ada cache**, jadi aman. Verifikasi ulang saat implementasi. |

**Test lama yang harus tetap hijau:** seluruh test absen & approval —
`tests/Feature/AttendanceTest.php`, `ApprovalTest.php`,
`AttendanceMonitorTest.php`, `DashboardTest.php`.
