# Fase 1 — Memperbaiki Impor Excel (Masalah UAT #1)

**Status:** belum dikerjakan · **Prioritas:** P0 (memblokir onboarding data) ·
**Risiko regresi:** rendah · **Perkiraan:** ~3 jam

---

## 1. Masalah

> "Proses input data menggunakan fitur Export/Import masih belum berhasil.
> Saya sudah coba upload pakai file template juga tetap gagal."

## 2. Akar masalah

Template yang kita bagikan adalah workbook **3 sheet**, sementara importer
dibangun untuk **1 sheet**. Laravel Excel, bila importer tidak
mengimplementasi `WithMultipleSheets`, menjalankan `collection()` untuk
**setiap** sheet dalam workbook:

```php
// vendor/maatwebsite/excel/src/Reader.php
if (!$import instanceof WithMultipleSheets) {
    $this->sheetImports = array_fill(0, $this->spreadsheet->getSheetCount(), $import);
}
```

Sheet `Petunjuk` baris pertamanya berisi judul besar (`PETUNJUK IMPOR SISWA`),
yang oleh `WithHeadingRow` diperlakukan sebagai nama kolom. Semua key
(`nama`, `email`, …) jadi tidak ada → seluruh barisnya invalid.

Untuk siswa efeknya fatal, karena `StudentsImport` bersifat *all-or-nothing*:

```php
if ($this->errors !== [] || $payloads === []) {
    return;   // tidak ada yang disimpan sama sekali
}
```

→ **impor siswa dengan template resmi tidak pernah bisa berhasil.**

Bukti lengkap: [00-RISET-DAN-TEMUAN.md § Temuan 1](00-RISET-DAN-TEMUAN.md#temuan-1--impor-excel-sheet-petunjuk-ikut-diimpor).

## 3. Opsi solusi

### Opsi A — Importer memilih sheet secara eksplisit (`WithMultipleSheets`) ✅ **DIPILIH**

Setiap importer menyatakan sheet mana yang dibacanya:

```php
class PembimbingImport implements SkipsEmptyRows, ToCollection,
    WithHeadingRow, WithMultipleSheets, SkipsUnknownSheets
{
    public function sheets(): array
    {
        return ['Data Pembimbing' => $this];
    }

    public function onUnknownSheet($name): void
    {
        // berkas tanpa sheet bernama → jatuh ke sheet pertama (lihat §4.2)
    }
}
```

| Pro | Kontra |
|-----|--------|
| Memperbaiki akar masalah, bukan gejala | Perlu sinkron nama sheet antara Export ↔ Import |
| Laravel Excel bahkan hanya **memuat** sheet yang diminta (`setLoadSheetsOnly`) → lebih hemat memori | 9 berkas importer harus disentuh |
| Berkas hasil `Export` (data-siswa.xlsx) tetap bisa dijadikan input | — |
| Tidak ada perubahan skema, tidak ada perubahan UI | — |

### Opsi B — Buang sheet `Petunjuk`/`Referensi` dari template

| Pro | Kontra |
|-----|--------|
| Diff paling kecil | **Menghilangkan fitur yang berguna** — petunjuk & daftar nilai referensi justru mencegah salah ketik relasi |
| — | Tidak menyembuhkan apa pun: file dari user yang punya sheet lain tetap gagal |
| — | Regresi UX yang nyata |

❌ Ditolak.

### Opsi C — Deteksi heuristik "sheet mana yang punya kolom `nama`"

| Pro | Kontra |
|-----|--------|
| Toleran terhadap nama sheet apa pun | Ajaib, sulit di-debug jam 3 pagi |
| — | Bisa salah pilih sheet secara diam-diam → data masuk ke tempat salah |

❌ Ditolak. Nama sheet dikendalikan oleh export kita sendiri; tidak perlu tebak-tebakan.

## 4. Rencana implementasi

### 4.1 Satukan nama sheet di satu tempat

Tambahkan konstanta nama sheet ke `app/Support/ImportDefaults.php` (kelas yang
sudah ada, jangan bikin kelas baru):

```php
final class ImportDefaults
{
    public const PASSWORD = 'password';

    /** Nama sheet data pada setiap template impor (Export ↔ Import harus sama). */
    public const SHEETS = [
        'siswa'      => 'Data Siswa',
        'guru'       => 'Data Guru',
        'pembimbing' => 'Data Pembimbing',
        'kaprog'     => 'Data Kaprog',
        'wakasek'    => 'Data Wakasek',
        'orangtua'   => 'Data Orang Tua',
        'industri'   => 'Data Industri',
        'kelas'      => 'Data Kelas',
        'jurusan'    => 'Data Jurusan',
    ];
}
```

`ImportTemplates::*()` memakai konstanta ini untuk argumen `dataTitle`, dan
importer memakainya untuk `sheets()`. **Satu sumber kebenaran** — nama sheet
tidak bisa lagi menyimpang tanpa ketahuan.

> Sebelum mengisi array di atas, **verifikasi `dataTitle` aktual** tiap template
> di `app/Support/ImportTemplates.php` dan salin apa adanya. Mengganti nama
> sheet akan membuat template lama yang sudah tersebar di tangan operator
> berhenti dikenali — itulah gunanya fallback di §4.2.

### 4.2 Tambahkan pemilihan sheet ke `ImportsRows`

Trait [`ImportsRows`](../../app/Imports/Concerns/ImportsRows.php) sudah dipakai
8 dari 9 importer. Taruh logikanya di sana sekali, bukan disalin 9×:

```php
/** Sheet data yang dibaca importer ini; sheet lain (Petunjuk/Referensi) diabaikan. */
public function sheets(): array
{
    return [$this->sheetName() => $this];
}

/** Berkas tanpa sheet bernama (mis. CSV atau ekspor manual) → baca sheet pertama. */
public function onUnknownSheet($name): void
{
    $this->unknownSheet = true;
}
```

Setiap importer cukup mendeklarasikan:

```php
protected function sheetName(): string
{
    return ImportDefaults::SHEETS['pembimbing'];
}
```

dan menambahkan `WithMultipleSheets, SkipsUnknownSheets` pada `implements`.

**Fallback wajib.** Kalau operator mengunggah berkas buatan sendiri yang
sheet-nya bernama lain, `SkipsUnknownSheets` membuat impor menghasilkan
**0 baris tanpa penjelasan** — itu regresi yang lebih membingungkan daripada
bug sekarang. Karena itu `runImport()` harus menambahkan pesan eksplisit:

```php
// HandlesImportExport::runImport(), setelah Excel::import(...)
if ($import->created === 0 && $import->failed === [] && $import->skipped === []) {
    return redirect()->route($route)->with('error',
        'Tidak ada data terbaca. Pastikan berkas memiliki sheet bernama '
        ."\"{$import->sheetName()}\" — unduh template terbaru bila ragu.");
}
```

### 4.3 Samakan `StudentsImport` dengan importer lain

`StudentsImport` adalah satu-satunya yang tidak memakai trait, dan satu-satunya
yang *all-or-nothing*. Ini sumber ketidakkonsistenan yang nyata: operator
belajar "impor melewati duplikat" dari modul lain, lalu modul siswa berperilaku
berbeda tanpa peringatan.

Langkah:

1. `StudentsImport` memakai trait `ImportsRows` (menghapus duplikasi
   `DEFAULT_PASSWORD`, `lookup()`, `gender()`, `date()`, `nullify()`).
2. Ubah dari all-or-nothing ke **skip-duplikat**, sama seperti sisanya:
   baris invalid → `fail()`, email sudah ada → `skip()`, sisanya tetap diimpor.
3. `StudentController::import()` memakai `runImport()` seperti controller lain,
   dan `ValidationException` dihapus dari alur ini.

**Pro/kontra perubahan semantik ini:**

| | |
|---|---|
| ✅ | Satu perilaku untuk semua modul — operator tidak perlu menghafal pengecualian |
| ✅ | Impor 300 siswa tidak batal total gara-gara 1 baris typo |
| ✅ | Menghapus ±90 baris kode duplikat |
| ⚠️ | Operator yang mengandalkan "kalau ada error, tidak ada yang masuk" harus tahu perubahannya → **wajib disebut di rilis note dan di sheet Petunjuk** |
| ⚠️ | Impor sebagian bisa membingungkan bila tidak dilaporkan jelas → sudah ditangani ringkasan `runImport()` ("X ditambahkan · Y dilewati · Z gagal") |

### 4.4 Buang baris contoh dari sheet data

`GenericDataSheet::array()` dan `StudentTemplateSheet::array()` menaruh satu
baris contoh di sheet data. Baris itu **akan ikut terimpor** bila operator lupa
menghapusnya (setelah §4.3, "Budi Santoso" benar-benar masuk DB, bukan sekadar
menggagalkan impor).

Pindahkan contohnya ke sheet `Petunjuk` (sebagai kolom "Cara mengisi" yang
sudah ada di sana), dan biarkan sheet data **hanya berisi baris judul kolom**.

| Pro | Kontra |
|-----|--------|
| Tidak ada data sampah yang bisa lolos | Operator kehilangan contoh yang bisa langsung ditiru di baris yang sama |
| Sheet data siap tempel dari sumber lain | Dimitigasi: contohnya tetap ada, cuma pindah ke sheet Petunjuk |

### 4.5 Rapikan kolom `Periode`

`StudentTemplateSheet::headings()` memuat `Periode`, tapi `StudentsImport`
tidak pernah membacanya. Dua pilihan, **pilih yang paling malas dulu**:
**hapus kolomnya dari template.** Menambah dukungan periode ke importer adalah
fitur baru yang tidak diminta siapa pun di batch ini (YAGNI) — tambahkan nanti
kalau memang diminta.

## 5. Berkas yang disentuh

```
app/Support/ImportDefaults.php            + konstanta SHEETS
app/Support/ImportTemplates.php           dataTitle → ImportDefaults::SHEETS, hapus baris contoh
app/Imports/Concerns/ImportsRows.php      + sheets(), onUnknownSheet(), sheetName()
app/Imports/*.php                    (9)  + implements WithMultipleSheets, SkipsUnknownSheets, + sheetName()
app/Imports/StudentsImport.php            refactor ke trait + skip-duplikat
app/Http/Controllers/Concerns/HandlesImportExport.php  + pesan "sheet tidak ditemukan"
app/Http/Controllers/StudentController.php import() → runImport()
app/Exports/Sheets/GenericDataSheet.php   array() → []
app/Exports/Sheets/StudentTemplateSheet.php array() → [], hapus heading 'Periode'
```

Tidak ada migrasi. Tidak ada perubahan rute. Tidak ada perubahan React
(kecuali teks modal impor siswa yang menyebut perilaku all-or-nothing —
periksa `resources/js/pages/students/index.tsx`).

## 6. Test

Satu test feature, `tests/Feature/ImportTemplateRoundTripTest.php`:

```
test_template_siswa_dapat_langsung_diimpor()
    → unduh template lewat route students.template
    → isi 2 baris valid di sheet "Data Siswa"
    → POST students.import
    → assertDatabaseCount('students', 2)  ← hari ini GAGAL, sesudah fase ini LULUS
    → assertDatabaseMissing('users', ['email' => 'budi@contoh.sch.id'])  ← baris contoh tidak ikut

test_sheet_petunjuk_tidak_menghasilkan_galat()
    → impor template kosong (hanya judul kolom)
    → session tidak punya flash 'error' berisi "Baris 2"

test_baris_invalid_tidak_membatalkan_baris_valid()
    → 3 baris: valid, email kosong, valid
    → assertDatabaseCount('students', 2), flash error menyebut 1 gagal
```

Round-trip lewat route asli (bukan memanggil importer langsung) penting: bug
ini justru terjadi **di antara** export dan import, jadi test yang memanggil
`StudentsImport` dengan array buatan tidak akan pernah menangkapnya.

## 7. Ekspektasi output

**Sebelum:**

- Impor siswa dengan template resmi → banner merah, 0 data masuk, selalu.
- Impor master data lain → data masuk, tapi disertai belasan galat palsu dari
  sheet Petunjuk & Referensi.

**Sesudah:**

- Unduh template → isi → unggah → data masuk. Nol konfigurasi tambahan.
- Ringkasan jujur: `"12 data ditambahkan · 2 dilewati (sudah ada) · 1 gagal"`
  dengan rincian per baris.
- Berkas hasil **Export** juga bisa dipakai sebagai input impor (nama sheet
  konsisten) → alur "ekspor → edit massal di Excel → impor balik" jadi hidup.
- Berkas dengan nama sheet tak dikenal → pesan jelas, bukan "0 data" senyap.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Template lama yang sudah tersebar punya nama sheet berbeda | Fallback + pesan eksplisit (§4.2); jangan ubah `dataTitle` yang sudah ada — salin apa adanya |
| Perubahan all-or-nothing → sebagian bisa mengejutkan operator | Sebutkan di sheet Petunjuk, di modal impor UI, dan di catatan rilis |
| CSV tidak punya sheet | Sudah ditangani library (`['Worksheet' => $import]`); tambahkan satu test CSV untuk mengunci perilaku ini |
| Refactor `StudentsImport` menyentuh jalur yang sudah dipakai produksi | Test §6 dijalankan sebelum & sesudah; perilaku per-baris (validasi, resolusi relasi, warning) **tidak diubah** — hanya cara galat diakumulasi |
