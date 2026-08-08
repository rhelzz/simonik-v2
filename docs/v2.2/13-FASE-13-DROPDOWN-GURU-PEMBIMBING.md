# Fase 13 — Plotting & Penempatan: Dropdown Guru Pembimbing Aktif

**Status:** 📝 Rencana · **Prioritas:** P1 · **Risiko regresi:** sedang-tinggi ·
**Perkiraan:** ~3-4 jam

## 1. Permintaan

> "Modul Plotting & Penempatan, di bagian tabelnya ada kolom 'Guru
> pembimbing', nah kolom Guru pembimbing ini dropdown nya belum aktif.
> Tujuannya memudahkan mengubah guru pembimbing. Murid tidak hanya bisa
> ubah nama industri secara langsung tetapi bisa ubah guru pembimbing
> melalui dropdown, datanya terhubung ke semua relasi."

Dikonfirmasi user: tambah kolom **override per-siswa** (`students.teacher_id`),
bukan sekadar mengaktifkan sesuatu yang sudah ada — datanya memang belum ada.

## 2. Kondisi sekarang

Kolom "Guru pembimbing" di tabel Plotting & Penempatan
(`resources/js/pages/placements/index.tsx:140-154`, komponen `PlacementRow`)
**bukan dropdown** — cuma `<span>` read-only. Nilainya diturunkan murni dari
industri yang dipilih murid (baris 104-105: `industries.find(i => i.id ===
industriId)?.guru`), bukan disimpan per-siswa. Komentar di baris 140:
`{/* Guru pembimbing (mengikuti industri) */}` — ini **desain sengaja**, dan
di `PlacementController.php:16-18` juga didokumentasikan: "guru pembimbing
mengikuti guru pembimbing industri terpilih".

Penting — histori skema: `students.teacher_id` **pernah ada**, lalu sengaja
**dihapus** oleh migrasi `2025_01_02_000003_drop_teacher_id_from_students.php`
setelah guru pembimbing dipindah ke level industri oleh
`2025_01_02_000002_rework_industry_supervisor_columns.php` (komentar migrasi:
"guru pembimbing tidak lagi dipakai... `students.industri_id` →
`industries.teacher_id`"). Fase ini **membalik keputusan arsitektur itu**
dengan menambah kolom override — bukan sekadar tambahan kecil, jadi perlu
jelas kenapa: sebelumnya 1 industri = 1 guru pembimbing tetap; sekarang
industri boleh dibimbing beberapa guru berbeda per-murid (mis. industri
besar dengan banyak guru pembina).

Model & relasi terkait:
- `Industry::teachers()` (`app/Models/Industry.php:67-69`) — `belongsTo(Teacher::class, 'teacher_id')`.
- `Student` (`app/Models/Student.php`) — tidak ada relasi teacher saat ini.
- `PlacementController::index()` — `guru` di setiap baris murid diambil dari
  `$student->industries?->teachers?->name` (baris 67), bukan dari siswa.
- `UpdatePlacementRequest.php:20-23` — hanya menerima `industri_id` dan
  `status_pkl`; tidak ada `teacher_id`.
- `PlacementController::update()` (baris 128-142) — `$student->update($request->validated())`,
  langsung mass-assign hasil validasi.
- `teacherOptions` sudah dikirim ke frontend (`PlacementController.php:103-111`)
  untuk **filter** tabel, tapi sumbernya cuma guru yang sudah terpasang di
  suatu industri (`filter($industry->teacher_id !== null)->pluck('teachers')`)
  — dropdown *override* idealnya bisa pilih guru mana pun dalam lingkup
  jurusan kaprog, bukan cuma yang kebetulan sudah terpasang ke industri.
  Perlu query terpisah untuk opsi dropdown ini (lihat §4.1).

## 3. Keputusan implementasi

### 3.1 Kolom baru, bukan rename yang lama

`students.teacher_id` ditambahkan lagi sebagai **override nullable**:
`null` = ikut guru pembimbing industri (perilaku sekarang, default).
Terisi = menimpa (override) turunan dari industri untuk siswa itu saja.

### 3.2 Nilai tampil = override jika ada, else fallback ke industri

Baik di controller maupun frontend: `guru pembimbing tampil = student.teacher
?? student.industries?.teachers`. Ini menjaga baris siswa yang belum
di-override tetap berperilaku persis seperti sekarang.

### 3.3 Opsi dropdown: semua guru dalam lingkup jurusan kaprog

Bukan cuma guru yang sudah terpasang ke suatu industri — pakai
`programDepartemenIds()` (sudah ada di `ScopesProgramByKaprog`, dipakai
`programStudents()`) untuk query `Teacher::whereIn('departemen_id', ...)`.
Ini query baru, terpisah dari `teacherOptions` yang sudah ada untuk filter
(yang scope-nya sengaja lintas jurusan — lihat komentar baris 100-102).

## 4. Rencana implementasi

### 4.1 Migrasi

```php
// database/migrations/xxxx_add_teacher_id_override_to_students.php
Schema::table('students', function (Blueprint $table): void {
    $table->foreignId('teacher_id')->nullable()->after('industri_id')
        ->constrained('teachers')->nullOnDelete();
});
```

### 4.2 Model — `Student.php`

```php
public function teachers(): BelongsTo
{
    return $this->belongsTo(Teacher::class, 'teacher_id');
}
```

(Nama relasi `teachers` singular-target mengikuti konvensi yang sudah dipakai
`Industry::teachers()` di codebase ini — bukan pola umum Laravel, tapi
konsisten dengan yang ada.)

### 4.3 Form Request — `UpdatePlacementRequest.php`

```php
'industri_id' => ['required', Rule::exists('industries', 'id')],
'status_pkl' => ['required', Rule::in(['belum', 'proses', 'selesai'])],
'teacher_id' => ['nullable', Rule::exists('teachers', 'id')],
```

### 4.4 Controller — `PlacementController`

`index()`:
- Eager-load `'teachers:id,name'` di `programStudents($user)->with([...])`.
- `'guru' => $student->teachers?->name ?? $student->industries?->teachers?->name,`
- `'teacher_id' => $student->teacher_id,` (dikirim ke frontend supaya
  dropdown tahu nilai ter-override, beda dari nilai turunan industri).
- Tambah `programTeacherOptions` (atau perluas `teacherOptions` yang ada —
  putuskan saat implementasi mana yang lebih pas tanpa duplikasi) berisi
  seluruh guru di `programDepartemenIds($user)`, dipakai sebagai opsi
  dropdown override (§3.3) — beda dari `teacherOptions` yang ada (itu tetap
  untuk filter, jangan disatukan kalau scope-nya memang beda).

`update()`: sudah otomatis menerima `teacher_id` lewat `$request->validated()`
+ `$student->update(...)` karena mass-assignment — pastikan `teacher_id` ada
di `$fillable`/`Fillable` attribute `Student` model.

### 4.5 Frontend — `placements/index.tsx`

Ganti `<span>` guru pembimbing (140-154) jadi `<select>`, pola sama seperti
kolom Industri (120-138):

```tsx
const [teacherId, setTeacherId] = useState(student.teacher_id);

function save(nextIndustri: number, nextStatus: StatusPkl, nextTeacher: number | null) {
    router.patch(
        update.url(student.id),
        { industri_id: nextIndustri, status_pkl: nextStatus, teacher_id: nextTeacher },
        { preserveScroll: true, preserveState: true },
    );
}

<select
    value={teacherId ?? ''}
    onChange={(event) => {
        const next = event.target.value ? Number(event.target.value) : null;
        setTeacherId(next);
        save(industriId, status, next);
    }}
    className={selectClass}
>
    <option value="">Ikuti industri ({guru ?? 'belum ada'})</option>
    {programTeacherOptions.map((teacher) => (
        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
    ))}
</select>
```

Opsi kosong ("Ikuti industri") mengembalikan ke `null` = fallback ke turunan
industri, bukan menghapus siswa dari daftar dsb.

## 5. Berkas yang disentuh

```
database/migrations/xxxx_add_teacher_id_override_to_students.php   baru
app/Models/Student.php                                              relasi teachers() baru
app/Http/Requests/UpdatePlacementRequest.php                        + rule teacher_id
app/Http/Controllers/PlacementController.php                        index(): eager-load + guru fallback + opsi dropdown baru
resources/js/pages/placements/index.tsx                             kolom guru pembimbing → dropdown aktif
```

## 6. Test

`tests/Feature/PlacementTeacherOverrideTest.php`:

```
test_guru_pembimbing_default_ikut_industri()
    → siswa tanpa teacher_id, industri punya teacher_id X
    → GET placements.index → assertSee nama guru X untuk baris siswa itu

test_guru_pembimbing_bisa_di_override_per_siswa()
    → PATCH placements.update dengan teacher_id = Y (beda dari guru industri)
    → assertDatabaseHas('students', ['id' => ..., 'teacher_id' => Y])
    → GET placements.index → assertSee nama guru Y, bukan guru industri

test_override_bisa_dikembalikan_ke_ikut_industri()
    → PATCH dengan teacher_id = null setelah sebelumnya di-override
    → assertDatabaseHas('students', ['teacher_id' => null])

test_teacher_id_di_luar_lingkup_jurusan_kaprog_ditolak_atau_diabaikan()
    → tentukan perilaku saat implementasi: apakah UpdatePlacementRequest perlu
      Rule::exists yang juga discope departemen, atau cukup exists umum karena
      otorisasi murid sudah discope di update() — putuskan satu, jangan dua-duanya
      longgar
```

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Fitur lain masih berasumsi guru pembimbing murni dari industri (mis. `ScopesStudentsByRole` yang disebut komentar `PlacementController.php:100-102` — guru login hanya lihat siswa di industri yang dia bimbing) | **Wajib ditelusuri sebelum implementasi** — kalau visibilitas guru terhadap siswa memang berbasis `industries.teacher_id`, siswa yang di-override ke guru B tapi industrinya masih terikat guru A bisa jadi tidak terlihat oleh guru B manapun. Ini bisa jadi perubahan cakupan lebih besar dari yang diminta; **konfirmasi ke user** kalau ternyata visibilitas guru juga perlu ikut `students.teacher_id` |
| Menambah kembali kolom yang sengaja dihapus migrasi lama tanpa memahami alasan aslinya | Alasan penghapusan sudah dibaca & didokumentasikan di §2 — override ini eksplisit berbeda tujuan (per-siswa, bukan pengganti level industri) |
| Dropdown opsi guru terlalu luas/sempit (lintas jurusan vs scoped) | Diputuskan eksplisit di §3.3: scoped ke jurusan kaprog, beda dari `teacherOptions` filter yang ada |
