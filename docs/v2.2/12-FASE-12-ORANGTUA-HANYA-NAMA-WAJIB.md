# Fase 12 — Form Orang Tua: Hanya Nama yang Wajib

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** sedang ·
**Perkiraan:** ~2-3 jam

## 1. Permintaan

> "Modul Orang tua di bagian tambah orang tua, bintang merah cukup di bagian
> input nama saja."

Dikonfirmasi user: **literal** — email dan password ikut jadi opsional,
karena "prioritas mengisi data/akun orang tua itu terendah". Ini melangkah
lebih jauh dari Fase 9 (`docs/v2.1/09-...md`), yang secara sadar
mempertahankan email/password wajib karena dianggap kredensial akun. Fase
ini membalik keputusan itu atas konfirmasi eksplisit.

## 2. Kondisi sekarang

- `StoreParentRequest.php:26-28` — `nama`, `email`, `password` semua `required`.
- `parents.user_id` (`database/migrations/2025_01_01_000007_create_parents_table.php:21`)
  adalah **foreign key NOT NULL** ke `users` — setiap baris `parents` *harus*
  punya akun `User`. `ParentController::store()` (baris 105-131) selalu
  membuat `User::create()` dulu di dalam transaksi, baru `Parents::create()`
  dengan `user_id` dari situ.
- `resources/js/components/parents/parent-form.tsx` — `Field` menandai
  asterisk lewat prop `required`; saat ini true untuk Nama (149-154), Email
  (164-169), dan Kata sandi/Konfirmasi (230-235, 274-278, hanya saat create).

Konsekuensi teknis: kalau email/password benar-benar opsional, tidak selalu
ada `User` untuk dibuat. Ini **bukan** sekadar hapus `required` dari
`FormRequest` — kalau `email`/`password` kosong tapi kode tetap memaksa
`User::create()`, akan gagal di constraint NOT NULL kolom `users.email`/
`users.password` duluan.

## 3. Keputusan implementasi

### 3.1 `parents.user_id` jadi nullable

Orang tua boleh ada tanpa akun login. Kalau nanti mau dilengkapi akun (edit),
`user_id` diisi belakangan.

### 3.2 Aturan pembuatan akun `User`

- Email & password **berpasangan**: kalau salah satu diisi, keduanya wajib
  (pakai `required_with` di Form Request) — tidak masuk akal ada email tanpa
  password atau sebaliknya.
- Kalau keduanya kosong → `Parents::create()` saja, `user_id = null`, tidak
  ada `User` dibuat, tidak ada role `orangtua` di-assign.
- Kalau keduanya diisi → alur sekarang (buat `User`, assign role, isi `user_id`).

### 3.3 Dampak ke fitur lain yang bergantung pada `parents.user_id`

Harus ditelusuri saat implementasi — grep `parents.user_id`/`$parent->user_id`/
relasi `Parents::belongsTo(User)` di seluruh codebase (dashboard orang tua,
approval, notifikasi, login). Kemungkinan area yang perlu guard tambahan:
- Halaman/menu yang mengasumsikan setiap `Parents` bisa login — perlu badge
  "belum ada akun" di `parents/index.tsx`, mirip pola `accountNotice` yang
  sudah ada di `AppLayout` untuk guru/pembimbing tanpa industri.
- Import orang tua (`app/Imports/ParentImport.php`) — cek apakah baris impor
  tanpa email/password saat ini ditolak; kalau ya, perilakunya perlu selaras
  (opsional juga di jalur impor, atau didokumentasikan sebagai beda jalur
  yang sengaja tetap wajib email untuk impor massal — **konfirmasi ke user**
  kalau ambigu, jangan ditebak).

## 4. Rencana implementasi

### 4.1 Migrasi

```php
// database/migrations/xxxx_make_parents_user_id_nullable.php
Schema::table('parents', function (Blueprint $table): void {
    $table->foreignId('user_id')->nullable()->change();
});
```

### 4.2 Form Request

```php
// StoreParentRequest
'nama' => ['required', 'string', 'max:255'],
'email' => ['nullable', 'required_with:password', 'string', 'email', 'max:255', ...$this->emailDomainRule(), Rule::unique('users', 'email')],
'password' => ['nullable', 'required_with:email', 'confirmed', Password::defaults()],
```

`UpdateParentRequest` mengikuti pola yang sama, plus pengecualian unique
email untuk baris sendiri (`Rule::unique(...)->ignore($parent->users?->id)`,
konsisten dengan pola update yang sudah ada di controller ini).

### 4.3 Controller — `ParentController::store()`/`update()`

```php
DB::transaction(function () use ($data): void {
    $userId = null;

    if (!empty($data['email']) && !empty($data['password'])) {
        $user = User::create([
            'name' => $data['nama'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);
        $user->assignRole('orangtua');
        $userId = $user->id;
    }

    Parents::create([
        'user_id' => $userId,
        'nama' => $data['nama'],
        ...
    ]);
});
```

`update()` butuh penanganan tambahan: orang tua yang awalnya tanpa akun lalu
dilengkapi email/password saat edit → buat `User` baru saat itu. Detail
percabangan ini dirinci saat implementasi, bukan ditebak di sini.

### 4.4 Frontend — `parent-form.tsx`

Hapus `required` dari `Field`+`EmailInput` (168-173) dan dari field password
(230-235, 274-278) di jalur create. Nama (149-154) tetap satu-satunya
`required`.

## 5. Berkas yang disentuh

```
database/migrations/xxxx_make_parents_user_id_nullable.php   baru
app/Http/Requests/StoreParentRequest.php                      email/password → nullable+required_with
app/Http/Requests/UpdateParentRequest.php                     idem
app/Http/Controllers/ParentController.php                     store/update: User dibuat kondisional
resources/js/components/parents/parent-form.tsx               hapus required dari email & password
resources/js/pages/parents/index.tsx                          (opsional) badge "belum ada akun" bila user_id null
```

## 6. Test

`tests/Feature/ParentAccountOptionalTest.php`:

```
test_orang_tua_bisa_dibuat_hanya_dengan_nama()
    → POST parents.store hanya nama
    → assertDatabaseHas('parents', ['nama' => ..., 'user_id' => null])
    → assertDatabaseMissing('users', ['email' => ...])

test_email_tanpa_password_ditolak()
    → POST dengan email terisi, password kosong → validation error

test_orang_tua_dengan_email_password_tetap_membuat_akun()
    → POST lengkap → assertDatabaseHas('users', [...]), role 'orangtua' ter-assign
```

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Fitur lain (dashboard/approval/notifikasi orang tua) mengasumsikan `user_id` selalu ada, patah diam-diam (null pointer) | Grep menyeluruh sebelum merge (§3.3), bukan hanya area yang jelas terlihat |
| Import orang tua (`ParentImport.php`) punya aturan wajib email yang berbeda dari form manual, membingungkan operator | Ditelusuri & diselaraskan atau didokumentasikan eksplisit sebagai beda jalur, dikonfirmasi ke user bila ambigu |
| Orang tua tanpa akun tidak pernah bisa login sampai di-edit ulang oleh admin | Di luar cakupan fase ini — mengikuti keputusan eksplisit user bahwa ini prioritas rendah, bukan bug |
