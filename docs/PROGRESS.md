# PROGRESS — Migrasi SIMONIK ke Inertia Monolith

Dokumen hidup yang merekam posisi migrasi dari aplikasi lama (`backend/` Laravel API + `frontend/` React, deprecated) ke **simonik-v2** (Laravel 13 + Inertia v2 + React 19, auth session/guard `web`).

> Diperbarui setiap selesai commit/push. Konvensi commit: **1 folder berubah = 1 commit**, tanpa `Co-Authored-By`, push ke `main`.

---

## ✅ Sudah dikerjakan

### 1. Database migrations — `database/migrations/`
- 58 migration backend (banyak `add_/drop_/rename_`) dikonsolidasi jadi **26 migration `create_` murni** (forward-only).
- Auth pakai session → JWT/Sanctum/`personal_access_tokens` backend **tidak** diport.
- `students.class_id` jadi nama kolom resmi (memperbaiki bug `classes_id` di model lama).
- ✅ `php artisan migrate` sukses, urutan FK valid.

### 2. Models & relationships — `app/Models/`
- 25 model domain + `User` (tambah `google_id` & relasi). Gaya starter: atribut `#[Fillable]`, `casts()`, return type relasi eksplisit, PHPDoc `@property`.
- Nama method relasi backend dipertahankan agar controller yang diport tetap kompatibel.
- ✅ Pint + PHPStan lolos; semua relasi build SQL tanpa error.

### 3. Factories — `database/factories/`
- 25 factory dengan data faker realistis (data Indonesia) + FK auto via `Model::factory()`.
- `use HasFactory` dikembalikan ke tiap model dengan generic `/** @use HasFactory<XFactory> */`.
- ✅ Pint + PHPStan lolos; semua factory tervalidasi membuat baris valid.

### 4. Auth & Role foundation — `spatie/laravel-permission`
- Paket v8 (guard `web`), `config/permission.php` + migration permission ter-publish & migrate.
- `User` pakai `HasRoles`; `HandleInertiaRequests` share `auth.roles`.
- `RoleSeeder` (9 role: admin, kaprog, guru, pembimbing, siswa, orangtua, industri, mitra, kepala_sekolah) + `DemoUserSeeder` (1 user/role, `{role}@simonik.test` / `password`).
- ✅ `db:seed` sukses; Pint + PHPStan lolos.

---

## 📍 Current step
Fondasi data + auth selesai. Belum ada UI/alur aplikasi (controllers, Inertia pages, layout).

Akun demo untuk login dev: `admin@simonik.test` … `siswa@simonik.test` (password: `password`).

---

## ⏭️ Next step — opsi terbaik

1. **App shell (Rekomendasi)** — Layout utama + navigasi/sidebar per-role + halaman dashboard kosong. Memberi kerangka UI dan pola gating role (`usePage().props.auth.roles`) sebelum mengisi fitur.
2. **Vertical slice fitur pertama** — Satu fitur end-to-end (Controller + FormRequest + Inertia page React), mis. CRUD Students, sebagai pola yang direplikasi ke fitur lain.
3. **Seeder data demo penuh** — Isi semua tabel pakai factory yang ada supaya cepat ada data realistis untuk dilihat di UI/testing.
4. **Auth pages & flow** — Pastikan login/register/redirect-by-role berjalan (starter kit React auth), termasuk middleware `role:` pada route.
