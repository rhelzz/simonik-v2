# Riset & Temuan — Bukti Kode per Masalah

Dokumen ini adalah dasar bukti untuk seluruh fase. Setiap klaim di sini
ditelusuri langsung ke berkas + baris, termasuk ke `vendor/` bila perilakunya
ditentukan oleh library. Tidak ada asumsi yang tidak diverifikasi.

---

## Temuan 1 — Impor Excel: sheet `Petunjuk` ikut diimpor

### Rantai sebab

1. Semua template impor adalah **workbook multi-sheet**.
   - Siswa: [`StudentsTemplateExport`](../../app/Exports/StudentsTemplateExport.php) →
     `StudentInstructionSheet` (judul `Petunjuk`), `StudentTemplateSheet`
     (judul `Data Siswa`), `StudentReferenceSheet` (judul `Referensi`).
   - Master data lain: [`GenericTemplateExport`](../../app/Exports/GenericTemplateExport.php) →
     `Petunjuk`, `<dataTitle>`, `Referensi` (opsional).

2. **Semua importer hanya single-sheet.** Tidak satu pun mengimplementasi
   `WithMultipleSheets`:

   ```
   app/Imports/ClassImport.php:18       implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/DepartemenImport.php:17  implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/IndustryImport.php:20    implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/KaprogImport.php:17      implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/ParentImport.php:17      implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/PembimbingImport.php:17  implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/StudentsImport.php:27    implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/TeacherImport.php:18     implements SkipsEmptyRows, ToCollection, WithHeadingRow
   app/Imports/WakasekImport.php:15     implements SkipsEmptyRows, ToCollection, WithHeadingRow
   ```

3. **Laravel Excel menyuapkan setiap sheet ke importer yang sama** bila
   importer bukan `WithMultipleSheets`. Bukti langsung di
   `vendor/maatwebsite/excel/src/Reader.php`:

   ```php
   // Reader::loadSpreadsheet(), baris ~258
   // When no multiple sheets, use the main import object
   // for each loaded sheet in the spreadsheet
   if (!$import instanceof WithMultipleSheets) {
       $this->sheetImports = array_fill(0, $this->spreadsheet->getSheetCount(), $import);
   }
   ```

   dan pada `Reader::getWorksheets()` (~baris 333):

   ```php
   } else {
       // Each worksheet the same import class.
       foreach ($worksheetNames as $name) {
           $worksheets[$name] = $import;
       }
   }
   ```

   Artinya `collection()` dipanggil **3×**: sekali untuk `Petunjuk`, sekali
   untuk sheet data, sekali untuk `Referensi`.

4. **Sheet `Petunjuk` punya bentuk yang mematikan.**
   [`GenericInstructionSheet::array()`](../../app/Exports/Sheets/GenericInstructionSheet.php)
   menghasilkan:

   | baris | isi |
   |-------|-----|
   | 1 | `PETUNJUK IMPOR SISWA` \| `` \| `` |
   | 2 | *(kosong)* |
   | 3 | `Kolom` \| `Wajib` \| `Cara mengisi` |
   | 4..n | penjelasan kolom |
   | n+1 | `CATATAN` \| `` \| … |

   `WithHeadingRow` memakai **baris 1** sebagai nama kolom → key yang
   dihasilkan adalah `petunjuk_impor_siswa`, bukan `nama`/`email`. Jadi
   `$row['nama']` selalu kosong pada seluruh baris sheet ini.

5. **Dampaknya berbeda per importer, dan yang terparah adalah siswa.**
   - Importer yang memakai trait [`ImportsRows`](../../app/Imports/Concerns/ImportsRows.php)
     (skip-duplikat): baris `Petunjuk` masuk ke `failed[]`. Data tetap
     tersimpan, tapi operator melihat banner merah panjang berisi galat palsu
     → terbaca sebagai "impor gagal".
   - [`StudentsImport`](../../app/Imports/StudentsImport.php) bersifat
     **all-or-nothing**:

     ```php
     // StudentsImport::collection(), ~baris 175
     if ($this->errors !== [] || $payloads === []) {
         return;   // tidak ada satu pun baris disimpan
     }
     ```

     Ditambah `StudentController::import()` melempar `ValidationException`
     bila `$import->errors` tidak kosong. Karena sheet `Petunjuk` **pasti**
     menghasilkan galat, impor siswa **mustahil berhasil** dengan template
     resmi. Ini persis gejala yang dilaporkan.

### Masalah turunan yang ditemukan sekalian

| Temuan | Berkas | Dampak |
|--------|--------|--------|
| **Baris contoh ikut terimpor.** `GenericDataSheet::array()` / `StudentTemplateSheet::array()` menaruh satu baris contoh ("Budi Santoso", `budi@contoh.sch.id`) di sheet data. Kalau operator hanya menambah baris di bawahnya, Budi Santoso ikut masuk DB. | `app/Exports/Sheets/*TemplateSheet.php`, `GenericDataSheet.php` | Data sampah di produksi |
| **Sheet `Referensi` juga diimpor**, menghasilkan galat palsu tambahan. | `GenericReferenceSheet` | Noise |
| **`StudentsImport` tidak memakai trait `ImportsRows`** — dua gaya impor berdampingan (all-or-nothing vs skip-duplikat), dua definisi `DEFAULT_PASSWORD`, dua implementasi `lookup()`/`gender()`/`date()` yang identik. | `StudentsImport.php` vs `Concerns/ImportsRows.php` | Duplikasi + perilaku tak konsisten antar modul |
| **Kolom `Periode` ada di template siswa tapi tidak dibaca importer.** | `StudentTemplateSheet::headings()` baris ke-16 | Operator mengisi kolom yang diabaikan diam-diam |
| **CSV tidak punya worksheet** (`Reader::getWorksheets()` mengembalikan `['Worksheet' => $import]`), jadi jalur CSV justru satu-satunya yang bekerja hari ini. | — | Menjelaskan kenapa sebagian orang "berhasil" pakai CSV |

→ **Rencana: [Fase 1](01-FASE-1-IMPOR-EXCEL.md)**

---

## Temuan 2 — Satu orang tidak bisa punya dua peran

### Rantai sebab

1. **Identitas = baris `users`.** Peran disimpan lewat `spatie/laravel-permission`
   (`HasRoles` di [`User`](../../app/Models/User.php)), yang **memang mendukung
   banyak peran per user**. Kapabilitasnya ada; alur aplikasinya yang tidak
   memakainya.

2. **Setiap modul membuat user baru, tanpa opsi memakai user yang ada.**

   ```
   app/Http/Controllers/KaprogController.php:107      $user->assignRole('kaprog');      ← didahului User::create()
   app/Http/Controllers/TeacherController.php:108     $user->assignRole('guru');        ← didahului User::create()
   app/Http/Controllers/PembimbingController.php:118  $user->assignRole('pembimbing');  ← didahului User::create()
   app/Http/Controllers/ParentController.php:116      $user->assignRole('orangtua');
   app/Http/Controllers/StudentController.php:127     $user->assignRole('siswa');
   app/Http/Controllers/WakasekController.php:90      $user->assignRole('wakasek');
   ```

3. **Email dikunci unik global** di setiap Form Request:

   ```php
   // StoreKaprogRequest.php:23 dan StoreTeacherRequest.php:24 — identik
   'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
   ```

   Konsekuensi langsung: seorang guru pembimbing yang juga kaprog **tidak bisa**
   didaftarkan di modul Kaprog dengan email aslinya — validasi menolak. Operator
   lalu mengarang email kedua (lihat Temuan 5 soal varian domain), dan orang itu
   kehilangan jejak kredensial mana yang aktif → "tidak bisa login".

4. **Menghapus kaprog menghapus akunnya sepenuhnya**, bukan mencabut perannya:

   ```php
   // KaprogController::destroy(), ~baris 165
   Departemen::query()->where('user_id', $kaprog->id)->update(['user_id' => null]);
   $kaprog->delete();     // ← baris users ikut hilang
   ```

   Ini menjelaskan kenapa "nama saya di kaprog dihapus, baru bisa login":
   akun duplikat yang membingungkan itu lenyap, menyisakan satu akun saja.

5. **Bug lanjutan yang belum terlihat tapi pasti muncul** begitu peran ganda
   diizinkan — urutan pengecekan dashboard:

   ```php
   // DashboardController::__invoke()
   if ($user->hasAnyRole(['guru', 'pembimbing'])) { return $this->staffDashboard($user); }
   if ($user->hasRole('wakasek'))                 { return $this->wakasekDashboard(); }
   if ($user->hasRole('kaprog'))                  { return $this->kaprogDashboard($user); }
   ```

   User `guru` + `kaprog` **selalu** mendarat di dashboard staf; menu kaprog
   tidak pernah terjangkau. Hal serupa berlaku pada
   [`HandleInertiaRequests::accountNotice()`](../../app/Http/Middleware/HandleInertiaRequests.php)
   yang mengecek `hasRole('guru')` lalu `hasRole('pembimbing')` secara
   berurutan — user dua peran bisa menerima banner yang salah.

6. **Route middleware sudah aman untuk multi-peran** (`role:admin|kaprog|guru`
   bersifat OR), jadi tidak ada perubahan yang dibutuhkan di `routes/web.php`.
   Ini penting: perbaikan bisa dilakukan tanpa menyentuh peta rute.

### Yang **bukan** penyebabnya (sudah dieliminasi)

- `LoginRequest::authenticate()` polos `Auth::attempt(email, password)` — tidak
  ada filter peran, tidak ada penolakan multi-peran di sini.
- Tidak ada `syncRoles()` di mana pun (`grep -rn "syncRoles" app/` → nol hasil),
  jadi peran lama **tidak** terhapus saat peran baru diberikan.

→ **Rencana: [Fase 2](02-FASE-2-AKUN-MULTI-PERAN.md)**

---

## Temuan 3 & 4 — Tabel Data Siswa

- Tidak ada endpoint hapus massal. Yang ada hanya
  `Route::resource('students', StudentController::class)` (`routes/web.php:137`)
  → `destroy(Request, Student)` satuan.
- `StudentController::destroy()` menghapus **user**-nya, dan baris `students`
  ikut terhapus lewat FK cascade. Pola ini harus dipertahankan persis pada
  versi massal, termasuk `deleteImage()` agar tidak meninggalkan file yatim.
- Ada otorisasi per-siswa: `$this->authorizeStudent($request, $student)`
  (trait `ScopesStudentsByRole`). Hapus massal **wajib** melewati gerbang yang
  sama untuk setiap id — kalau tidak, kaprog bisa menghapus siswa di luar
  jurusannya.
- Padding kolom: `resources/js/pages/students/index.tsx` — seluruh `<th>`/`<td>`
  hanya memakai `pb-3`/`py-3`, tanpa padding horizontal. Hanya kolom pertama
  (`pl-2`) dan terakhir (`pr-2`) yang punya. Tabel `min-w-160` → pada layar
  sempit kolom Kelas/Industri/Status saling menempel.
- Tidak ada pola select/select-all yang bisa dipakai ulang di codebase
  (`grep -ril "checkbox\|bulk"` di `resources/js/pages` hanya menemukan
  `activities`, `login`, `journal-monitor` — tidak relevan).

→ **Rencana: [Fase 3](03-FASE-3-TABEL-SISWA.md)**

---

## Temuan 5 — Domain email tidak seragam

Tidak ada satu tempat pun yang mendefinisikan konvensi email. Yang ada di
codebase hari ini:

| Sumber | Domain |
|--------|--------|
| `database/seeders/AdminSeeder.php:21`, `StarterSeeder.php:44,56,68,80,92` | `@simonik.local` |
| `database/seeders/DemoUserSeeder.php:20`, `DemoDataSeeder.php:41` | `@simonik.test` |
| `app/Exports/Sheets/StudentTemplateSheet.php` (baris contoh) | `budi@contoh.sch.id` |
| Input operator di form create | bebas apa saja |

Validasi hanya `['required','email','max:255', Rule::unique(...)]` — tidak ada
batasan domain. `app/Support/ImportDefaults.php` sudah menjadi tempat yang
tepat untuk konstanta bersama (sudah memegang `PASSWORD`), tapi belum memegang
domain.

→ **Rencana: [Fase 4](04-FASE-4-EMAIL-DOMAIN.md)**

---

## Temuan 6 — Relasi Pembimbing ↔ Industri dimiliki sisi Industri

Skema aktual (dibaca lewat `Schema::getColumnListing`):

```
industries : id, name, bidang, alamat, longitude, latitude, radius,
             jam_masuk, jam_pulang, duration, pembimbing_id, teacher_id,
             kuota, created_at, updated_at
pembimbings: id, user_id, name, no_hp, gender, created_at, updated_at
```

Jadi **FK-nya ada di `industries.pembimbing_id`**, dan `Pembimbing::industry()`
adalah `hasOne` terbalik. `PembimbingController::index()` sudah menampilkan
kolom `industry` (`->with('industry:id,name,pembimbing_id')`), tapi
`create`/`edit`/`store`/`update` **tidak punya field-nya sama sekali** —
penugasan hanya bisa dilakukan dari modul Industri.

Implikasi penting: satu industri hanya menampung **satu** pembimbing
(kolom tunggal, bukan pivot). Menugaskan pembimbing B ke industri X yang sudah
dipegang A **akan menggeser A keluar**. UI harus menyatakan ini secara eksplisit.

Pola yang sudah ada untuk kasus identik ("relasi dimiliki sisi lain, di-set
dari form ini"): `KaprogController::syncDepartemens()` +
`departemenOptions()` yang menandai jurusan yang sudah dipegang kaprog lain.
**Fase 5 menyalin pola itu, bukan menciptakan pola baru.**

→ **Rencana: [Fase 5](05-FASE-5-INDUSTRI-DI-PEMBIMBING.md)**

---

## Rujukan eksternal yang dipakai

- **Laravel Excel — multi-sheet import.** Perilaku "satu importer untuk semua
  sheet" dan kontrak `WithMultipleSheets` / `SkipsUnknownSheets` diverifikasi
  langsung pada `vendor/maatwebsite/excel/src/Reader.php` yang terpasang di
  repo ini (lebih akurat daripada dokumentasi versi lain). Praktik baku pada
  template "petunjuk + data + referensi" memang mengharuskan importer memilih
  sheet secara eksplisit berdasarkan nama.
- **Spatie laravel-permission — many-to-many role.** Tabel `model_has_roles`
  memang dirancang untuk banyak peran per model; `assignRole()` bersifat
  aditif dan `removeRole()` mencabut satu peran tanpa menyentuh yang lain.
  Ini yang membuat Fase 2 tidak butuh migrasi skema apa pun.
- **Pola SIS/LMS sejenis (PowerSchool, Moodle, SIMPKL sekolah).** Dua konvensi
  yang konsisten dipakai di sistem sekolah dan kita adopsi:
  1. **Satu identitas (akun) — banyak jabatan.** Guru yang merangkap wali
     kelas/kaprog tetap satu login. Menduplikasi akun per jabatan adalah
     antipattern yang dikenal menyebabkan persis keluhan #2.
  2. **Hapus massal selalu bertahap:** pilih → konfirmasi dengan menyebut
     jumlah → laporkan hasil per item. Tidak ada "hapus semua" satu klik
     tanpa konfirmasi berjumlah.
