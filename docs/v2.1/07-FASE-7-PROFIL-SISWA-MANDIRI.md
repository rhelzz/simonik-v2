# Fase 7 — Siswa Melengkapi Profil Sendiri + Peringatan Navbar

**Status:** 📝 Rencana · **Prioritas:** P1 · **Risiko regresi:** rendah ·
**Perkiraan:** ~4 jam

## 1. Permintaan

> "Pada modul data siswa, terdapat form input akun login & data diri. Akun
> login dan data diri ini dibuatkan juga di profil akun murid, sehingga
> murid yang sudah login bisa melengkapi datanya. Buatkan juga agar jika
> murid belum melengkapi profilenya ada peringatan di navbar top (khusus
> murid)."

## 2. Kondisi sekarang

**Skema sudah disiapkan untuk ini.** Migrasi
`database/migrations/2026_08_04_210000_make_student_profile_fields_nullable.php`
melonggarkan `nis`, `placeOfBirth`, `dateOfBirth`, `gender`, `bloodType`,
`alamat` (+ FK `class_id`, `industri_id`, `departemen_id`, `parent_id`)
menjadi nullable, dengan komentar eksplisit:

> "Hanya nama + email yang wajib saat membuat siswa. Sisa profil (NIS, data
> diri, kelas/jurusan/industri/orang tua) dilengkapi belakangan oleh siswa
> sendiri."

`StoreStudentRequest` (`app/Http/Requests/StoreStudentRequest.php:31-47`)
sudah mengikuti ini: hanya `name`, `email`, `password` yang `required`, sisanya
`nullable`. **Yang belum ada: jalur bagi siswa untuk benar-benar mengisinya.**

Halaman profil yang ada sekarang, `resources/js/pages/profile/edit.tsx` +
`app/Http/Controllers/ProfileController.php`, cuma punya dua kartu — "Informasi
akun" (nama, email) dan "Keamanan" (ganti sandi) — **sama untuk semua peran**.
Tidak ada field data diri sama sekali.

Pola peringatan navbar **sudah ada** dan bisa dicontoh langsung:
`HandleInertiaRequests::accountNotice()` (`app/Http/Middleware/HandleInertiaRequests.php:74-108`)
mengecek kelengkapan data guru/pembimbing dan mengembalikan string peringatan
lewat `auth.accountNotice`, dirender di `resources/js/layouts/app-layout.tsx:71-76`
sebagai banner kuning tepat di bawah `AppTopbar` — bukan modal, bukan badge
lonceng terpisah.

## 3. Cakupan field "data diri" yang bisa diedit siswa

Menyalin field profil dari `student-form.tsx` (`resources/js/components/students/student-form.tsx:424-609`),
dipilah dua kelompok:

| Kelompok | Field | Siapa yang mengisi |
|---|---|---|
| **Akun login** (siswa boleh ubah sendiri) | Nama, Email, Password | Sudah ada polanya di `profile/edit.tsx` — dipakai ulang |
| **Data diri** (siswa lengkapi sendiri) | NIS, Tempat lahir, Tanggal lahir, Jenis kelamin, Golongan darah, Foto, Alamat | **Baru** — sasaran fase ini |
| **Penempatan institusional** (tetap milik admin/kaprog) | Jurusan, Kelas, Industri, Status PKL, Periode PKL, Orang tua/wali | **Tidak** dibuka ke siswa — ini keputusan operator sekolah, bukan data yang siswa laporkan sendiri |

Baris ketiga penting: membuka kelas/industri/status PKL ke siswa akan
memungkinkan siswa memindahkan dirinya sendiri ke industri manapun atau
mengklaim status "selesai" — itu keputusan administratif, tetap lewat
`StudentController`/`PlacementController`.

## 4. Definisi "profil belum lengkap"

Siswa dianggap **belum lengkap** bila salah satu dari field data diri wajib
berikut masih `null`: `nis`, `placeOfBirth`, `dateOfBirth`, `gender`,
`alamat`. (`bloodType` dan `image` **tidak** dihitung — golongan darah dan
foto genuinely opsional, bukan sekadar "belum sempat diisi".)

Logika ini ditaruh sebagai satu method, bukan diduplikasi di controller dan
middleware:

```php
// app/Models/Student.php
/**
 * Profil dianggap lengkap bila seluruh data diri wajib sudah terisi.
 * bloodType & image sengaja tidak dihitung — keduanya opsional murni.
 */
public function hasCompleteProfile(): bool
{
    return $this->nis !== null
        && $this->placeOfBirth !== null
        && $this->dateOfBirth !== null
        && $this->gender !== null
        && $this->alamat !== null;
}
```

## 5. Rencana implementasi

### 5.1 Backend — `ProfileController`

`edit()` menyertakan data siswa (bila ada) + fields data diri; `update()`
dipecah menjadi dua form terpisah di frontend tapi bisa tetap satu route
tambahan (`profile.student.update`) supaya validasinya berbeda dari
info-akun dan tidak menimpa `ProfileUpdateRequest` yang sudah dipakai halaman
lain.

```php
// ProfileController::edit()
$student = $user->hasRole('siswa') ? $user->students : null; // relasi sudah ada di User (dipakai ScopesStudentsByRole)

return Inertia::render('profile/edit', [
    'profile' => ['name' => $user->name, 'email' => $user->email],
    'student' => $student ? [
        'nis' => $student->nis,
        'placeOfBirth' => $student->placeOfBirth,
        'dateOfBirth' => $student->dateOfBirth?->toDateString(),
        'gender' => $student->gender,
        'bloodType' => $student->bloodType,
        'alamat' => $student->alamat,
        'image' => $student->image,
        'complete' => $student->hasCompleteProfile(),
    ] : null,
]);
```

Endpoint baru `PATCH /profile/data-diri` → `ProfileController::updateStudentProfile()`,
memakai request baru `UpdateStudentProfileRequest` yang **hanya** membolehkan
field data diri (whitelist eksplisit — jangan terima `class_id`/`industri_id`
dari body walau divalidasi, supaya tidak ada celah mass-assignment ke field
institusional):

```php
public function rules(): array
{
    return [
        'nis' => ['nullable', 'string', 'max:255'],
        'placeOfBirth' => ['nullable', 'string', 'max:255'],
        'dateOfBirth' => ['nullable', 'date'],
        'gender' => ['nullable', Rule::in(['L', 'P'])],
        'bloodType' => ['nullable', Rule::in(['A', 'B', 'AB', 'O'])],
        'alamat' => ['nullable', 'string'],
        'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
    ];
}
```

Controller mengambil `$request->user()->students` (bukan route-model-binding
dengan id dari URL) — siswa hanya bisa mengedit profilnya sendiri, tidak ada
parameter id yang bisa ditebak/diganti.

```php
public function updateStudentProfile(UpdateStudentProfileRequest $request): RedirectResponse
{
    $student = $request->user()->students;
    abort_unless($student !== null, 404);

    $data = $request->validated();

    if ($request->hasFile('image')) {
        // ikuti pola penyimpanan foto yang sudah dipakai StudentController::store/update
        $data['image'] = $request->file('image')->store('students', 'public');
    }

    $student->update($data);

    return back()->with('success', 'Data diri berhasil diperbarui.');
}
```

Cek pola upload foto persis di `StudentController` (nama disk, path) sebelum
menulis ulang — jangan sampai dua konvensi penyimpanan foto berbeda untuk
baris `students` yang sama.

### 5.2 Route

```php
// routes/web.php, di dalam grup auth
Route::patch('profile/data-diri', [ProfileController::class, 'updateStudentProfile'])
    ->name('profile.student.update');
```

Regenerasi Wayfinder otomatis lewat `npm run dev`/`build`.

### 5.3 Peringatan navbar — perluas `accountNotice()`, jangan bikin mekanisme baru

```php
// HandleInertiaRequests::accountNotice(), tambahkan blok baru sejajar guru/pembimbing
if ($user->hasRole('siswa')) {
    $student = $user->students;

    if ($student !== null && ! $student->hasCompleteProfile()) {
        $notices[] = 'Lengkapi data diri Anda (NIS, tempat & tanggal lahir, jenis kelamin, alamat) di halaman Profil agar rapor dan sertifikat PKL Anda tercetak dengan benar.';
    }
}
```

Tidak perlu sentuh `AppTopbar` atau `app-layout.tsx` sama sekali — banner
`auth.accountNotice` sudah dirender di sana untuk semua peran. "Khusus
murid" otomatis terpenuhi karena kondisi `hasRole('siswa')` di atas; siswa
lain (guru/pembimbing/dst) tidak memicu blok ini.

Pertimbangkan menambahkan link langsung ke `/profile` di dalam pesan
(banner lain murni teks) — cek apakah `auth.accountNotice` di frontend
dirender sebagai plain string atau bisa disisipi `<Link>`; kalau string
polos, cukup arahkan lewat teks ("buka menu Profil di pojok kanan atas")
tanpa mengubah tipe datanya untuk satu kasus ini.

### 5.4 Frontend — `profile/edit.tsx`

Tambah kartu ketiga **"Data diri"** (icon `IdCard` dari lucide-react),
tampil **hanya** kalau `student !== null` (guru/pembimbing/dll tidak melihat
kartu ini sama sekali):

- Reuse `Field`, `SubmitButton`, `inputClass` yang sudah ada di file ini.
- Untuk gender, contoh pola `Select` dari `resources/js/components/students/student-form.tsx:459-468`.
- Untuk foto, contoh pola input file dari `student-form.tsx:480-492`.
- **Tidak ada `required`** pada field ini — profil ini memang boleh dicicil,
  sejalan dengan keputusan skema di §2.
- Kalau `student.complete === false`, tampilkan badge kecil "Belum lengkap"
  di header kartu (selain banner navbar) — penguatan visual di titik yang
  sama dengan form-nya, bukan pengganti banner.

## 6. Berkas yang disentuh

```
app/Models/Student.php                                  + hasCompleteProfile()
app/Http/Controllers/ProfileController.php               + updateStudentProfile()
app/Http/Requests/UpdateStudentProfileRequest.php         baru
app/Http/Middleware/HandleInertiaRequests.php             accountNotice() + blok siswa
routes/web.php                                            + route profile.student.update
resources/js/pages/profile/edit.tsx                       + kartu "Data diri"
```

**Nol migrasi** — kolomnya sudah nullable.

## 7. Test

`tests/Feature/StudentSelfProfileTest.php`:

```
test_siswa_bisa_melengkapi_data_diri_sendiri()
    → login sebagai siswa → PATCH profile.student.update dengan data lengkap
    → assertDatabaseHas('students', [...])

test_siswa_tidak_bisa_mengubah_data_diri_siswa_lain()
    → controller memakai $request->user()->students, bukan route binding
    → pastikan tidak ada parameter id yang bisa dimanipulasi (test ini
      pada dasarnya mengunci bahwa route TIDAK menerima {student} di URL)

test_siswa_tidak_bisa_mengubah_field_institusional_lewat_endpoint_ini()
    → POST menyertakan class_id/industri_id/status_pkl ekstra di body
    → assertDatabaseMissing perubahan pada field tsb (whitelist request menahannya)

test_accountNotice_muncul_untuk_siswa_dengan_profil_kosong_dan_hilang_setelah_lengkap()
    → assertSee / assert prop accountNotice tidak null saat kosong,
      null setelah semua field wajib terisi
```

## 8. Ekspektasi output

**Sebelum:** admin membuat siswa hanya dengan nama+email (sudah bisa sejak
migrasi nullable), tapi siswa tidak punya cara melengkapi NIS/tempat
lahir/dll sendiri — hanya admin yang bisa lewat modul Data Siswa.

**Sesudah:** siswa login → banner kuning muncul di semua halaman kalau
profilnya kosong → buka Profil → kartu "Data diri" → isi → simpan → banner
hilang. Admin tetap bisa melengkapi/mengoreksi lewat modul Data Siswa seperti
biasa (dua jalur menulis kolom yang sama, tidak ada duplikasi skema).

## 9. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Siswa mengubah field institusional lewat endpoint ini | Request khusus dengan whitelist eksplisit; tidak reuse `UpdateStudentRequest` milik admin |
| Siswa mengedit profil siswa lain | Ambil siswa dari `$request->user()`, bukan route model binding berbasis id URL |
| Banner navbar salah tampil ke peran lain | Kondisi `hasRole('siswa')` + `$user->students !== null`, sejajar pola guru/pembimbing yang sudah ada |
| Konvensi penyimpanan foto menyimpang dari yang dipakai `StudentController` | Verifikasi disk/path yang dipakai `StudentController::store/update` sebelum menulis `updateStudentProfile()`, jangan menebak |
