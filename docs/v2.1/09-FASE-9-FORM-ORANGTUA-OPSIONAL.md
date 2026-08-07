# Fase 9 — Form Orang Tua: Hapus Wajib, Ganti Jenis Kelamin → Ayah/Ibu

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** rendah–sedang ·
**Perkiraan:** ~2 jam

## 1. Permintaan

> "Pada Modul Form input orang tua, hilangkan semua bintang merah/required.
> Kemudian input Jenis kelamin diganti dengan Ayah/Ibu."

## 2. Kondisi sekarang

### 2.1 Semua field wajib

`StoreParentRequest` dan `UpdateParentRequest`
(`app/Http/Requests/StoreParentRequest.php`, `UpdateParentRequest.php`)
mewajibkan **semuanya**: `nama`, `email`, `password`, `gender`, `alamat`,
`occupation`, `phoneNumber`. Frontend `resources/js/components/parents/parent-form.tsx`
menandai tiap field itu dengan `required` di komponen `Field`
(baris 153, 161, 168, 173, 178-179, 194, 202, 209, 217, 225, dst — pola
sama seperti `Field` di `profile/edit.tsx`, cek asterisk lewat prop `required`).

### 2.2 Kolom `gender` dipakai label "Laki-laki/Perempuan" di 4 tempat

Nilainya tetap `L`/`P` di database (kolom yang sama dipakai `students` dan
`pembimbings` — **jangan** direname/diberi kolom baru khusus parents, itu
menciptakan skema paralel untuk konsep yang sama). Yang perlu berubah cuma
**label tampilannya**, dari "Laki-laki/Perempuan" jadi "Ayah/Ibu":

| Lokasi | Baris | Isi sekarang |
|---|---|---|
| `resources/js/components/parents/parent-form.tsx` | 135-138 | `genderOptions` form: `{L: 'Laki-laki', P: 'Perempuan'}` |
| `resources/js/pages/parents/index.tsx` | 92-96 | `genderOptions` filter tabel: sama |
| `app/Http/Controllers/ParentController.php` | 74-77 (index), + store/edit/update sekitar 121/145/169 | `match (...) { 'male','m','l' => 'Laki-laki', 'female','f','p' => 'Perempuan' }` |
| `app/Exports/ParentExport.php` | 46-50 | `match ($parent->gender) { 'L' => 'Laki-laki', 'P' => 'Perempuan' }` |

`app/Imports/ParentImport.php:41-58` mem-parsing kolom `jenis_kelamin` dari
Excel lewat helper `gender()` bersama (dipakai juga `StudentsImport`,
`PembimbingImport`) yang menerima alias L/P/male/female. **Ini tidak perlu
diubah** — operator masih boleh mengetik "L"/"Laki-laki" di template Excel;
yang berubah hanya tampilan di UI aplikasi. Kalau mau template Excel-nya juga
memakai kata "Ayah"/"Ibu", itu perubahan terpisah di `ImportTemplates::parent()`
+ helper `gender()` bersama — **di luar cakupan fase ini** karena helper itu
dipakai 3 importer sekaligus dan menambah alias "ayah"/"ibu" ke situ berisiko
bentrok dengan makna "L/P" untuk siswa & pembimbing yang tidak relevan
konteks keluarga.

## 3. Keputusan yang perlu disepakati dulu

### 3.1 Field mana yang benar-benar jadi opsional di backend?

"Hilangkan bintang merah" secara harfiah hanya soal UI (asterisk). Tapi
membiarkan asterisk hilang sementara backend masih menolak submit kosong
(`required` di Form Request) akan terasa seperti bug — pengguna melihat form
"opsional" tapi tetap diblokir validasi. Fase ini memperlakukan permintaan
sebagai **UI + validasi sekaligus**, dengan satu pengecualian:

| Field | Jadi opsional? | Alasan |
|---|---|---|
| Nama, Email, Password | **Tetap wajib** | Ini kredensial akun login (`User::create`) — sistem otentikasi tidak bisa membuat akun tanpa email/password. Menghapus asterisk di sini akan menyesatkan, bukan menyederhanakan |
| Gender (Ayah/Ibu), Alamat, Pekerjaan, No. HP | **Jadi opsional** (`nullable`) | Ini "data diri", sama persis dengan keputusan yang sudah diambil untuk siswa di migrasi `2026_08_04_210000_make_student_profile_fields_nullable.php` — pola yang identik, tinggal diikuti |

Ini konsisten dengan Fase 7: siswa juga hanya wajib nama+email saat dibuat,
sisanya menyusul. Kalau operator sekolah memang maunya *literal* semua field
termasuk akun login tanpa asterisk (dan backend menerima create tanpa
email/password sama sekali), itu perubahan arsitektur berbeda (akun
opsional untuk orang tua) — **konfirmasi ke user sebelum implementasi** kalau
ternyata itu yang dimaksud, karena akan butuh menangani kasus "orang tua
tanpa akun login" di seluruh alur (approval, notifikasi, dashboard orang tua).

### 3.2 Data lama yang sudah punya nilai `gender` L/P

Tidak ada migrasi data yang diperlukan — nilai `L`/`P` di kolom tetap
valid, cuma dibaca ulang sebagai "Ayah"/"Ibu" alih-alih "Laki-laki"/"Perempuan".
Ini murni relabeling, bukan migrasi skema.

## 4. Rencana implementasi

### 4.1 Migrasi — kolom nullable

```php
// database/migrations/xxxx_make_parent_profile_fields_nullable.php
Schema::table('parents', function (Blueprint $table): void {
    $table->string('gender')->nullable()->change();
    $table->text('alamat')->nullable()->change();
    $table->string('occupation')->nullable()->change();
    $table->string('phoneNumber')->nullable()->change();
});
```

Forward-only, mengikuti aturan `CLAUDE.md` — jangan edit migrasi lama yang
membuat tabel `parents`.

### 4.2 Form Request

```php
// StoreParentRequest & UpdateParentRequest
'nama' => ['required', 'string', 'max:255'],       // tidak berubah
'email' => [...],                                   // tidak berubah
'password' => [...],                                 // tidak berubah

'gender' => ['nullable', Rule::in(['L', 'P'])],
'alamat' => ['nullable', 'string'],
'occupation' => ['nullable', 'string', 'max:255'],
'phoneNumber' => ['nullable', 'string', 'max:50'],
```

### 4.3 Frontend — `parent-form.tsx`

- Hapus prop `required` dari `Field` untuk gender/alamat/occupation/phoneNumber
  (baris 178-179, 202, 217, 225, dan pasangan `required` pada `<input>`/`<Select>`
  di baris-baris sesudahnya — cek satu per satu, jangan `replace_all` buta
  karena `required` juga menempel di field akun login yang **tetap** wajib).
- Ganti `genderOptions` (baris 135-138):

  ```tsx
  const genderOptions: SelectOption[] = [
      { value: 'L', label: 'Ayah' },
      { value: 'P', label: 'Ibu' },
  ];
  ```

  Pertimbangkan juga label field itu sendiri — cek baris di sekitar 178
  apakah labelnya "Jenis kelamin"; kalau begitu ganti jadi "Ayah/Ibu" atau
  "Wali" supaya konsisten dengan opsinya (pilihan katanya dikonfirmasi saat
  implementasi, bukan ditebak di sini).

### 4.4 Frontend — `parents/index.tsx` (filter tabel)

```tsx
const genderOptions: SelectOption[] = [
    { value: '', label: 'Semua' },
    { value: 'L', label: 'Ayah' },
    { value: 'P', label: 'Ibu' },
];
```

### 4.5 Backend — label tampilan tabel & export

`ParentController::index()` (baris 74-77) dan tempat serupa di store/edit/update:

```php
'gender' => match (strtolower($parent->gender ?? '')) {
    'male', 'm', 'l' => 'Ayah',
    'female', 'f', 'p' => 'Ibu',
    default => null,
},
```

`ParentExport.php:46-50`:

```php
match ($parent->gender) {
    'L' => 'Ayah',
    'P' => 'Ibu',
    default => $parent->gender,
},
```

### 4.6 Yang sengaja TIDAK disentuh

- `app/Imports/ParentImport.php` — parsing tetap terima L/P/Laki-laki/Perempuan
  dari Excel (lihat §3, keputusan cakupan).
- `ImportTemplates::parent()` — contoh nilai di template Excel tidak diubah
  pada fase ini.
- Kolom `gender` di tabel `parents` **tidak** direname — nilainya tetap
  `L`/`P`, konsisten dengan `students`/`pembimbings` yang berbagi konvensi
  yang sama.

## 5. Berkas yang disentuh

```
database/migrations/xxxx_make_parent_profile_fields_nullable.php   baru
app/Http/Requests/StoreParentRequest.php                            gender/alamat/occupation/phoneNumber → nullable
app/Http/Requests/UpdateParentRequest.php                            idem
app/Http/Controllers/ParentController.php                            label gender → Ayah/Ibu (index + store/edit/update)
app/Exports/ParentExport.php                                         label gender → Ayah/Ibu
resources/js/components/parents/parent-form.tsx                      hapus required + genderOptions Ayah/Ibu
resources/js/pages/parents/index.tsx                                 genderOptions filter → Ayah/Ibu
```

## 6. Test

`tests/Feature/ParentFormOptionalTest.php`:

```
test_orang_tua_bisa_dibuat_tanpa_data_diri()
    → POST parents.store hanya nama+email+password
    → assertDatabaseHas('parents', ['gender' => null, 'alamat' => null, ...])

test_akun_login_tetap_wajib()
    → POST tanpa email/password → validation error tetap muncul

test_label_gender_ayah_ibu_tampil_di_index()
    → seed parent gender='L' → assertSee('Ayah') di response index
    → seed parent gender='P' → assertSee('Ibu')

test_export_orang_tua_memakai_label_ayah_ibu()
    → assert isi export map() menghasilkan 'Ayah'/'Ibu', bukan 'Laki-laki'/'Perempuan'
```

## 7. Ekspektasi output

**Sebelum:** operator tidak bisa menyimpan data orang tua kalau salah satu
dari 7 field kosong, meski beberapa (pekerjaan, no HP) kadang memang belum
diketahui saat pendaftaran awal. Dropdown gender berlabel Laki-laki/Perempuan
— generik, tidak menyebut peran keluarganya.

**Sesudah:** hanya akun login (nama/email/password) yang wajib; data diri
boleh dicicil seperti pola siswa di Fase 7. Dropdown & tabel menampilkan
Ayah/Ibu, lebih sesuai konteks modul "Orang Tua" dibanding label generik.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Asterisk dihapus tapi backend masih menolak submit kosong → terasa seperti bug | Form Request diubah bersamaan (§4.2), bukan cuma UI |
| Salah paham cakupan "hapus semua required" sampai ke akun login | Dipisah eksplisit di §3.1 — akun login tetap wajib karena keharusan teknis (autentikasi), dikonfirmasi dulu kalau ternyata dimaksud sebaliknya |
| Label "Ayah/Ibu" tapi importer Excel & template belum ikut berubah → operator bingung format impor | Didokumentasikan sebagai batas cakupan sadar di §2.1/§4.6, bukan diselundupkan sebagai "sudah beres" |
| Tempat lain di codebase yang menampilkan gender orang tua terlewat | Grep `parent->gender` sebelum merge untuk memastikan §4.5 mencakup semua lokasi, bukan hanya 4 yang teridentifikasi saat perencanaan |
