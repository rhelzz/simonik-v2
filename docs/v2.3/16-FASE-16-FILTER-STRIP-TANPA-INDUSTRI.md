# Fase 16 — Data Siswa: Filter "Belum Punya Industri" di Dropdown Industri

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** rendah ·
**Perkiraan:** ~1-1.5 jam

## 1. Permintaan

> "Pada Modul Data Siswa, dibuatkan filter tanda strip (untuk murid yang
> belum memiliki industri) di dropdown daftar industri."

Ditafsirkan sebagai: satu opsi tambahan di dropdown filter industri
(`students/index.tsx`) yang, kalau dipilih, menampilkan hanya siswa dengan
`industri_id = NULL` — konsisten dengan tanda "—" (strip) yang sudah dipakai
di tabel untuk merepresentasikan nilai kosong (lihat pola yang sama di
`industries/index.tsx:207`: `{industry.guru ?? '—'}`).

## 2. Kondisi sekarang

**Backend** — `StudentController::index()`
(`app/Http/Controllers/StudentController.php:67-117`):

```php
$industriId = $request->integer('industri_id');
...
->when($industriId > 0, fn ($query) => $query->where('industri_id', $industriId))
...
'industries' => Industry::orderBy('name')->get(['id', 'name']),
```

`$request->integer()` mengembalikan `0` baik saat param tak dikirim maupun
saat dikirim non-numerik — tidak ada cara membedakan "tidak difilter" dari
"filter ke industri id 0" (yang toh tidak pernah ada). Ini sebabnya sentinel
numerik seperti `0` atau `-1` tidak aman dipakai untuk makna "NULL"; perlu
representasi string terpisah.

**Frontend** — `resources/js/pages/students/index.tsx:165-171`:

```tsx
const industryOptions: SelectOption[] = [
    { value: '', label: 'Semua industri' },
    ...industries.map((ind) => ({ value: String(ind.id), label: ind.name })),
];
```

Hanya ada opsi "Semua industri" (`value: ''` = tidak difilter). Tidak ada
opsi eksplisit untuk industri kosong.

**Nullability `industri_id`** — sudah didukung penuh di level data:
- Skema awal (`database/migrations/2025_01_01_000009_create_students_table.php:29`) NOT NULL.
- Dilonggarkan oleh `database/migrations/2026_08_04_210000_make_student_profile_fields_nullable.php:38-41`:
  ```php
  $table->foreignId($column)->nullable()->change();
  $table->foreign($column)->references('id')->on($related)->nullOnDelete();
  ```
- `app/Models/Student.php:28` — `@property int|null $industri_id`.

Jadi "siswa belum punya industri" = `students.industri_id IS NULL`, sudah
valid di DB/model, tinggal diekspos sebagai filter.

## 3. Keputusan implementasi

### 3.1 Sentinel string `'none'` di query param, bukan angka

`industri_id` di request diperlakukan sebagai tiga kemungkinan: kosong
(tidak difilter), `'none'` (filter ke `NULL`), atau numerik (filter ke id
tertentu). Dibaca lewat `$request->query('industri_id', '')` (string
mentah), bukan `$request->integer()`, supaya `'none'` tidak ikut ter-cast
jadi `0`.

### 3.2 Opsi dropdown ditambah di frontend, bukan dimasukkan ke daftar `industries` dari backend

`industries` prop tetap murni daftar industri asli (dipakai juga di tempat
lain kalau ada) — opsi "— Belum ada industri —" ditambahkan di level
`industryOptions` (frontend), sama seperti opsi "Semua industri" yang sudah
ada di sana secara statis.

## 4. Rencana implementasi

### 4.1 Controller — `StudentController::index()`

```php
$industriIdRaw = trim((string) $request->query('industri_id', ''));
$industriId = ctype_digit($industriIdRaw) ? (int) $industriIdRaw : 0;
$filterNoIndustri = $industriIdRaw === 'none';

$students = $this->scopedStudents($user)
    ->where('archived', false)
    ->with(['classes:id,name', 'users:id,email', 'industries:id,name'])
    ->when($search !== '', function ($query) use ($search): void { /* ...tidak berubah... */ })
    ->when($classId > 0, fn ($query) => $query->where('class_id', $classId))
    ->when($filterNoIndustri, fn ($query) => $query->whereNull('industri_id'))
    ->when(! $filterNoIndustri && $industriId > 0, fn ($query) => $query->where('industri_id', $industriId))
    ->when($statusPkl !== '', fn ($query) => $query->where('status_pkl', $statusPkl))
    ...
    'filters' => [
        ...
        'industri_id' => $filterNoIndustri ? 'none' : ($industriId > 0 ? $industriId : null),
        ...
    ],
```

`filters.industri_id` di tipe frontend berubah dari `number | null` menjadi
`number | 'none' | null`.

### 4.2 Frontend — `students/index.tsx`

```tsx
const industryOptions: SelectOption[] = [
    { value: '', label: 'Semua industri' },
    { value: 'none', label: '— Belum ada industri —' },
    ...industries.map((ind) => ({ value: String(ind.id), label: ind.name })),
];
```

`applyFilters`/`FilterPatch` sudah bekerja generik dengan string (baris
131-149), tidak perlu perubahan — `industri_id` yang dikirim tetap string
(`''`, `'none'`, atau id).

`activeCount` (baris 182-186) sudah menghitung `filters.industri_id` sebagai
truthy/falsy — nilai `'none'` tetap truthy, tidak perlu perubahan.

## 5. Berkas yang disentuh

```
app/Http/Controllers/StudentController.php   index(): baca industri_id sebagai string, tambah cabang whereNull
resources/js/pages/students/index.tsx         + opsi "— Belum ada industri —", tipe filters.industri_id
```

## 6. Test

`tests/Feature/StudentFilterNoIndustryTest.php`:

```
test_filter_industri_id_none_hanya_menampilkan_siswa_tanpa_industri()
    → 1 siswa dengan industri, 1 siswa industri_id null
    → GET students.index?industri_id=none → assertSee siswa tanpa industri, assertDontSee yang lain

test_filter_industri_id_numerik_tetap_bekerja_seperti_sebelumnya()
    → regresi: pastikan perubahan cara baca query param tidak merusak filter existing

test_tanpa_filter_industri_menampilkan_semua_siswa()
    → GET students.index (tanpa industri_id) → assertSee kedua siswa
```

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Mengganti `$request->integer()` ke pembacaan string manual bisa melewatkan validasi implisit yang tadinya dijamin oleh cast Laravel | `ctype_digit()` dipakai sebagai guard eksplisit sebelum cast ke int, jadi nilai non-numerik/non-`'none'` diperlakukan sama seperti sebelumnya (dianggap tidak difilter) |
| Test lama yang mengasumsikan `industri_id` selalu numerik di prop `filters` | Tipe frontend diperluas (`number \| 'none' \| null`), bukan diganti — konsumen lama yang cuma cek truthy tidak terdampak |
