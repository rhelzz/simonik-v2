# Fase 14 — Data Industri: Filter by Guru

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** rendah ·
**Perkiraan:** ~1-2 jam

## 1. Permintaan

> "Pada Modul Data industri, Buatkan fitur filter by Guru"

## 2. Kondisi sekarang

`IndustryController::index()` (`app/Http/Controllers/IndustryController.php:47-80`)
hanya punya satu filter: `search` (nama industri, `like`). Tidak ada filter
guru sama sekali.

```php
$industries = $this->scopedIndustries($user)
    ->with(['pembimbingNormatif:id,name', 'teachers:id,name'])
    ->withCount('students')
    ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
    ->latest()
    ->paginate(10)
    ->withQueryString()
```

Relasi guru sudah ada dan sudah dipakai untuk menampilkan kolom "Guru" di
tabel:

- `app/Models/Industry.php:67-69` — `teachers(): BelongsTo` → `Teacher::class, 'teacher_id'` (FK langsung `industries.teacher_id`, bukan pivot).
- `app/Models/Teacher.php:46-48` — inverse `industries(): HasMany`.

`scopedIndustries()` (`IndustryController.php:162-173`) sudah membatasi guru
login untuk hanya melihat industrinya sendiri:

```php
private function scopedIndustries(User $user): Builder
{
    if ($user->hasRole('guru')) {
        $teacherId = $user->teachers?->id;
        return $teacherId === null
            ? Industry::query()->whereRaw('1 = 0')
            : Industry::query()->where('teacher_id', $teacherId);
    }
    return Industry::query();
}
```

Karena guru sudah dibatasi ke industrinya sendiri, filter "by guru" hanya
berguna untuk role yang melihat semua industri (`admin`, `kaprog` — lihat
`$canManage = $user->hasAnyRole(['admin', 'kaprog'])` di baris 53). Preseden
pola serupa sudah ada di `PlacementController.php:111-119`, yang membangun
opsi dropdown guru dari daftar guru yang **sudah terpasang** ke suatu
industri (bukan semua guru di sistem) — dipakai di sini juga supaya opsi
filter tidak berisi guru yang tidak relevan.

## 3. Keputusan implementasi

### 3.1 Query param `teacher_id`, pola identik `industri_id` di StudentController

Ikuti pola `$request->integer('industri_id')` + `when($id > 0, ...)` yang
sudah dipakai di `StudentController::index()` (baris 71, 89) — konsisten,
tidak menambah pola baru.

### 3.2 Opsi dropdown = guru yang benar-benar terpasang ke industri (scoped)

Bukan `Teacher::all()` (bisa berisi guru yang tak punya industri sama
sekali, bikin filter percuma). Query terpisah: guru distinct dari
`scopedIndustries($user)->whereNotNull('teacher_id')`.

### 3.3 Filter hanya ditampilkan untuk `can.manage`

Untuk role `guru`, `scopedIndustries()` sudah mengunci ke satu industri —
filter guru jadi tidak berarti (selalu 1 opsi = dirinya sendiri). Query
tetap dibuat aman di backend (kalau guru mengirim `teacher_id` lain, hasilnya
tetap kosong karena scoping tetap jalan lebih dulu), tapi UI dropdown-nya
disembunyikan untuk role `guru` agar tidak membingungkan — dikondisikan lewat
prop `can.manage` yang sudah dikirim ke frontend.

## 4. Rencana implementasi

### 4.1 Controller — `IndustryController::index()`

```php
public function index(Request $request): Response
{
    $search = trim((string) $request->query('search', ''));
    $teacherId = $request->integer('teacher_id');

    /** @var User $user */
    $user = $request->user();
    $canManage = $user->hasAnyRole(['admin', 'kaprog']);

    $scoped = $this->scopedIndustries($user);

    $industries = (clone $scoped)
        ->with(['pembimbingNormatif:id,name', 'teachers:id,name'])
        ->withCount('students')
        ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
        ->when($teacherId > 0, fn ($query) => $query->where('teacher_id', $teacherId))
        ->latest()
        ->paginate(10)
        ->withQueryString()
        ->through(fn (Industry $industry): array => [
            // ...tidak berubah
        ]);

    return Inertia::render('industries/index', [
        'industries' => $industries,
        'filters' => ['search' => $search, 'teacher_id' => $teacherId > 0 ? $teacherId : null],
        'can' => ['manage' => $canManage],
        'teacherOptions' => (clone $scoped)
            ->whereNotNull('teacher_id')
            ->with('teachers:id,name')
            ->get()
            ->pluck('teachers')
            ->filter()
            ->unique('id')
            ->sortBy('name')
            ->map(fn (Teacher $teacher): array => ['id' => $teacher->id, 'name' => $teacher->name])
            ->values()
            ->all(),
    ]);
}
```

`clone $scoped` dipakai karena query builder Eloquent bersifat mutable —
menjalankan `->get()` di jalur `teacherOptions` sebelum `->paginate()`
di jalur utama akan merusak builder yang sama kalau tidak di-clone.

### 4.2 Frontend — `industries/index.tsx`

Tambah state + dropdown di baris filter (dekat search form, ~101-134),
pola sama seperti `industryOptions`/`classOptions` di
`students/index.tsx:160-171`:

```tsx
type IndustriesIndexProps = {
    industries: Paginated<IndustryRow>;
    filters: { search: string; teacher_id: number | null };
    can: { manage: boolean };
    teacherOptions: { id: number; name: string }[];
};

const teacherFilterOptions: SelectOption[] = [
    { value: '', label: 'Semua guru' },
    ...teacherOptions.map((t) => ({ value: String(t.id), label: t.name })),
];

function applyFilters(next: { search?: string; teacher_id?: string }) {
    router.get(
        index.url(),
        {
            search: next.search ?? search,
            teacher_id: next.teacher_id ?? filters.teacher_id ?? '',
        },
        { preserveState: true, replace: true, preserveScroll: true },
    );
}
```

Dropdown hanya dirender jika `can.manage` true dan `teacherOptions.length > 0`.
Gunakan komponen `Select` yang sudah ada (`@/components/ui/select`), **jangan**
`<select>` native — proyek ini sudah punya konvensi (lihat `docs/UI-PATTERNS.md`).

`activeCount`/badge filter aktif diperluas mengikutkan `filters.teacher_id`.

## 5. Berkas yang disentuh

```
app/Http/Controllers/IndustryController.php   index(): + filter teacher_id + teacherOptions
resources/js/pages/industries/index.tsx        + dropdown filter guru
```

## 6. Test

`tests/Feature/IndustryFilterByTeacherTest.php`:

```
test_admin_bisa_filter_industri_by_guru()
    → 2 industri, guru A & guru B berbeda
    → GET industries.index?teacher_id=A → assertSee hanya industri guru A

test_guru_login_filter_teacher_id_lain_tetap_hanya_lihat_industrinya_sendiri()
    → guru login coba kirim teacher_id milik guru lain
    → hasil tetap discope ke industrinya sendiri (scopedIndustries jalan duluan)

test_teacher_options_hanya_berisi_guru_yang_terpasang_ke_industri()
    → ada guru tanpa industri sama sekali
    → assertDontSee nama guru itu di teacherOptions (via Inertia assertInertia)
```

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Query builder Eloquent mutable — reuse builder yang sama untuk 2 query berbeda saling merusak | `clone $scoped` dipakai eksplisit sebelum tiap penggunaan independen (§4.1) |
| Filter tampil untuk guru padahal tidak berguna (selalu 1 hasil) | Disembunyikan di UI lewat `can.manage`, tapi tetap aman di backend by-design karena `scopedIndustries()` tetap jadi query dasar |
