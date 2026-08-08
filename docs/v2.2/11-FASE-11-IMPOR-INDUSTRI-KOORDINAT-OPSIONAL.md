# Fase 11 — Impor & Form Industri: Latitude/Longitude Jadi Opsional

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** rendah ·
**Perkiraan:** ~1 jam

## 1. Permintaan

> "Import data industri, bagian LA/LT tidak perlu diberikan bintang merah."

"LA/LT" = koordinat Latitude/Longitude (dikonfirmasi user).

## 2. Kondisi sekarang

Latitude/Longitude ditandai **wajib** di 4 tempat berbeda, semuanya perlu
diubah bersamaan (kalau cuma UI yang diubah, submit tetap ditolak backend —
sama seperti prinsip di Fase 9 `docs/v2.1`):

| Lokasi | Baris | Isi sekarang |
|---|---|---|
| `app/Support/ImportTemplates.php` (template impor) | 155-156 | `['Longitude', 'Wajib', ...]`, `['Latitude', 'Wajib', ...]` — dirender jadi teks merah di `resources/js/pages/import/index.tsx:259-272` lewat cek `required === 'Wajib'` |
| `app/Imports/IndustryImport.php` (parser impor Excel) | 52 | `if ($name === '' \|\| $bidang === '' \|\| ... \|\| $longitude === '' \|\| $latitude === '') { ...tolak baris... }` |
| `app/Http/Requests/StoreIndustryRequest.php` | 25-26 | `'longitude' => ['required', ...]`, `'latitude' => ['required', ...]` |
| `app/Http/Requests/UpdateIndustryRequest.php` | 25-26 | sama |
| `resources/js/components/industries/industry-form.tsx` (form manual tambah/edit industri) | 264-288 | `<input id="latitude" ... required />`, `<input id="longitude" ... required />` |

Kolom di database (`database/migrations/2025_01_01_000005_create_industries_table.php:20-21`)
sudah `string` **NOT NULL** — perlu migrasi baru untuk `nullable()->change()`
kalau field ini benar-benar boleh dikosongkan sampai ke database, bukan cuma
di form.

## 3. Keputusan yang perlu disepakati

Sama seperti Fase 9: "hilangkan wajib" diperlakukan sebagai **UI + validasi
sekaligus** (backend ikut jadi `nullable`), bukan cuma menghapus tampilan
asterisk. Konsekuensi: industri boleh disimpan tanpa koordinat.

Dampak fitur lain yang bergantung pada koordinat harus dicek saat implementasi:
- `MapPicker` di `industry-form.tsx:289-295` memakai `lat`/`lng` sebagai nilai
  awal `-6.914744`/`107.609810` (default Jakarta) — kalau field dikosongkan,
  pastikan tidak mengirim string kosong yang tak sengaja tersimpan sebagai
  `"0"` atau string kosong yang lolos map picker.
- Fitur absen berbasis lokasi (radius WFO, lihat `AttendanceController`)
  kemungkinan memakai `industry->latitude/longitude` untuk validasi jarak.
  **Industri tanpa koordinat berarti absen WFO tidak bisa divalidasi jaraknya**
  untuk industri itu — perlu ditelusuri saat implementasi apakah perlu guard
  tambahan (mis. nonaktifkan mode WFO kalau industri belum punya koordinat),
  atau cukup dibiarkan karena itu tanggung jawab operator mengisi belakangan.

## 4. Rencana implementasi

### 4.1 Migrasi — kolom nullable

```php
// database/migrations/xxxx_make_industry_coordinates_nullable.php
Schema::table('industries', function (Blueprint $table): void {
    $table->string('longitude')->nullable()->change();
    $table->string('latitude')->nullable()->change();
});
```

### 4.2 Form Request

`StoreIndustryRequest.php` & `UpdateIndustryRequest.php`:

```php
'longitude' => ['nullable', 'string', 'max:255'],
'latitude' => ['nullable', 'string', 'max:255'],
```

### 4.3 Import — template & parser

`ImportTemplates.php:155-156`:

```php
['Longitude', 'Opsional', 'Koordinat bujur, mis. 107.60981.'],
['Latitude', 'Opsional', 'Koordinat lintang, mis. -6.914744.'],
```

`IndustryImport.php:52` — keluarkan `$longitude === ''` dan `$latitude === ''`
dari kondisi baris ditolak; field lain (`name`, `bidang`, `alamat`) tetap wajib.

### 4.4 Form manual — `industry-form.tsx`

Hapus atribut `required` dari `<input id="latitude">` (baris ~271) dan
`<input id="longitude">` (baris ~286). Pertimbangkan default `MapPicker`
tetap dipakai sebagai *placeholder*/nilai awal, bukan nilai tersimpan kalau
user tidak menyentuh field — cek perilaku `MapPicker` saat implementasi agar
tidak diam-diam menyimpan koordinat default Jakarta untuk industri yang
sebenarnya tidak diisi.

## 5. Berkas yang disentuh

```
database/migrations/xxxx_make_industry_coordinates_nullable.php   baru
app/Http/Requests/StoreIndustryRequest.php                         longitude/latitude → nullable
app/Http/Requests/UpdateIndustryRequest.php                        idem
app/Support/ImportTemplates.php                                    label Wajib → Opsional (industri, baris 155-156)
app/Imports/IndustryImport.php                                     hapus longitude/latitude dari validasi baris wajib
resources/js/components/industries/industry-form.tsx               hapus required dari input latitude/longitude
```

## 6. Test

`tests/Feature/IndustryCoordinatesOptionalTest.php`:

```
test_industri_bisa_dibuat_tanpa_koordinat()
    → POST industries.store tanpa longitude/latitude
    → assertDatabaseHas('industries', ['longitude' => null, 'latitude' => null])

test_impor_industri_menerima_baris_tanpa_koordinat()
    → import baris Excel dengan Longitude/Latitude kosong tapi Nama/Bidang/Alamat terisi
    → assertDatabaseHas — baris tetap masuk, bukan ditolak
```

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Absen WFO tak bisa divalidasi jaraknya untuk industri tanpa koordinat | Ditelusuri saat implementasi (§3); di luar cakupan kalau ternyata sudah ada fallback yang aman |
| `MapPicker` diam-diam menyimpan default Jakarta meski user tidak mengisi | Cek `industry-form.tsx` saat implementasi — pastikan `lat`/`lng` kosong tetap terkirim kosong, bukan nilai default state |
