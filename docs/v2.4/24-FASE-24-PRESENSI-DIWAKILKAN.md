# Fase 24 — Presensi diwakilkan oleh guru pembimbing / admin

**Status:** 📝 Rencana · **Prioritas:** P1 · **Risiko regresi:** sedang ·
**Migrasi:** tidak · **Ketergantungan:** Fase 23 · **Perkiraan:** ~3-4 jam

## 1. Permintaan (dua butir identik)

> **Admin #5 / Guru #3:** "buatkan button presensi. Tujuannya button fitur
> presensi yang dilakukan oleh guru pembimbing ini untuk presensi yang
> diwakilkan oleh guru pembimbing. Proses ini hanya memilih murid yang akan
> dipresensikan kemudian input waktu secara custom. **Tidak perlu ada fitur
> geolokasi dan foto.**"

Tiga batasan eksplisit: (a) pilih murid, (b) waktu custom, (c) **tanpa geo &
foto**.

---

## 2. Kondisi sekarang

### 2.1 Satu-satunya jalan membuat absen "hadir" adalah `AttendanceController::checkIn()`

`app/Http/Controllers/AttendanceController.php:52-140` — dan jalan itu penuh
dengan hal yang **tidak boleh** dilewati presensi diwakilkan:

| Baris | Mekanisme | Nasib di fase ini |
|---|---|---|
| ~67 | Tolak jika akurasi GPS > 100m (WFO) | ❌ tidak ada GPS |
| ~85 | Geofencing radius industri | ❌ |
| ~72, ~86 | `is_suspect` dari akurasi GPS | ❌ |
| ~113 | Heuristik "lompatan tak wajar" > 100km | ❌ |
| ~128 | `$request->file('image')->store(...)` — **wajib** | ❌ tidak ada foto |
| ~102 | `is_late` dari `industries.jam_masuk` | ✅ **tetap dipakai** (§3.4) |
| ~56 | Guard "sudah absen hari ini" | ✅ **tetap dipakai** (§3.3) |
| — | `BadgeAwarder` | ⚠️ lihat §3.6 |

Rutenya `role:siswa` (`routes/web.php:230-235`) — guru bahkan tidak bisa
memanggilnya.

**Kesimpulan: `checkIn()` tidak bisa dipakai ulang, dan tidak boleh dilonggarkan
agar bisa dipakai ulang.** Melonggarkannya berarti setiap pengaman anti-titip-absen
di jalur siswa jadi opsional — persis lubang yang seluruh modul absen dibangun
untuk menutup.

### 2.2 Preseden yang benar sudah ada: `ApproveRequest::handle()`

`app/Actions/ApproveRequest.php:34-46` sudah membuat baris absen **tanpa foto,
tanpa GPS**, atas nama orang lain:

```php
Attendance::updateOrCreate(
    ['user_id' => $leaveRequest->user_id, 'date' => $leaveRequest->date->format('Y-m-d')],
    [
        'status' => 'libur',
        'absenceReason' => $leaveRequest->reason,
        'description' => 'Libur disetujui oleh '.$approver->name.' ('.$approver->getRoleNames()->first().')',
    ]
);
```

**Fase ini mengikuti pola itu persis**, termasuk kebiasaan menuliskan jejak
"oleh siapa" ke kolom `description`. Ini bukan pola baru — ini pola yang sudah
dipakai dua kali di `ApproveRequest`.

### 2.3 Kolom `mode` sudah ada

`attendances.mode` (`2026_06_30_142650_add_smart_attendance_columns_…`), nilai
sekarang: `wfo` / `wfa`. String bebas, nullable — menambah nilai ketiga
**tidak** butuh migrasi.

---

## 3. Keputusan implementasi

### 3.1 `mode = 'proxy'` — presensi diwakilkan harus bisa dibedakan selamanya

Baris absen tanpa foto dan tanpa GPS yang terlihat identik dengan absen mandiri
adalah kebohongan data. Enam bulan lagi tidak akan ada yang bisa menjawab
"kenapa absen ini tidak ada fotonya?".

```php
'mode' => 'proxy',
'description' => 'Presensi diwakilkan oleh '.$user->name.' ('.$user->getRoleNames()->first().')',
```

Konsekuensi yang harus diperiksa: cari semua tempat yang membaca `mode`.

```bash
grep -rn "'mode'\|\.mode\b" app/ resources/js/
```

Kalau ada `match ($mode) { 'wfo' => …, 'wfa' => … }` tanpa `default`, nilai
ketiga akan meledak di sana. **Periksa sebelum menulis, bukan sesudah.**

Di UI riwayat absen (siswa & monitoring), tampilkan lencana **"Diwakilkan"**
untuk `mode === 'proxy'`. Siswa berhak tahu ada absen atas namanya yang tidak
ia buat.

### 3.2 Endpoint & wewenang: `role:admin|guru`

Permintaan menyebut guru pembimbing dan menempatkan tombolnya di halaman admin
— keduanya. Kaprog/wakasek/pembimbing industri **tidak** disertakan: tidak
diminta, dan ini kemampuan menulis data absen atas nama orang lain.

Cakupan siswa tetap `scopedStudents()` (README §2.2) — inilah yang membuat guru
hanya bisa mempresensikan bimbingannya sendiri, tanpa satu pun cek role baru.

```php
// ponytail: dibatasi admin & guru sesuai permintaan. Kaprog/pembimbing
// industri bisa ditambahkan dengan mengubah satu string middleware — jangan
// dibuka sebelum diminta.
```

### 3.3 **Tidak** menimpa absen yang sudah ada — `create`, bukan `updateOrCreate`

Ini perbedaan paling penting dari preseden `ApproveRequest` (§2.2), dan harus
disengaja.

`ApproveRequest` memakai `updateOrCreate` karena approval **memang** berwenang
mengubah status (izin yang disetujui menggantikan "hadir"). Presensi diwakilkan
tidak punya wewenang itu: menimpa berarti seorang guru bisa menghapus bukti foto
+ GPS absen mandiri siswa, atau membatalkan status "sakit" yang sudah lolos dua
tahap approval (Ortu + Industri).

```php
$existing = Attendance::query()
    ->where('user_id', $student->user_id)
    ->whereDate('date', $date)
    ->exists();

if ($existing) {
    // dilewati, bukan ditimpa — lihat §3.5 soal pelaporannya
}
```

Praktisnya guard ini jarang terpicu, karena daftar yang ditawarkan di modal
**hanya berisi siswa "belum presensi"** (Fase 23 §3.1). Tapi ada jeda waktu
antara modal dibuka dan tombol ditekan — dan di jeda itu siswa bisa absen
sendiri. Guard-nya di **server**, bukan di daftar UI.

### 3.4 Waktu custom = `arrivalTime`; `is_late` tetap dihitung dari waktu itu

Permintaan: *"input waktu secara custom"* → satu `<input type="time">` →
`attendances.arrivalTime`.

`is_late` **tetap dihitung** dengan membandingkan waktu yang diketik terhadap
`industries.jam_masuk` — logika yang sama persis dengan `checkIn()` baris ~102.
Kalau `is_late` dibiarkan `false`, presensi diwakilkan jadi jalan pintas
menghapus keterlambatan, dan rekap kedisiplinan kehilangan artinya.

`departureTime` **tidak** disertakan. Tidak diminta, dan menambah field kedua ke
modal untuk hal yang bisa diisi belakangan lewat jalur normal adalah penambahan
tanpa permintaan.

Tanggal: mengikuti tanggal yang sedang aktif di panel Fase 23 (default hari
ini), dikirim eksplisit sebagai `date` — supaya guru bisa menyusul presensi
kemarin, yang justru kasus pemakaian utamanya.

### 3.5 Massal, dan **melaporkan yang dilewati**

`student_ids: int[]` — satu request, banyak murid. Memaksa satu-per-satu untuk
kasus "seluruh kelas lupa absen" adalah 30 klik.

Flash harus jujur:

```
"12 murid berhasil dipresensikan. 2 dilewati karena sudah punya data absen."
```

Bukan "berhasil". Kalau 2 murid dilewati diam-diam, guru akan mengira semuanya
beres — dan baru tahu sebulan kemudian saat rekap tidak cocok.

Semua dalam satu `DB::transaction`.

### 3.6 `BadgeAwarder` **tidak** dipanggil

`AttendanceController` menyuntik `BadgeAwarder` dan memanggilnya setelah
`checkIn()` berhasil. Presensi diwakilkan **tidak** memanggilnya.

Alasan: badge adalah penghargaan atas perilaku siswa. Absen yang dibuatkan guru
bukan perilaku siswa. Memberi badge untuk itu mendevaluasi seluruh sistem
gamifikasi — dan membuka jalan "minta guru presensikan saya biar streak-nya
aman".

```php
// ponytail: BadgeAwarder sengaja tidak dipanggil — badge adalah penghargaan
// atas perilaku siswa, sedangkan baris ini dibuat oleh guru. Panggil kalau
// sekolah memutuskan sebaliknya.
```

**Efek samping yang harus disadari:** streak jurnal/absen siswa akan
memperhitungkan baris ini kalau `StreakCalculator` membaca `attendances` secara
langsung (tanpa memfilter `mode`). **Periksa `app/Services/` saat implementasi**
dan putuskan sadar-sadar; catat keputusannya di sini. Jangan biarkan jadi
kejutan.

### 3.7 UI: menempel pada tabel Fase 23, bukan tombol berdiri sendiri

Tombol "Presensikan" muncul di header panel Fase 23, **aktif hanya saat tab
"Belum"** dan minimal satu murid tercentang. Modal berisi: daftar terpilih
(bisa dicoret), satu `<input type="time">`, tanggal (baca-saja, dari filter
panel), dan tombol simpan.

Karena daftar sumbernya adalah tab "Belum", secara alami tidak mungkin memilih
murid yang sudah absen — §3.3 tinggal jadi jaring pengaman server.

Ini alasan Fase 23 harus lebih dulu: tanpa daftar "belum presensi", fitur ini
butuh pemilih murid sendiri dari nol.

---

## 4. Rencana implementasi

### 4.1 Form Request — `app/Http/Requests/StoreProxyAttendanceRequest.php`

```php
public function rules(): array
{
    return [
        'student_ids' => ['required', 'array', 'min:1'],
        'student_ids.*' => ['integer', 'exists:students,id'],
        'date' => ['required', 'date'],
        'arrival_time' => ['required', 'date_format:H:i'],
    ];
}
```

`date_format:H:i` cocok dengan `<input type="time">`. Konversi ke `H:i:s` saat
menyimpan (kolomnya `string`, dan `checkIn()` menyimpan `H:i:s`) — konsistensi
format penting agar `AttendanceMonitorController::present()` (`mb_substr(…, 0, 5)`)
tetap benar.

Tidak ada aturan `before_or_equal:today` pada `date`: sekolah kadang
memasukkan jadwal, dan melarangnya butuh penjelasan ke operator tanpa manfaat
yang jelas.

### 4.2 Controller — method di `AttendanceMonitorController`

Menempel di controller halaman itu (bukan `AttendanceController`, yang seluruh
rutenya `role:siswa`):

```php
public function storeProxy(StoreProxyAttendanceRequest $request): RedirectResponse
{
    /** @var User $user */
    $user = $request->user();
    $data = $request->validated();
    $date = Carbon::parse($data['date'])->startOfDay();

    // Cakupan role: siswa di luar bimbingan pemanggil tidak akan terambil
    // di sini, sehingga ID sembarang dari devtools menghasilkan 0 baris.
    $students = $this->scopedStudents($user)
        ->whereIn('id', $data['student_ids'])
        ->whereNotNull('user_id')
        ->with('industries:id,jam_masuk')
        ->get();

    [$created, $skipped] = DB::transaction(function () use ($students, $date, $data, $user): array {
        // …§3.3 guard exists, §3.4 is_late, Attendance::create…
    });

    return back()->with('success', $skipped === 0
        ? "{$created} murid berhasil dipresensikan."
        : "{$created} murid berhasil dipresensikan. {$skipped} dilewati karena sudah punya data absen.");
}
```

Baris yang dibuat:

```php
Attendance::create([
    'user_id' => $student->user_id,
    'date' => $date,
    'arrivalTime' => $arrival,          // 'H:i:s'
    'status' => 'hadir',
    'mode' => 'proxy',
    'is_late' => $isLate,
    'is_suspect' => false,
    'description' => 'Presensi diwakilkan oleh '.$user->name.' ('.$user->getRoleNames()->first().')',
]);
```

`image`, `latitude`, `longitude`, `gps_accuracy`, `distance_m` dibiarkan `null`
— semuanya nullable di skema. **Jangan** mengisi koordinat industri sebagai
"perkiraan": itu memalsukan bukti lokasi.

### 4.3 Rute

```php
Route::post('monitoring/absen/presensi', [AttendanceMonitorController::class, 'storeProxy'])
    ->middleware('role:admin|guru')
    ->name('attendance-monitor.store-proxy');
```

### 4.4 Frontend

- `resources/js/components/attendance-monitor/proxy-attendance-modal.tsx` (baru)
- `daily-roster.tsx` (Fase 23) — tambah kolom checkbox + state pilihan + tombol
- `pages/attendance-monitor/index.tsx` — prop `can.proxyAttendance`

Kirim lewat `<Form>` / `useForm` dari `@inertiajs/react` (`CLAUDE.md`) supaya
CSRF, `errors`, dan `processing` ditangani otomatis. Setelah sukses, panel
Fase 23 ter-refresh sendiri (redirect `back()`), dan murid tadi pindah ke tab
"Sudah" — umpan balik yang langsung terlihat.

---

## 5. Berkas yang disentuh

**Baru (3):**

```
app/Http/Requests/StoreProxyAttendanceRequest.php
resources/js/components/attendance-monitor/proxy-attendance-modal.tsx
tests/Feature/ProxyAttendanceTest.php
```

**Diubah (4):**

```
app/Http/Controllers/AttendanceMonitorController.php
routes/web.php
resources/js/components/attendance-monitor/daily-roster.tsx
resources/js/pages/attendance-monitor/index.tsx
```

Kemungkinan: berkas UI yang menampilkan `mode` (lencana "Diwakilkan", §3.1).

---

## 6. Test — `tests/Feature/ProxyAttendanceTest.php`

| Test | Yang dijaga |
|---|---|
| `test_guru_can_proxy_attendance_for_own_students` | happy path: baris dibuat, `mode = 'proxy'`, `arrivalTime` sesuai input |
| `test_proxy_attendance_cannot_target_students_outside_scope` | **keamanan** — guru B kirim ID siswa guru A → 0 baris dibuat, respons tidak bocor |
| `test_proxy_attendance_skips_students_who_already_have_a_record` | **§3.3** — baris lama **tidak berubah** (assert `image`/`latitude` lama masih utuh) |
| `test_proxy_attendance_marks_late_when_after_jam_masuk` | §3.4 — `is_late = true` |
| `test_proxy_attendance_leaves_photo_and_gps_null` | §4.2 — tidak ada pemalsuan bukti |
| `test_siswa_cannot_call_proxy_attendance` | 403 |
| `test_proxy_attendance_does_not_award_badges` | §3.6 |

Test ketiga adalah yang paling penting: kalau seseorang "menyederhanakan"
`create` jadi `updateOrCreate` di kemudian hari, test inilah yang gagal —
bukan pengguna yang kehilangan bukti absennya.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Menimpa absen mandiri (foto+GPS hilang) | **Kehilangan data permanen** | `create` + guard `exists` (§3.3) + test |
| Menimpa status sakit/izin ber-approval | Alur approval jadi sia-sia | Guard yang sama; daftar sumber hanya "belum presensi" (Fase 23 §3.1) |
| `mode = 'proxy'` meledak di `match` tanpa default | Fatal error di halaman lain | `grep` semua pembaca `mode` **sebelum** implementasi (§3.1) |
| Disalahgunakan (guru presensikan seluruh kelas tiap pagi) | Data absen kehilangan makna | `mode = 'proxy'` + `description` membuatnya terlihat & terhitung. Statistik "berapa % absen diwakilkan" bisa dibuat kapan saja — **jangan dibuat sekarang** (tidak diminta). |
| Streak/badge terpengaruh diam-diam | Gamifikasi rusak | §3.6 — periksa `app/Services/` dan putuskan sadar |
| Format waktu `H:i` vs `H:i:s` tak konsisten | Jam tampil salah / kosong | Simpan `H:i:s` seperti `checkIn()`; test meng-assert nilai tersimpan |

**Test lama yang harus tetap hijau:** `AttendanceTest.php`,
`AttendanceMonitorTest.php`, `BadgeAwarderTest.php`, `StreakCalculatorTest.php`,
`ApproveRequestTest.php`.
