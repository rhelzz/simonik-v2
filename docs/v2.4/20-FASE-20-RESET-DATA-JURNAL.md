# Fase 20 — Reset Data Jurnal

**Status:** 📝 Rencana · **Prioritas:** P1 · **Risiko regresi:** **TINGGI (destruktif)** ·
**Migrasi:** tidak · **Ketergantungan:** **Fase 19 wajib selesai lebih dulu** ·
**Perkiraan:** ~1-2 jam (setelah Fase 19)

## 1. Permintaan

> "Fitur Reset Data Jurnal … berada di Modul masing-masing menu. Pas di bagian
> page https://simonik.pro/monitoring/jurnal … reset berdasarkan: 1. Jurusan
> 2. Kelas 3. Industri. Setelah memilih kategori di atas baru minta masukin
> password"

## 2. Kondisi sekarang

`JournalMonitorController` adalah **cerminan persis**
`AttendanceMonitorController` — docblock-nya sendiri menyatakannya:

> *"Pola identik dengan AttendanceMonitorController."*
> — `app/Http/Controllers/JournalMonitorController.php:20`

Struktur data yang dihapus juga sejajar: `activities` punya `user_id` + `date`,
sama seperti `attendances` (`app/Models/Activity.php`).

**Perbedaan yang relevan:**

| | `attendances` | `activities` |
|---|---|---|
| `user_id` + `date` | ✅ | ✅ |
| Relasi `morphOne(Approval)` | ✅ (harus ikut dihapus) | ❌ **tidak ada** — periksa ulang saat implementasi |
| Berkas terunggah | `image`, `departure_image` | `image` |

**Relasi industri:** `activities` tidak punya kolom industri. Filternya tetap
jalan karena penyaringan terjadi di sisi **siswa** (`students.industri_id`),
bukan di baris jurnal — persis mekanisme Fase 19 §3.4. Tidak ada kode tambahan
untuk ini.

## 3. Keputusan implementasi

### 3.1 Action dipakai ulang apa adanya; modal **disalin**, bukan digeneralisasi

`ResetStudentRecords` (Fase 19 §3.2) sudah menerima `class-string<Model>`.
Fase ini memanggilnya dengan `Activity::class`. **Nol baris backend baru di
action.**

Untuk frontend: `reset-modal.tsx` **disalin** ke
`components/journal-monitor/reset-modal.tsx` dengan label & endpoint diganti,
**bukan** diangkat jadi komponen generik `<ResetModal entity="…">`.

Alasan: komponen generik akan menerima ≥6 prop (judul, endpoint pratinjau,
endpoint hapus, kata benda, daftar opsi, label sukses) demi menghemat ~120 baris
JSX yang tidak punya logika. Prop-drilling sebanyak itu lebih sulit dibaca
daripada dua berkas yang jelas. Dua salinan yang jujur mengalahkan satu
abstraksi berparameter enam.

```
// ponytail: modal reset jurnal adalah salinan modal absen dengan label &
// endpoint berbeda. Angkat jadi komponen bersama kalau modul ketiga butuh
// reset yang sama — dua salinan belum cukup alasan.
```

**Kalau ternyata muncul modul reset ketiga**, barulah keduanya digabung. Aturan
"≥2 tempat" (README §2.1) berlaku untuk *logika*; ini murni presentasi.

### 3.2 Berkas terunggah tidak ikut dihapus dari disk

`activities.image` (dan `attendances.image` di Fase 19) menunjuk berkas di
`storage/app/public/`. Reset menghapus **baris**, tidak menyentuh berkasnya.

Konsekuensi: berkas yatim menumpuk di disk. **Diterima**, karena:

- Menghapus berkas dalam transaksi DB adalah aksi yang **tidak bisa di-rollback**
  — kalau transaksi gagal setelah `Storage::delete()`, barisnya kembali tapi
  fotonya hilang selamanya. Itu lebih buruk daripada disk terbuang.
- Volume kecil (foto jurnal, sekali per semester).

```php
// ponytail: berkas di storage sengaja tidak ikut dihapus — Storage::delete()
// tidak bisa di-rollback bersama transaksi DB. Tambahkan perintah artisan
// pembersih berkas yatim kalau disk jadi masalah nyata.
```

Dicatat juga sebagai catatan yang sama di Fase 19.

### 3.3 Password & cakupan: identik Fase 19

`current_password`, `role:admin`, `scopedStudents()`. Tidak ada keputusan baru.

### 3.4 Badge **tidak** dicabut saat reset jurnal; streak ikut ter-reset sendirinya

Dua hal yang terlihat mirip tapi berperilaku berbeda:

| | Sumber | Nasib setelah reset |
|---|---|---|
| **Streak** (🔥 hari berturut-turut) | dihitung on-the-fly dari `activities` oleh `StreakCalculator` | **ikut ter-reset otomatis** — nol kode |
| **Badge** (7 lencana, `BadgeSeeder`) | baris tersimpan di pivot `student_badge` (`awarded_at`) | **tetap menempel** |

Badge yang ada: `streak_7` 🔥, `streak_30` 💎, `journal_10` 📝, `journal_50` ✍️,
`journal_100` 🏆, `attendance_5` ✅, `attendance_20` ⭐ — tiga aturan
(`Badge::RULE_STREAK_JOURNAL`, `RULE_TOTAL_JOURNAL`, `RULE_TOTAL_ATTENDANCE`).

**Keputusan: badge tidak dicabut.** Alasannya:

1. **`BadgeAwarder` idempotent dan hanya bisa menambah** (`checkAndAward()`
   me-`reject` badge yang sudah diraih, lalu `attach`). Tidak ada jalur pencabutan
   di seluruh aplikasi. Menambahkannya berarti membuat mekanisme baru — untuk
   sebuah efek samping dari fitur yang dipakai sekali per semester.
2. **Reset adalah operasi administratif, bukan pernyataan bahwa siswa tidak
   pernah bekerja.** Umumnya jurnal di-reset karena pergantian periode PKL atau
   salah impor — mencabut penghargaan yang sudah diraih siswa atas kejadian
   administratif itu tidak adil.
3. Badge `attendance_*` bergantung pada `attendances`, bukan `activities` —
   mencabut badge saat reset jurnal berarti harus memutuskan juga apa yang
   terjadi saat reset absen (Fase 19). Satu keputusan berubah jadi dua.

**Konsekuensi yang harus disampaikan ke operator, bukan disembunyikan:** siswa
bisa memegang 🏆 "Master Jurnal" (100 jurnal) sementara jurnalnya sekarang nol.

```php
// ponytail: badge sengaja tidak dicabut saat reset — BadgeAwarder hanya bisa
// menambah (idempotent, tanpa jalur pencabutan), dan reset adalah operasi
// administratif. Kalau badge basi jadi masalah nyata, tambahkan
// `php artisan badge:recalculate` yang menghitung ulang seluruh pivot dari
// data — lebih benar daripada menyisipkan pencabutan ke dalam alur reset.
```

Jalur upgrade di komentar itu sengaja **bukan** "hapus badge saat reset":
perintah rekalkulasi menyelesaikan seluruh kelas masalah (badge basi karena
sebab apa pun, termasuk penghapusan jurnal satuan oleh siswa), sementara
menyisipkan pencabutan ke dalam reset hanya menambal satu jalur.

### 3.5 Yang ikut hilang & yang tidak — ringkasan untuk operator

| | Setelah reset jurnal |
|---|---|
| Baris `activities` | **hilang permanen** |
| Streak 🔥 | kembali 0 (dihitung ulang dari data) |
| Badge yang sudah diraih | **tetap** (§3.4) |
| Berkas foto jurnal di disk | tetap ada, tidak terpakai (§3.2) |
| Data absen | **tidak tersentuh** — dijaga test §6 |

Tabel ini disalin ke teks pratinjau di dalam modal reset (Fase 19 §4.5),
sehingga operator membacanya **sebelum** menekan tombol, bukan sesudah.

---

## 4. Rencana implementasi

### 4.1 Form Request

`ResetJournalRequest` + `PreviewResetJournalRequest` — **`extends`
`ResetAttendanceRequest`** tanpa perubahan aturan (aturannya identik; yang beda
hanya nama). Kalau saat implementasi ternyata tidak ada aturan yang berbeda
sama sekali, **pakai langsung `ResetAttendanceRequest`** dan ganti namanya jadi
`ResetStudentRecordsRequest` di Fase 19 — jangan buat dua kelas kembar.

> Keputusan ini sengaja digantung sampai Fase 19 selesai: kalau ternyata jurnal
> butuh aturan berbeda (mis. tanpa sumbu industri), dua kelas jadi benar.
> Putuskan saat melihat kodenya, bukan sekarang.

### 4.2 Controller — 2 method di `JournalMonitorController`

Salinan §4.3 Fase 19 dengan `Attendance::class` → `Activity::class` dan pesan
flash `"{$deleted} data jurnal berhasil direset."`.

### 4.3 Rute

```php
Route::middleware('role:admin')->group(function (): void {
    Route::post('monitoring/jurnal/reset/pratinjau', [JournalMonitorController::class, 'resetPreview'])
        ->name('journal-monitor.reset-preview');
    Route::delete('monitoring/jurnal/reset', [JournalMonitorController::class, 'reset'])
        ->name('journal-monitor.reset');
});
```

Digabung dalam grup `role:admin` yang sama dengan Fase 19 — satu grup, empat
rute.

### 4.4 Frontend

- `resources/js/components/journal-monitor/reset-modal.tsx` (salinan, §3.1)
- `resources/js/pages/journal-monitor/index.tsx` — tombol + modal + prop `can.reset`

---

## 5. Berkas yang disentuh

**Baru (3-4):**

```
app/Http/Requests/ResetJournalRequest.php            (mungkin tidak perlu — §4.1)
app/Http/Requests/PreviewResetJournalRequest.php     (mungkin tidak perlu — §4.1)
resources/js/components/journal-monitor/reset-modal.tsx
tests/Feature/ResetJournalTest.php
```

**Diubah (3):**

```
app/Http/Controllers/JournalMonitorController.php
routes/web.php
resources/js/pages/journal-monitor/index.tsx
```

---

## 6. Test — `tests/Feature/ResetJournalTest.php`

**Minimal 5** (lebih sedikit dari Fase 19 karena action-nya sudah diuji di sana;
yang diuji di sini adalah **penyambungannya**):

| Test | Yang dijaga |
|---|---|
| `test_admin_can_reset_journal_by_class` | happy path; jurnal kelas lain selamat |
| `test_admin_can_reset_journal_by_industry` | filter lewat `students.industri_id` |
| `test_reset_journal_is_rejected_when_password_is_wrong` | `assertDatabaseCount('activities', N)` tidak berubah |
| `test_non_admin_cannot_reset_journal` | 403 |
| `test_reset_journal_does_not_touch_attendances` | **inti fase ini** — salah menulis `Attendance::class` di controller jurnal adalah kesalahan salin-tempel yang paling mungkin terjadi, dan paling mahal |

Test terakhir bukan paranoia: Fase 20 secara harfiah adalah menyalin Fase 19,
dan satu `class-string` yang lupa diganti akan menghapus modul yang salah tanpa
gejala apa pun sampai ada yang membuka Data Absen.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Salah salin `Attendance::class` di controller jurnal | Reset jurnal menghapus **absen** | Test `test_reset_journal_does_not_touch_attendances` |
| `activities` ternyata punya relasi yang perlu dibersihkan | Baris yatim | **Periksa `app/Models/Activity.php` saat implementasi**, jangan percaya §2 dokumen ini |
| Reset jurnal membuat badge tidak sinkron dengan data | Badge 🏆 "Master Jurnal" menempel pada siswa dengan 0 jurnal | Lihat §3.4 — badge **tidak** dicabut (keputusan bawaan), konsekuensinya dijelaskan ke operator |

**Test lama yang harus tetap hijau:** `ActivityTest.php`,
`JournalMonitorTest.php`, `StreakCalculatorTest.php`, `BadgeAwarderTest.php`,
`DashboardTest.php`.
