# Fase 8 — Filter di Plotting & Penempatan

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** rendah ·
**Perkiraan:** ~2 jam

## 1. Permintaan

> "Pada Modul Plotting & Penempatan, buatkan fitur filter by kelas, industri,
> guru pembimbing, status PKL."

## 2. Kondisi sekarang

`PlacementController::index()` (`app/Http/Controllers/PlacementController.php:24-79`)
hanya punya **satu** filter: `search` (nama/NIS), dan itu pun query manual,
bukan lewat pola `Select` + query string yang sudah dipakai modul lain.

Data yang sudah tersedia di query (tinggal difilter, tidak perlu query
tambahan):

```php
$students = $this->programStudents($user)
    ->with([
        'classes:id,name',
        'departements:id,name',
        'industries:id,name,teacher_id',
        'industries.teachers:id,name',
    ])
    // ...
```

- **Kelas** → `class_id` langsung kolom di `students`.
- **Industri** → `industri_id` langsung kolom di `students`.
- **Guru pembimbing** → **tidak langsung** di `students`; guru ditentukan oleh
  industri (`industries.teacher_id`), sesuai komentar di file yang sama:
  *"guru pembimbing mengikuti guru pembimbing industri terpilih"*. Filter guru
  jadi `whereHas('industries', fn ($q) => $q->where('teacher_id', $teacherId))`,
  bukan kolom langsung.
- **Status PKL** → kolom `status_pkl` di `students` (enum `belum`/`proses`/`selesai`,
  sama seperti dipakai `StoreStudentRequest`).

Frontend `resources/js/pages/placements/index.tsx` juga hanya punya search
box (baris 41, 166-228) — belum ada `Select` filter sama sekali.

Pola filter kombinasi search + dropdown **sudah mapan** di modul lain dan
tinggal disalin, bukan dirancang ulang:

- `KaprogController::index()` (`app/Http/Controllers/KaprogController.php:48-83`)
  + `resources/js/pages/kaprogs/index.tsx:41,67-107,159-165` — pola
  `applyFilters()` dengan partial state + `router.get(..., { preserveState: true })`.
- `ParentController::index()` — pola alias gender untuk dropdown.

## 3. Rencana implementasi

### 3.1 Backend — `PlacementController::index()`

```php
$classId = $request->integer('class_id');
$industriId = $request->integer('industri_id');
$teacherId = $request->integer('teacher_id');
$statusPkl = (string) $request->query('status_pkl', '');

$students = $this->programStudents($user)
    ->with([...])
    ->when($search !== '', fn ($query) => $query->where(...)) // tidak berubah
    ->when($classId > 0, fn ($query) => $query->where('class_id', $classId))
    ->when($industriId > 0, fn ($query) => $query->where('industri_id', $industriId))
    ->when($teacherId > 0, fn ($query) => $query->whereHas(
        'industries',
        fn ($q) => $q->where('teacher_id', $teacherId),
    ))
    ->when(
        in_array($statusPkl, ['belum', 'proses', 'selesai'], true),
        fn ($query) => $query->where('status_pkl', $statusPkl),
    )
    ->orderBy('name')
    ->paginate(12)
    ->withQueryString()
    ->through(...); // tidak berubah
```

Opsi dropdown **dibatasi ke lingkup program kaprog** (`ScopesProgramByKaprog`),
konsisten dengan kenapa `$students` sendiri sudah discope — kalau opsi kelas
menampilkan kelas jurusan lain, kaprog bisa memfilter ke siswa yang bukan
tanggung jawabnya (bukan pelanggaran akses karena `programStudents()` tetap
menyaring hasilnya, tapi membingungkan: opsi terlihat, hasil selalu kosong).

```php
$classOptions = Classes::query()
    ->whereIn('departemen_id', $this->programDepartemenIds($user))
    ->orderBy('name')
    ->get(['id', 'name']);
```

Industri dan guru pembimbing **tidak** dibatasi ke jurusan — satu industri
bisa menerima siswa dari jurusan berbeda (lihat `$industries` yang sudah
diambil tanpa scoping departemen di method yang sama), jadi opsi filter
industri/guru dibiarkan sama seperti variabel `$industries` yang sudah ada;
tinggal dipetakan jadi opsi guru unik:

```php
$teacherOptions = $industries
    ->filter(fn (Industry $i) => $i->teacher_id !== null)
    ->pluck('teachers') // via relasi yang sudah di-load
    ->unique('id')
    ->values();
```

`filters` yang dikirim ke Inertia bertambah 4 key, dan opsi kelas/status PKL
dikirim sebagai prop baru (industri & guru bisa pakai ulang `industries` yang
sudah ada — tidak perlu prop terpisah, cukup turunkan opsi guru darinya di
frontend atau kirim `teacherOptions` eksplisit; pilih **eksplisit** supaya
frontend tidak mengulang logika "unique by id" yang harusnya sekali saja di
backend).

### 3.2 Form Request / validasi query

Filter GET tidak perlu Form Request (pola yang sama di `KaprogController`
juga tidak pakai) — cukup `Rule::in` manual seperti `status_pkl` di atas,
dan `->integer()` sudah aman terhadap non-numerik (mengembalikan 0, yang oleh
`when($classId > 0, ...)` otomatis diperlakukan sebagai "tanpa filter").

### 3.3 Frontend — `resources/js/pages/placements/index.tsx`

Tambah 4 `Select` di baris toolbar yang sama dengan search box (baris
166-228), menyalin pola `applyFilters()` dari `kaprogs/index.tsx:67-97`:

```tsx
type PlacementFilters = {
    search: string;
    class_id: number | null;
    industri_id: number | null;
    teacher_id: number | null;
    status_pkl: string | null;
};

function applyFilters(next: Partial<PlacementFilters>) {
    router.get(
        placementsIndex.url(),
        { ...filters, ...next },
        { preserveState: true, preserveScroll: true, replace: true },
    );
}
```

- **Kelas**: opsi dari prop baru `classOptions`.
- **Industri**: opsi dari `industries` yang sudah ada di prop.
- **Guru pembimbing**: opsi dari prop baru `teacherOptions`.
- **Status PKL**: opsi statis 3 nilai (`belum`/`proses`/`selesai`), label
  Indonesia — cek label yang sudah dipakai di `students/index.tsx` atau
  `student-form.tsx:515-523` agar konsisten kata-katanya di seluruh app.
- Badge jumlah filter aktif (pola `activeCount` di `kaprogs/index.tsx:107`)
  dan tombol "Bersihkan filter" bila ada ≥1 filter aktif — pola yang sama
  juga sudah ada di `parents/index.tsx`.

## 4. Berkas yang disentuh

```
app/Http/Controllers/PlacementController.php   + 4 filter query + classOptions() + teacherOptions()
resources/js/pages/placements/index.tsx         + 4 Select filter + applyFilters()
```

**Nol migrasi, nol Form Request baru.**

## 5. Test

`tests/Feature/PlacementFilterTest.php`:

```
test_filter_by_kelas_hanya_menampilkan_siswa_kelas_tersebut()
test_filter_by_industri_hanya_menampilkan_siswa_industri_tersebut()
test_filter_by_guru_pembimbing_menampilkan_siswa_di_industri_guru_tersebut()
    → siswa A di industri X (teacher_id = guru1), siswa B di industri Y (teacher_id = guru2)
    → filter teacher_id=guru1 → hanya A
test_filter_by_status_pkl_hanya_menampilkan_status_tersebut()
test_kombinasi_filter_bekerja_dengan_and_bukan_or()
    → kelas A + status "proses" → siswa kelas A status "belum" tidak ikut
test_opsi_kelas_dibatasi_lingkup_kaprog()
    → login kaprog jurusan RPL → classOptions tidak berisi kelas TKJ
```

## 6. Ekspektasi output

**Sebelum:** kaprog dengan ratusan siswa lintas kelas/industri hanya bisa
mempersempit lewat kotak cari nama/NIS — untuk pertanyaan seperti "siapa saja
di kelas XII-A yang belum ditempatkan" harus scroll manual sambil membaca
kolom Kelas & Status satu per satu.

**Sesudah:** empat dropdown di atas tabel, bisa dikombinasikan bebas dengan
kotak cari yang sudah ada, query string tetap ter-*preserve* saat pindah
halaman paginasi (pola `withQueryString()` yang sudah ada tidak berubah).

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Opsi kelas menampilkan jurusan lain, filter kelihatan tidak berfungsi | `classOptions()` dibatasi `programDepartemenIds($user)`, sama seperti `$students` sendiri sudah discope |
| Filter guru pembimbing membingungkan karena bukan kolom langsung | Nama variabelnya eksplisit `teacher_id` (bukan `guru_id`) dan query-nya `whereHas('industries', ...)` — didokumentasikan di sini supaya siapa pun yang membaca controller nanti tidak mengira ada kolom `teacher_id` di `students` |
| Kombinasi banyak filter query lambat di data besar | `class_id`/`industri_id`/`status_pkl` semuanya kolom terindeks langsung (FK/enum); hanya filter guru yang lewat `whereHas` — masih dalam skala wajar untuk data satu sekolah (ratusan, bukan puluhan ribu baris) |
