# Fase 25 — Guru pembimbing bisa mengubah info industri bimbingannya

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** sedang ·
**Migrasi:** tidak · **Perkiraan:** ~2-3 jam

## 1. Permintaan

> "Pada role guru pembimbing > modul data industri > page detail industri
> buatkan fitur button edit dan simpan, agar guru pembimbing dapat melakukan
> CRUD data pada bagian;
> `document.querySelector("#app > div > div.lg\\:pl-64 > div > main > div > section:nth-child(2)")`"

**Selektor itu menunjuk apa?** Di `resources/js/pages/industries/show.tsx`,
`main > div` (`space-y-5`) berisi:

| nth-child | Elemen | Isi |
|---|---|---|
| 1 | `<div>` header | tombol Kembali + tombol Edit (`can.manage`) |
| **2** | `<section>` (baris 198) | **"Informasi Industri"** — nama, bidang, alamat, jam masuk/pulang, durasi, guru, pembimbing |
| 3 | `<section>` (baris 247) | Titik & radius absensi (`CoordinateEditor`) |
| 4 | `<section>` (baris 268) | Daftar siswa magang |

Jadi: **seksi "Informasi Industri"**. Bukan koordinat (sudah bisa diubah guru),
bukan daftar siswa.

Kata "CRUD" di sini berarti **U** saja: guru mengubah profil industri yang sudah
ada. Membuat/menghapus industri tidak masuk akal untuk seorang guru pembimbing,
tidak diminta, dan sudah punya pemiliknya (admin/kaprog).

---

## 2. Kondisi sekarang

### 2.1 Guru bisa membuka halaman, tapi tidak bisa mengubah apa pun kecuali koordinat

`routes/web.php:265-269` — guru sudah punya akses `industries.index` dan
`industries.show`, dengan komentar yang menjelaskan kenapa:

> *"guru ikut melihat (dibatasi ke industri bimbingannya di controller) agar
> punya halaman untuk mengatur titik absensi. Membuat/mengubah/menghapus
> industri tetap admin & kaprog."*

`IndustryController::show()` mengirim (baris 165-168):

```php
'can' => [
    'manage' => $user->hasAnyRole(['admin', 'kaprog']),   // → guru: false
    'updateCoordinates' => $user->can('updateCoordinates', $industry),  // → guru: true
],
```

Cakupan sudah aman: `scopedIndustries()` (baris ~172) mengunci guru ke
`where('teacher_id', $user->teachers?->id)`, dan `show()` memanggil
`abort_unless(...)` di baris 130.

### 2.2 Pola yang **persis** diminta sudah ada — dua kali

| Pola | Berkas | Untuk siapa |
|---|---|---|
| Edit sebagian profil industri, tanpa relasi | `MyIndustryController::edit()/update()` + `UpdateMyIndustryRequest` | pembimbing industri |
| Edit sebagian data langsung di halaman detail (bukan halaman terpisah) | `CoordinateEditor` di `industries/show.tsx` | guru |
| Wewenang per-industri | `IndustryPolicy::updateCoordinates()` | 4 role |

Fase ini = **menggabungkan ketiga pola yang sudah ada**. Tidak ada mekanisme
baru sama sekali.

### 2.3 Temuan sampingan: `UpdateMyIndustryRequest` tertinggal dari Fase 11

`app/Http/Requests/UpdateMyIndustryRequest.php` masih mewajibkan koordinat:

```php
'longitude' => ['required', 'string', 'max:255'],
'latitude' => ['required', 'string', 'max:255'],
```

Padahal **Fase 11 (v2.2)** menjadikan koordinat industri opsional di 5 titik,
dan `UpdateIndustryRequest` sudah `nullable`. Akibatnya pembimbing industri
**tidak bisa menyimpan** profilnya kalau industrinya belum punya koordinat —
padahal industri tanpa koordinat kini sah dibuat.

Ini bug nyata, bukan bagian dari permintaan. **Perbaiki di fase ini** (satu kata
per baris) dan catat di `docs/PROGRESS.md` — fase ini menyentuh berkas
tetangganya, jadi ini titik biaya terendah untuk memperbaikinya. Tambahkan satu
test regresi.

---

## 3. Keputusan implementasi

### 3.1 Perluas `IndustryPolicy` dengan `updateProfile`, jangan longgarkan `can.manage`

**Ditolak:** `'manage' => $user->hasAnyRole(['admin','kaprog','guru'])`. Prop
`manage` mengendalikan tombol Edit yang menuju halaman edit **penuh** —
termasuk dropdown `teacher_id` dan `pembimbing_id`. Seorang guru akan bisa
memindahkan industri ke guru lain, atau melepas dirinya sendiri. Itu bukan yang
diminta.

**Dipilih:** kemampuan baru yang eksplisit, di policy yang sudah ada:

```php
/**
 * Ubah profil industri (nama, bidang, alamat, jam kerja) — bukan relasinya.
 */
public function updateProfile(User $user, Industry $industry): bool
{
    return $this->updateCoordinates($user, $industry);
}
```

Aturannya **identik** dengan `updateCoordinates`: admin, kaprog jurusan terkait,
guru pembimbing industri itu, pembimbing industri itu. Kalau seseorang sudah
boleh memindahkan titik absensi industri, ia boleh memperbaiki alamatnya.

Method terpisah (bukan memakai `updateCoordinates` langsung) karena namanya
harus menyatakan maksudnya di titik panggil, dan karena aturannya bisa berbeda
kelak. Satu baris hari ini; tidak ada duplikasi rumus.

### 3.2 Field yang boleh diubah = **profil saja**, relasi dikunci

Ambil daftarnya dari `UpdateMyIndustryRequest` yang sudah ada (§2.2) — ia sudah
menjawab pertanyaan "field mana yang aman diubah non-admin":

```
name, bidang, alamat, jam_masuk, jam_pulang, duration
```

**Dikeluarkan dari daftar:**

- `teacher_id`, `pembimbing_id` — relasi, wewenang admin/kaprog (§3.1).
- `latitude`, `longitude`, `radius` — **sudah** punya editornya sendiri
  (`CoordinateEditor`, seksi 3). Menaruhnya juga di seksi 2 berarti dua form
  mengubah kolom yang sama di satu halaman, dan yang disimpan belakangan menang
  secara diam-diam. Satu kolom, satu tempat pengubahan.

Karena daftarnya identik minus koordinat, **`UpdateIndustryProfileRequest`
dibuat sebagai kelas baru** dengan 6 aturan — bukan `extends
UpdateMyIndustryRequest`, agar perbaikan §2.3 dan fase ini tidak saling
mengikat.

### 3.3 Edit **inline** di seksi itu, bukan halaman edit terpisah

Permintaan menyebut "button edit dan simpan" **pada seksi itu** — bukan
"tombol yang membuka halaman edit". Dan `CoordinateEditor` tepat di bawahnya
sudah memakai pola inline yang sama persis.

Bentuknya:

- Mode baca (default) — tampilan `DetailItem` yang sudah ada, tidak berubah.
- Tombol **Edit** kecil di pojok kanan header seksi (`can.updateProfile`).
- Ditekan → field berubah jadi input; tombol jadi **Simpan** + **Batal**.
- Simpan → `router.patch(...)`, `preserveScroll: true`.

`preserveScroll` bukan kosmetik: tanpa itu, menyimpan seksi 2 melempar operator
ke atas halaman, dan pada halaman sepanjang ini terasa seperti aplikasi
me-reset.

Guru & pembimbing **tetap** tidak melihat tombol "Edit" besar di header halaman
(`can.manage` tidak berubah). Dua tombol edit dengan cakupan berbeda di satu
halaman perlu dibedakan dengan jelas — yang inline berlabel
**"Edit informasi"**, bukan "Edit".

### 3.4 Endpoint baru, sejajar dengan `updateCoordinates`

```php
Route::patch('industries/{industry}/profil', [IndustryController::class, 'updateProfile'])
    ->middleware('role:admin|kaprog|guru|pembimbing')
    ->name('industries.update-profile');
```

Middleware-nya menyalin baris `industries.update-coordinates` (baris 271-273)
— **dan sama seperti di sana, middleware bukan pengamannya.** Yang mengamankan
adalah `Gate::authorize('updateProfile', $industry)` per-industri di dalam
method. Middleware hanya menyaring role yang jelas tidak berkepentingan.

### 3.5 Pembimbing industri ikut kebagian — dan itu memang benar

Policy §3.1 mencakup `pembimbing`. Artinya pembimbing industri kini punya **dua
jalan** mengubah profil industrinya: halaman "Industri Saya"
(`my-industry/edit`) dan seksi inline ini — kalau ia membuka
`industries/show`… **yang tidak bisa ia buka** (rute `industries.show`
di-gate `role:admin|kaprog|guru`).

Jadi praktisnya tidak ada duplikasi jalur hari ini. **Jangan** menghapus
`MyIndustryController` untuk "menyatukan" — halaman itu punya pemakainya
sendiri dan menampilkan roster performa yang tidak ada di sini.

---

## 4. Rencana implementasi

1. **`app/Policies/IndustryPolicy.php`** — tambah `updateProfile()` (§3.1).
2. **`app/Http/Requests/UpdateIndustryProfileRequest.php`** (baru) — 6 aturan
   §3.2, `authorize(): true` (otorisasi di controller lewat `Gate`, pola yang
   sudah dipakai `UpdateIndustryCoordinatesRequest` — **periksa berkas itu dan
   ikuti persis**).
3. **`IndustryController::updateProfile()`** (baru):

   ```php
   public function updateProfile(UpdateIndustryProfileRequest $request, Industry $industry): RedirectResponse
   {
       Gate::authorize('updateProfile', $industry);

       $industry->update($request->validated());

       return back()->with('success', 'Informasi industri berhasil diperbarui.');
   }
   ```

   `$request->validated()`, bukan `$request->all()` (`CLAUDE.md`) — ini juga
   yang menjamin `teacher_id` yang diselundupkan lewat devtools tidak ikut
   tersimpan.
4. **`IndustryController::show()`** — tambah
   `'updateProfile' => $user->can('updateProfile', $industry)` ke array `can`.
5. **`routes/web.php`** — rute §3.4.
6. **`resources/js/pages/industries/show.tsx`** — ubah seksi 2 jadi bisa
   beralih mode (§3.3). Kalau blok itu tumbuh > ~120 baris, pindahkan ke
   `resources/js/components/industries/industry-profile-editor.tsx` — sejajar
   dengan `CoordinateEditor` yang juga komponen tersendiri di file yang sama.
7. **Perbaikan sampingan §2.3** — `UpdateMyIndustryRequest`: `latitude` &
   `longitude` → `nullable`.
8. `php artisan wayfinder:generate`.

---

## 5. Berkas yang disentuh

**Baru (2):**

```
app/Http/Requests/UpdateIndustryProfileRequest.php
tests/Feature/UpdateIndustryProfileTest.php
```

**Diubah (5):**

```
app/Policies/IndustryPolicy.php                  (+1 method)
app/Http/Controllers/IndustryController.php      (+1 method, +1 key can)
app/Http/Requests/UpdateMyIndustryRequest.php    (perbaikan §2.3)
routes/web.php                                   (+1 rute)
resources/js/pages/industries/show.tsx           (seksi 2 dapat diedit)
```

---

## 6. Test — `tests/Feature/UpdateIndustryProfileTest.php`

| Test | Yang dijaga |
|---|---|
| `test_guru_can_update_profile_of_own_industry` | happy path |
| `test_guru_cannot_update_profile_of_another_industry` | **keamanan** — 403 lewat policy, bukan cuma tombol yang disembunyikan |
| `test_profile_update_ignores_relation_fields` | **§3.2** — kirim `teacher_id` siswa lain di payload → `teacher_id` **tidak berubah** |
| `test_profile_update_does_not_touch_coordinates` | §3.2 — `latitude`/`longitude`/`radius` tetap sama setelah menyimpan profil |
| `test_admin_can_update_profile` | jalur admin tidak rusak |
| `test_siswa_cannot_update_profile` | 403 dari middleware |

**Regresi §2.3, di `tests/Feature/MyIndustryTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_pembimbing_can_update_profile_without_coordinates` | industri tanpa lat/long bisa disimpan (konsisten dengan Fase 11) |

Test ketiga dan keempat adalah inti fase ini. Menyembunyikan field di UI bukan
otorisasi — payload bisa ditulis tangan.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Guru bisa memindahkan industri ke guru lain | Merusak plotting & scoping seluruh siswa di industri itu | Relasi di luar `validated()` (§3.2) + test |
| `can.manage` dilonggarkan sebagai jalan pintas | Guru dapat halaman edit penuh | Ditolak eksplisit di §3.1 — kalau ada reviewer yang menyarankannya, tunjuk bagian ini |
| Dua form mengubah koordinat di satu halaman | Simpan terakhir menang diam-diam | Koordinat dikeluarkan dari form profil (§3.2) |
| Perubahan `jam_masuk` mengubah perhitungan `is_late` absen berikutnya | Kedisiplinan tercatat berbeda | **Perilaku yang benar** (jam kerja memang bisa berubah) — tapi `is_late` baris **lama** tidak dihitung ulang, dan itu juga benar. Cukup dipahami, tidak ada kode. |
| `preserveScroll` lupa dipasang | Terasa seperti aplikasi reset | Ikuti `CoordinateEditor` |

**Test lama yang harus tetap hijau:** `IndustryTest.php`,
`UpdateIndustryCoordinatesTest.php`, `MyIndustryTest.php`,
`PembimbingIndustryTest.php`, `PlacementTest.php`.
