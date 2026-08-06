# Fase 4 — Seragamkan Email ke `@simonik.local` (Masalah UAT #5)

**Status:** ✅ **SELESAI** · **Prioritas:** P1 · **Risiko regresi:** rendah
(tinggi bila data lama diubah — lihat §8) · **Perkiraan:** ~3 jam
**Prasyarat:** Fase 2 (alur pembuatan akun sudah dipusatkan di `accountFor()`).

> **Hasil implementasi** — lihat [§9](#9-hasil-implementasi).

---

## 1. Masalah

> "Untuk email akun, bisa nggak semuanya pakai `@simonik.local`? Biar nggak
> banyak varian yang bikin gampang lupa."

## 2. Kondisi sekarang

Tidak ada konvensi terpusat. Yang beredar di codebase:

| Sumber | Domain |
|--------|--------|
| `AdminSeeder.php`, `StarterSeeder.php` | `@simonik.local` |
| `DemoUserSeeder.php`, `DemoDataSeeder.php` | `@simonik.test` |
| Baris contoh template impor siswa | `budi@contoh.sch.id` |
| Input operator di form create | apa saja |

Validasi hanya `['required','email','max:255', Rule::unique('users','email')]`
— tidak ada batasan domain. Konsekuensinya persis seperti keluhan: operator
mengetik email dengan gaya berbeda tiap kali, lalu tidak ingat mana yang dipakai
— dan ini juga yang memperparah Masalah #2 (akun kembar dengan email karangan).

## 3. Opsi solusi

### Opsi A — Username saja + domain otomatis di UI ✅ **DIPILIH**

Field email di semua form staf/siswa diganti menjadi **input username** dengan
sufiks domain tetap yang tampil sebagai teks mati di sebelah kanan input:

```
Email  [ rasyad.helza        ] @simonik.local
```

Operator hanya mengetik bagian kirinya. Backend menyusun email lengkap.

| Pro | Kontra |
|-----|--------|
| Mustahil salah domain — bukan diperingatkan, tapi dicegah | Perlu menyentuh semua form akun |
| Hemat ketikan, langsung memenuhi permintaan | Tidak bisa dipakai untuk akun ber-email asli (lihat mitigasi) |
| Backend tetap menyimpan email lengkap → nol perubahan pada `Auth::attempt` | — |

### Opsi B — Validasi saja (`ends_with:@simonik.local`)

| Pro | Kontra |
|-----|--------|
| Diff sangat kecil | Operator tetap mengetik domain penuh setiap kali → tetap rawan typo |
| — | Menolak input setelah diketik = pengalaman yang menjengkelkan |

⚠️ Tidak dipilih sendirian, **tapi tetap dipasang** sebagai jaring pengaman
lapisan kedua (§4.2) — batas kepercayaan tidak boleh mengandalkan UI saja.

### Opsi C — Email dibangkitkan penuh dari nama (`slug(nama)@simonik.local`)

| Pro | Kontra |
|-----|--------|
| Nol ketikan | Nama kembar → tabrakan; butuh sufiks angka yang justru bikin lupa (`budi2@…`) |
| — | Operator kehilangan kendali atas kredensial yang harus ia komunikasikan |

❌ Ditolak sebagai perilaku wajib. **Dipakai sebagai saran otomatis**: field
username terisi otomatis dari nama saat mengetik, dan tetap bisa disunting.
Itu memberi manfaatnya tanpa kerugiannya.

### Opsi D — Migrasi paksa semua email lama ke domain baru

❌ Ditolak. Mengubah email = mengubah kredensial login setiap pengguna aktif
secara diam-diam. Lihat §8.

## 4. Rencana implementasi

### 4.1 Satu konstanta, satu helper

`app/Support/ImportDefaults.php` sudah memegang `PASSWORD`; tambahkan
domainnya di sana — jangan bikin kelas baru.

```php
final class ImportDefaults
{
    public const PASSWORD = 'password';

    /** Domain baku untuk seluruh akun yang dibuat dari dalam aplikasi. */
    public const EMAIL_DOMAIN = 'simonik.local';

    /** Susun email dari username; input yang sudah lengkap dibiarkan apa adanya. */
    public static function email(string $username): string
    {
        $username = mb_strtolower(trim($username));

        return str_contains($username, '@')
            ? $username
            : $username.'@'.self::EMAIL_DOMAIN;
    }
}
```

Toleransi `str_contains('@')` disengaja: berkas impor lama yang sudah berisi
email lengkap tetap bekerja, dan operator yang refleks mengetik domain tidak
mendapat `budi@simonik.local@simonik.local`.

> Domain sengaja **tidak** ditaruh di `config/` untuk sekarang. Ia tidak pernah
> berubah antar-environment, dan `env()` untuk nilai yang tidak pernah berubah
> adalah konfigurasi spekulatif. Pindahkan ke `config/simonik.php` pada hari
> ada sekolah kedua dengan domain berbeda — bukan sebelumnya.

### 4.2 Validasi sebagai jaring pengaman

Di Form Request pembuatan akun (setelah perubahan Fase 2):

```php
protected function prepareForValidation(): void
{
    if ($this->filled('email')) {
        $this->merge(['email' => ImportDefaults::email($this->string('email')->value())]);
    }
}

// rules()
'email' => ['required_without:user_id', 'email', 'max:255',
            'ends_with:@'.ImportDefaults::EMAIL_DOMAIN,
            Rule::unique('users', 'email')],
```

Normalisasi di `prepareForValidation()` berarti `ends_with` praktis tidak
pernah gagal untuk input UI normal — ia hanya menangkap request yang
menyimpang (POST langsung, skrip, bug frontend). Itu memang tugasnya.

**Pengecualian yang harus dipikirkan sekarang, bukan nanti:** `google_id` ada
di kolom `users`, artinya login Google mungkin dipakai/direncanakan. Akun
Google **tidak akan** ber-domain `@simonik.local`. Karena itu aturan
`ends_with` hanya dipasang pada **pembuatan akun dari dalam aplikasi**
(form + impor), bukan pada `ProfileUpdateRequest` maupun jalur OAuth.
Cek `routes/web.php` dan `ProfileController` sebelum memasang aturannya.

### 4.3 Impor

`ImportsRows::makeUser()` sudah jadi satu-satunya tempat impor membuat akun —
cukup jalankan email lewat `ImportDefaults::email()` di sana, dan kolom `Email`
di template boleh diisi username saja.

Perbarui `ImportTemplates`: teks petunjuk kolom Email menjadi
`'Boleh diisi username saja, mis. "rasyad.helza" → otomatis menjadi rasyad.helza@simonik.local.'`,
dan baris contoh `budi@contoh.sch.id` diganti (baris contoh sendiri sudah
dipindah ke sheet Petunjuk oleh Fase 1).

### 4.4 Frontend

Satu komponen kecil, dipakai semua form akun:

```
resources/js/components/ui/email-input.tsx
```

Input teks + sufiks `@simonik.local` sebagai `<span>` di dalam bingkai input
(`aria-hidden`, dengan `aria-describedby` pada input yang menjelaskan domainnya
supaya screen reader tetap mendengar informasinya). Menyimpan username saja ke
state form; backend yang menyusun.

Saran otomatis dari nama (Opsi C sebagai default lunak): saat field nama diisi
dan username masih kosong, isi dengan `slug(nama, '.')`. Berhenti menyarankan
begitu operator menyunting field-nya sendiri.

### 4.5 Rapikan seeder

Ganti `@simonik.test` di `DemoUserSeeder` dan `DemoDataSeeder` menjadi
`ImportDefaults::EMAIL_DOMAIN`. Ini murni kebersihan, tapi murah dan
menghilangkan varian kedua dari sumbernya.

## 5. Data lama

**Jangan sentuh.** Akun yang sudah ada tetap dengan emailnya sekarang.
Konvensi baru berlaku untuk akun **baru**.

Kalau memang perlu dirapikan, sediakan command sekali-jalan yang **melapor
dulu**:

```
php artisan simonik:normalize-emails --dry-run    # cetak daftar perubahan
php artisan simonik:normalize-emails              # eksekusi
```

Syarat wajib sebelum dijalankan di produksi: backup DB, dan daftar perubahan
sudah dikirim ke pemilik akun. Mengganti email = mengganti username login.

## 6. Berkas yang disentuh

```
app/Support/ImportDefaults.php                   + EMAIL_DOMAIN, email()
app/Support/ImportTemplates.php                  teks petunjuk kolom Email
app/Imports/Concerns/ImportsRows.php             makeUser() → ImportDefaults::email()
app/Http/Requests/Store*Request.php              prepareForValidation() + ends_with
resources/js/components/ui/email-input.tsx       BARU
resources/js/pages/*/create.tsx, edit.tsx        pakai EmailInput
database/seeders/Demo*Seeder.php                 .test → .local
docs/UI-PATTERNS.md                              + pola EmailInput
```

## 7. Test

`tests/Feature/EmailDomainTest.php`:

```
test_username_dilengkapi_domain_otomatis()
    → POST teachers.store dengan email 'rasyad.helza'
    → assertDatabaseHas('users', ['email' => 'rasyad.helza@simonik.local'])

test_email_lengkap_tidak_diduplikasi_domainnya()
    → input 'budi@simonik.local' → tersimpan apa adanya

test_domain_lain_ditolak()
    → input 'budi@gmail.com' → 422

test_impor_menerima_username_saja()
    → baris impor kolom Email = 'siti.aminah' → akun ber-@simonik.local
```

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| **Mengubah email lama = mengunci pengguna dari akunnya** | Data lama tidak disentuh; command normalisasi opsional, `--dry-run` dulu, backup wajib |
| `@simonik.local` bukan domain yang bisa menerima email sungguhan → reset kata sandi via email mustahil | **Sudah menjadi kondisi hari ini** (`admin@simonik.local` di seeder). Konsekuensinya: reset kata sandi harus lewat admin, bukan email. Pastikan halaman lupa-kata-sandi tidak menjanjikan hal yang tidak bisa ia lakukan — periksa `PasswordController` dan alur `forgot-password` pada fase ini |
| Login Google (`users.google_id`) tidak akan ber-domain lokal | `ends_with` hanya dipasang di jalur pembuatan akun internal, bukan OAuth/profil |
| Sufiks domain di UI menutupi teks pada input sempit | Sufiks di luar area ketik, input `min-w-0`, uji di 360px |
| Tabrakan username saat saran otomatis dipakai | Saran boleh disunting; `Rule::unique` tetap menangkap tabrakan dengan pesan jelas |


---

## 9. Hasil implementasi

`composer ci:check` hijau: Pint, PHPStan 0 error, **378/378 test lulus**
(+6 dari `EmailDomainTest`), eslint + prettier + `tsc` lolos. Nol migrasi.

### Yang dikerjakan

- **`ImportDefaults::EMAIL_DOMAIN` + `ImportDefaults::email()`** — satu tempat
  yang menyusun email dari username. Nilai yang sudah memuat `@` dibiarkan apa
  adanya, jadi berkas impor lama berisi email lengkap tetap jalan dan operator
  yang refleks mengetik domain tidak menghasilkan domain ganda.
- **`NormalizesEmailDomain`** (trait form request) menormalkan input di
  `prepareForValidation()`. Dipakai 11 request: 4 form jabatan (lewat
  `ValidatesRoleAccount`), siswa, orang tua, 6 form ubah, dan profil.
- **Aturan `ends_with` hanya pada form *tambah***, bukan form ubah maupun
  profil — persis seperti rencana §4.2. Akun lama berdomain apa pun tetap bisa
  disunting; menolak emailnya saat disunting sama dengan mengganti kredensial
  login orang tanpa diminta. Dikunci test
  `test_akun_lama_berdomain_lain_tetap_bisa_disunting`.
- **Impor menormalkan di titik baca**, bukan di `makeUser()` — supaya validasi
  `isEmail()` melihat alamat yang sudah lengkap. Kolom `Email` di template kini
  boleh diisi username saja.
- **`EmailInput`** menampilkan `@simonik.local` sebagai sufiks mati di samping
  kolom isian; operator hanya mengetik username. Bila nilainya sudah memuat
  `@` (akun lama), sufiksnya disembunyikan dan teks utuhnya ditampilkan.
  Dipasang di 6 form master data — **tidak** di halaman login (harus menerima
  email apa pun) dan tidak di profil.
- **Seeder demo** tidak lagi memakai `@simonik.test`; varian domain kedua
  hilang dari sumbernya.
- **Test lama disesuaikan**: 9 berkas test memakai domain sekolah/contoh
  (`@sekolah.sch.id`, `@simonik.test`, …) yang kini ditolak pada pembuatan akun.
  Ini konsekuensi perubahan yang memang diminta, bukan bug.

### Yang tidak jadi masalah

§8 mengkhawatirkan reset kata sandi lewat email menjadi mustahil karena
`@simonik.local` bukan domain sungguhan. Diperiksa: **aplikasi ini memang tidak
punya alur lupa-kata-sandi** — hanya `PUT /password` untuk pengguna yang sudah
masuk. Tidak ada janji yang perlu dicabut. Login Google (`users.google_id`) juga
belum punya rute apa pun, jadi tidak ada jalur OAuth yang terganggu.

### Catatan temuan sampingan

Saat menjalankan test muncul `Call to a member function all() on array` dari
`Illuminate\Testing\TestResponseAssert`. Penyebabnya `config/session.php`
memakai `serialization => 'json'`, sehingga `errors` di session kembali sebagai
array. **Artefak harness, bukan bug aplikasi**: hanya muncul saat sebuah
assertion sudah gagal pada response redirect. Alur asli (POST gagal validasi →
GET form) diverifikasi tetap 200. Tidak diubah apa pun untuk ini.

### Belum dikerjakan

- **Command `simonik:normalize-emails`** (§5) untuk merapikan email lama.
  Sengaja belum dibuat: mengubah email = mengubah kredensial login. Buat hanya
  bila sekolah memang memintanya, dengan `--dry-run` dan backup.
- **Verifikasi manual di browser.**
