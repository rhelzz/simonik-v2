# Fase 2 — Satu Orang, Satu Akun, Banyak Peran (Masalah UAT #2)

**Status:** ✅ **SELESAI** · **Prioritas:** P0 · **Risiko regresi:** sedang
(menyentuh alur autentikasi & navigasi) · **Perkiraan:** ~6 jam

> **Hasil & penyimpangan dari rencana** — lihat [§9](#9-hasil-implementasi).

---

## 1. Masalah

> "Ada akun bentrok. Saya kaprog, dan saya juga sebagai guru pembimbing. Itu
> bikin nggak bisa login. Akhirnya nama saya di kaprog dihapus, baru bisa login."

## 2. Akar masalah

Bukan bug autentikasi. `LoginRequest::authenticate()` polos
(`Auth::attempt(email, password)`) dan tidak menyaring peran sama sekali.

Masalahnya di **model data operasional**: setiap modul memperlakukan dirinya
sebagai pemilik identitas, dan selalu membuat baris `users` baru.

```php
// KaprogController::store()                      // TeacherController::store()
$user = User::create([...]);                      $user = User::create([...]);
$user->assignRole('kaprog');                      $user->assignRole('guru');
```

Sementara emailnya dikunci unik global:

```php
'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
```

Jadi seorang guru yang juga kaprog **tidak bisa** didaftarkan di modul Kaprog
dengan email aslinya — validasi menolak. Operator lalu mengarang email kedua,
dan orang itu berakhir dengan dua akun, dua kata sandi, dan tidak tahu mana
yang benar → "tidak bisa login".

Menghapus entri kaprog "menyembuhkan" gejalanya karena
`KaprogController::destroy()` menghapus **baris user**-nya, bukan mencabut
perannya — akun kembar yang membingungkan itu lenyap.

### Kabar baiknya

Fondasinya sudah benar dan **tidak perlu migrasi apa pun**:

- `User` sudah memakai `HasRoles` (Spatie) → many-to-many `model_has_roles`.
- Tidak ada `syncRoles()` di seluruh `app/` → memberi peran baru **tidak**
  mencabut peran lama.
- Route middleware sudah bersifat OR (`role:admin|kaprog|guru`) → user dua
  peran otomatis lolos semua gerbang yang relevan.

Yang salah cuma **alur create/destroy di controller** dan **urutan
pengecekan peran** di dua tempat.

## 3. Opsi solusi

### Opsi A — "Tautkan akun yang sudah ada" pada form create ✅ **DIPILIH**

Form tambah (Kaprog / Guru / Pembimbing / Wakasek) mendapat satu pilihan mode:

- **Akun baru** (default, perilaku sekarang) — nama, email, kata sandi.
- **Gunakan akun yang sudah ada** — cari user berdasarkan nama/email,
  pilih, lalu sistem cukup `assignRole()` + membuat baris profil.

| Pro | Kontra |
|-----|--------|
| Menyelesaikan akar masalah: satu identitas, banyak jabatan | Menambah percabangan di 4 form |
| Nol migrasi, nol perubahan skema | Operator harus paham kapan memilih mode mana → dimitigasi teks bantuan |
| Sejalan dengan cara Spatie memang dirancang | — |
| Sama dengan konvensi SIS mapan (guru merangkap wali kelas/kaprog tetap satu login) | — |

### Opsi B — Longgarkan `unique` email jadi unik-per-peran

❌ Ditolak. Email adalah **kunci login**. Dua baris `users` dengan email sama
membuat `Auth::attempt()` non-deterministik (mengambil baris pertama yang cocok)
— ini menukar bug yang terlihat dengan bug yang tidak terlihat. Berbahaya.

### Opsi C — Tabel `staff` terpisah dari `users`, dengan tabel jabatan

❌ Ditolak untuk batch ini. Benar secara arsitektur, tapi menuntut migrasi
besar pada tabel yang direferensikan oleh modul-modul USP yang sudah LTS
(`industries.teacher_id`, `industries.pembimbing_id`, `departemens.user_id`,
`approvals`, `visits`, …). Bayaran risikonya tidak sebanding dengan keluhan
yang sedang diselesaikan.

### Opsi D — Deteksi otomatis: kalau email sudah ada, tambahkan peran diam-diam

❌ Ditolak. Perilaku senyap pada operasi yang membuat kredensial adalah resep
untuk pembajakan akun tak sengaja (typo email = memberi peran kaprog ke orang
lain). Harus eksplisit dan terlihat.

## 4. Rencana implementasi

### 4.1 Backend: satu action bersama untuk "user untuk peran ini"

Empat controller melakukan hal yang persis sama. Ekstrak **satu** helper —
letakkan di `app/Http/Controllers/Concerns/` bersama trait yang sudah ada
(`HandlesImportExport`, `ScopesStudentsByRole`), bukan bikin direktori baru:

```php
// app/Http/Controllers/Concerns/ResolvesRoleAccount.php
trait ResolvesRoleAccount
{
    /**
     * Ambil user yang dipilih operator, atau buat akun baru — lalu pastikan
     * ia punya $role. Aditif: peran lain milik user tidak disentuh.
     *
     * @param  array{user_id?: int|null, name?: string, email?: string, password?: string}  $data
     */
    protected function accountFor(array $data, string $role): User
    {
        $user = isset($data['user_id'])
            ? User::findOrFail($data['user_id'])
            : User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);

        $user->assignRole($role);   // no-op bila sudah punya

        return $user;
    }
}
```

Empat `store()` menyusut jadi `$user = $this->accountFor($data, 'kaprog');`.

### 4.2 Form Request: `email` wajib hanya saat membuat akun baru

```php
// StoreKaprogRequest::rules()
'user_id'  => ['nullable', 'integer', 'exists:users,id'],
'name'     => ['required_without:user_id', 'string', 'max:255'],
'email'    => ['required_without:user_id', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
'password' => ['required_without:user_id', 'string', 'min:8'],
```

Tambahkan `after()` untuk aturan lintas-field yang tidak bisa dinyatakan
sebagai rule tunggal:

```php
public function after(): array
{
    return [function (Validator $v): void {
        $id = $this->integer('user_id');
        if ($id > 0 && User::find($id)?->hasRole('siswa')) {
            $v->errors()->add('user_id',
                'Akun siswa tidak dapat diberi peran kepegawaian.');
        }
    }];
}
```

> **Kombinasi peran yang dilarang** (dikunci di satu tempat, dipakai keempat
> Form Request): `siswa` dan `orangtua` tidak boleh digabung dengan peran
> kepegawaian mana pun, dan tidak boleh digabung satu sama lain. Alasannya
> nyata: `ScopesStudentsByRole` dan `DashboardController` memilih cakupan data
> berdasarkan peran — user `siswa`+`guru` akan melihat dirinya sendiri sebagai
> siswa bimbingan, dan `Approval::forUserQueue()` bisa memasukkan dirinya ke
> antrean persetujuannya sendiri. Kombinasi `guru`+`kaprog`+`pembimbing`+
> `wakasek` aman dan memang jadi tujuan fase ini.

### 4.3 Endpoint pencarian akun

Satu route, dipakai keempat form:

```php
// routes/web.php — dalam grup role:admin
Route::get('users/search', [UserSearchController::class, 'index'])->name('users.search');
```

Mengembalikan maksimal 10 user (id, nama, email, daftar peran) yang cocok
dengan `q`, **mengecualikan** user yang sudah punya peran yang dituju dan
yang berperan `siswa`/`orangtua`. Regenerasi Wayfinder setelahnya.

### 4.4 `destroy()`: cabut peran, jangan hapus akun

Ini bagian yang paling gampang salah. Perilaku baru untuk keempat modul:

```php
DB::transaction(function () use ($kaprog): void {
    Departemen::query()->where('user_id', $kaprog->id)->update(['user_id' => null]);
    $kaprog->removeRole('kaprog');

    // Akun tanpa peran tersisa tidak berguna → hapus sekalian.
    if ($kaprog->roles()->count() === 0) {
        $kaprog->delete();
    }
});
```

Pesan flash-nya harus jujur membedakan dua hasil:

- `"Peran kepala program dicabut. Akun <nama> tetap aktif sebagai Guru Pembimbing."`
- `"Kepala program berhasil dihapus."`

Untuk modul yang punya baris profil (`teachers`, `pembimbings`), baris profil
**ikut dihapus** saat perannya dicabut — tanpa peran itu, profilnya tidak
punya arti dan akan membuat `accountNotice()` menampilkan banner palsu.

### 4.5 Perbaiki urutan pengecekan peran (bug laten)

`DashboardController::__invoke()` memeriksa `guru`/`pembimbing` **sebelum**
`kaprog`/`wakasek`. Begitu peran ganda diizinkan, user `guru`+`kaprog` akan
**selalu** mendarat di dashboard staf dan tidak pernah bisa menjalankan
tugas kaprognya. Ini bug yang **diciptakan** oleh fase ini kalau tidak ikut
diperbaiki.

Keputusan: urutkan dari peran paling berwenang ke paling sempit —
`admin → wakasek → kaprog → guru/pembimbing → orangtua → siswa` — dan
tambahkan **pemilih peran aktif** minimal: kalau user punya >1 dashboard yang
relevan, tampilkan tautan "Lihat sebagai <peran>" di header dashboard yang
menyetel `?as=kaprog`.

> **Versi malas yang di-ship duluan:** cukup perbaiki urutannya + tautan
> `?as=` yang membaca satu query param. Tanpa penyimpanan preferensi, tanpa
> tabel, tanpa session state. Kalau ternyata operator sering bolak-balik,
> baru simpan pilihannya di session. Jangan bangun switcher penuh sekarang.

Hal yang sama berlaku untuk
`HandleInertiaRequests::accountNotice()`: dua blok `if` berurutan bisa
menghasilkan banner yang salah untuk user dua peran. Ubah agar mengumpulkan
peringatan **per peran yang dimiliki**, lalu tampilkan yang pertama relevan —
atau sederhananya, hormati peran aktif yang sama dengan dashboard.

Sidebar juga perlu diperiksa: item menu di layout digerakkan oleh
`auth.roles` (array), jadi user dua peran akan melihat gabungan menu. Itu
**perilaku yang diinginkan** dan tidak perlu diubah — cukup pastikan tidak ada
komponen yang mengasumsikan `roles[0]` sebagai "peran user".

### 4.6 Frontend

Empat form create mendapat satu blok yang sama. Bikin **satu** komponen
bersama karena benar-benar dipakai empat kali:

```
resources/js/components/account-picker.tsx
```

- Dua tombol mode (`Akun baru` / `Akun yang sudah ada`).
- Mode "sudah ada": input pencarian → daftar hasil (nama, email, chip peran
  yang dimiliki) → pilih → set `user_id` di form, sembunyikan field kredensial.
- Memakai `Select`/`Modal` dari `@/components/ui` sesuai
  [`docs/UI-PATTERNS.md`](../UI-PATTERNS.md). **Jangan** pakai `<select>` native.

Halaman index Kaprog/Guru/Pembimbing menampilkan chip peran lain yang dimiliki
tiap baris, supaya operator melihat rangkap jabatan tanpa membuka detail.

## 5. Berkas yang disentuh

```
app/Http/Controllers/Concerns/ResolvesRoleAccount.php   BARU
app/Http/Controllers/UserSearchController.php           BARU
app/Http/Controllers/{Kaprog,Teacher,Pembimbing,Wakasek}Controller.php  store() + destroy()
app/Http/Requests/Store{Kaprog,Teacher,Pembimbing,Wakasek}Request.php   rules() + after()
app/Http/Controllers/DashboardController.php            urutan peran + ?as=
app/Http/Middleware/HandleInertiaRequests.php           accountNotice() sadar multi-peran
routes/web.php                                          + users/search
resources/js/components/account-picker.tsx              BARU
resources/js/pages/{kaprogs,teachers,pembimbings,wakaseks}/create.tsx   pakai AccountPicker
resources/js/pages/{kaprogs,teachers,pembimbings}/index.tsx             chip peran
```

**Nol migrasi.**

## 6. Test

`tests/Feature/MultiRoleAccountTest.php`:

```
test_guru_dapat_ditambahkan_sebagai_kaprog_tanpa_akun_kedua()
    → buat guru, POST kaprogs.store dengan user_id guru tsb
    → assertDatabaseCount('users', 1)
    → user punya kedua peran ['guru','kaprog']

test_user_multi_peran_dapat_login_dan_membuka_dashboard()
    → login sebagai user guru+kaprog → 200, bukan redirect/500

test_mencabut_peran_kaprog_tidak_menghapus_akun_guru()
    → DELETE kaprogs.destroy
    → user masih ada, masih punya 'guru', tidak punya 'kaprog'

test_mencabut_peran_terakhir_menghapus_akun()
    → user hanya berperan kaprog → DELETE → user terhapus

test_akun_siswa_tidak_dapat_diberi_peran_kepegawaian()
    → POST dengan user_id siswa → 422
```

## 7. Ekspektasi output

**Sebelum:** satu orang dengan dua jabatan = dua akun, dua email, dua kata
sandi, dan kebingungan login yang berakhir dengan menghapus salah satu jabatan.

**Sesudah:**

- Admin membuka Data Kaprog → Tambah → "Gunakan akun yang sudah ada" → ketik
  nama guru → pilih → simpan. Orang tersebut kini kaprog **dan** guru
  pembimbing, dengan **satu** login yang sudah dia pakai selama ini.
- Login berfungsi tanpa perlu menghapus jabatan apa pun.
- Menghapus dari modul Kaprog hanya mencabut jabatan kaprog; akses guru
  pembimbing tetap utuh.
- Sidebar menampilkan gabungan menu kedua peran; dashboard bisa ditukar lewat
  "Lihat sebagai".
- Tabel Kaprog/Guru menunjukkan chip rangkap jabatan → operator tidak lagi
  membuat akun kembar karena tidak tahu orangnya sudah terdaftar.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Kombinasi peran yang tidak masuk akal (`siswa`+`guru`) merusak scoping data | Dilarang eksplisit di `after()` §4.2, dengan test |
| Data lama sudah terlanjur punya akun kembar | Buat command sekali-jalan `php artisan simonik:merge-accounts --dry-run` yang **melaporkan** kandidat kembar (nama sama, email beda) untuk ditinjau manual. **Jangan** menggabungkan otomatis — FK tersebar di modul LTS |
| `destroy()` yang berubah bisa menyisakan akun tanpa peran | Ditangani cabang `roles()->count() === 0`, dengan test |
| Komponen frontend yang mengasumsikan satu peran | Audit `grep -rn "roles\[0\]\|roles.includes" resources/js` sebelum merge |
| Pemilih peran aktif melebar jadi proyek sendiri | Batasi ke `?as=` query param; tidak ada persistensi sampai ada permintaan nyata |


---

## 9. Hasil implementasi

`composer ci:check` hijau: Pint, PHPStan 0 error, **372/372 test lulus**
(+11 dari `MultiRoleAccountTest`), eslint + prettier + `tsc` lolos.
**Nol migrasi**, sesuai rencana.

### Penyimpangan dari rencana

**1. Tidak ada `UserSearchController` maupun rute `users/search`.**
Rencana §4.3 memintanya, tapi endpoint JSON terpisah bertentangan dengan
prinsip proyek ini ("halaman adalah fungsi dari propnya"). Kandidat kini datang
sebagai prop `candidates` pada halaman `create`, disegarkan lewat **partial
reload** (`router.reload({ only: ['candidates'], data: { q } })`). Hasilnya:
satu rute lebih sedikit, tidak ada Wayfinder baru, dan otorisasinya otomatis
ikut rute halaman yang sudah ada.

**2. Konstanta peran tidak jadi tinggal di trait.** PHP tidak mengizinkan
konstanta trait diakses lewat nama trait-nya (`ResolvesRoleAccount::EXCLUSIVE_ROLES`
melempar `Error` saat runtime — tertangkap test, bukan di produksi). Dipindah
ke `App\Support\Roles` yang memang dipakai lintas lapisan (controller, form
request, pesan flash).

**3. Pemilih peran aktif memakai sidebar, bukan header dashboard.** Sidebar
sudah membaca `auth.roles` dan tampil di semua halaman, jadi tidak perlu
menyentuh enam halaman dashboard yang berbeda. Sesuai batasan rencana: hanya
`?as=` lewat query param, tanpa persistensi.

**4. `HandleInertiaRequests::accountNotice()` diubah seperlunya saja.**
Rencana menyebut "sadar peran aktif"; kenyataannya cukup mengumpulkan
peringatan **semua** jabatan alih-alih `return` pada yang pertama — pemegang
jabatan guru *dan* pembimbing yang keduanya belum tertaut industri kini melihat
kedua sebabnya, bukan satu.

### Bug laten yang ikut diperbaiki

`DashboardController` memeriksa `guru`/`pembimbing` **sebelum** `kaprog`, jadi
begitu peran ganda diizinkan, seorang guru yang juga kaprog akan **selalu**
mendarat di dashboard staf dan tidak pernah bisa membuka dashboard kaprognya.
Urutan kini dari kewenangan terluas ke tersempit (`ROLE_PRIORITY`), dikunci
test `test_dashboard_default_mengikuti_kewenangan_terluas`.

Sekalian: `app-sidebar.tsx` memakai `auth.roles[0]` sebagai label peran — satu
peran dipilih sembarang mengikuti urutan baris basis data. Kini menampilkan
semua jabatan. Audit `grep -rn "roles\[0\]" resources/js` tidak menemukan
pemakaian lain.

### Belum dikerjakan

- **Command `simonik:merge-accounts`** (§8) untuk melaporkan kandidat akun
  kembar yang sudah terlanjur ada di produksi. Belum dibuat — kerjakan bila
  memang ditemukan akun kembar di lapangan, jangan dibangun spekulatif.
- **Verifikasi manual di browser.** Jalur HTTP-nya sudah ditempuh test.
