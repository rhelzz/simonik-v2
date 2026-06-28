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

### 5. App shell + Dashboard — UI
- **Desain** (referensi dashboard Hireism + skill frontend-design): kanvas lavender `#ECECFB`, kartu putih, primary indigo `#4F5BD5`, font **Plus Jakarta Sans** (typeface Indonesia). Token desain di `resources/css/app.css`.
- **Layout** (`resources/js/layouts/app-layout.tsx`): sidebar putih rounded + drawer mobile, topbar (search/notif), konten di kanvas lavender.
- **Sidebar role-aware** (`components/app-sidebar.tsx` + `lib/nav.ts`): menu difilter `auth.roles`; fitur yang belum dibangun tampil "Soon" (disabled). Hanya Dashboard yang aktif (via Wayfinder).
- **Dashboard** (`pages/dashboard.tsx` + `DashboardController`): hero greeting (waktu + nama), 5 stat card (siswa, PKL berjalan, industri, guru, pembimbing), tabel siswa terbaru.
- **Ikon**: `lucide-react`. **Catatan**: belum ada login → `auth.user` null & roles kosong (shell jatuh ke mode demo, menu penuh). Tombol logout masih placeholder.
- ✅ ESLint + tsc + Prettier + `vite build` lolos; route `/dashboard` 200; Pint + PHPStan lolos.

### 6. Auth pages & flow
- **Login/logout** (`AuthenticatedSessionController` + `LoginRequest` dengan throttle 5x): `GET/POST /login` (guest), `POST /logout` (auth). `/dashboard` kini di-protect `auth`.
- **Redirect**: setelah login → `intended(dashboard)`; logout → `/`; guest buka `/dashboard` → `/login`.
- **Role middleware**: alias Spatie `role` / `permission` / `role_or_permission` didaftarkan di `bootstrap/app.php` (siap dipakai mis. `->middleware('role:admin')`).
- **UI** (`pages/auth/login.tsx` + `layouts/auth-layout.tsx`): kartu login on-brand (lavender/indigo), `<Form>` Inertia + Wayfinder action, error & throttle tampil, ada hint akun demo. Tombol logout di sidebar **aktif**.
- ✅ Feature test `tests/Feature/Auth` (6 test) hijau; **`composer test` penuh: Pint + PHPStan 0 error + 8 test passed**.

### 7. Vertical slice — CRUD Siswa
- **Backend**: `StudentController` resourceful (`index/create/store/edit/update/destroy`, tanpa `show`) + `StoreStudentRequest`/`UpdateStudentRequest`. `store` membuat **akun User (role siswa) + profil siswa** dalam satu transaksi; `update` sinkron akun + ganti foto; `destroy` hapus user (cascade ke siswa). Index: search (nama/NIS) + filter kelas + pagination 10.
- **Routes**: `Route::resource('students')` di-gate `role:admin|kaprog|guru|pembimbing`.
- **UI**: `pages/students/{index,create,edit}.tsx` + komponen `StudentForm` (akun, data diri, foto, PKL & penempatan). Flash sukses via `HandleInertiaRequests` + banner di `app-layout`. Menu **Siswa** aktif di sidebar.
- **Seeder**: `DemoDataSeeder` (2 jurusan, 4 kelas, guru, 3 industri, 1 periode, 12 siswa). `migrate:fresh --seed` → data langsung terisi.
- **Fix penting**: relasi `belongsTo` bernama jamak (`users()`) butuh FK eksplisit `user_id` (Laravel menebak `users_id`); diperbaiki di semua model + `SidangScore::aspect()` (`sidang_aspect_id`). Migration baru: `students.image` jadi nullable.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 14 test passed** (6 CRUD siswa). ESLint + tsc + Prettier + `vite build` lolos.

### 8. Master data — CRUD Jurusan & Kelas
- **Backend**: `DepartemenController` & `ClassController` (`index/store/update/destroy`) + `DepartemenRequest`/`ClassRequest`. Slug otomatis & unik (`uniqueSlug`); nama jurusan unik. **Guard hapus**: jurusan dgn kelas/siswa, atau kelas dgn siswa, tidak bisa dihapus (flash error) — karena FK kita cascade/not-null (beda legacy yang null-kan).
- **Routes**: `Route::resource(...)->only([index,store,update,destroy])` di-gate `role:admin|kaprog`.
- **UI**: `pages/{departemens,classes}/index.tsx` pakai pola **modal** (tambah/edit di satu halaman) + komponen reusable `components/ui/modal.tsx` & `components/ui/pagination.tsx`. Flash **error** kini juga tampil di `app-layout`. Menu **Jurusan** & **Kelas** aktif.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 29 test passed** (+15 Jurusan/Kelas). ESLint + tsc + Prettier + `vite build` lolos.

### 9. Modul Industri — CRUD Industri (tempat PKL)
- **Backend**: `IndustryController` resourceful (`index/create/store/edit/update/destroy`, tanpa `show`) + `StoreIndustryRequest`/`UpdateIndustryRequest`. `store` membuat **akun User (role `mitra`) + profil industri** dalam satu transaksi; `update` sinkron akun (name/email) + profil; `destroy` hapus user (cascade ke industri). **Guard hapus**: industri yang masih jadi tempat PKL siswa tidak bisa dihapus (flash error) — karena `students.industri_id` cascade, hapus tanpa guard ikut menghapus siswa. Index: search nama + `withCount('students')` + pagination 10.
- **Keputusan**: role akun industri = **`mitra`** (sesuai deskripsi "punya akun mitra"). `pembimbing_id` **opsional** (dropdown pembimbing yang ada; nullable) krn modul Pembimbing belum dibangun — disiapkan untuk diisi setelahnya.
- **Routes**: `Route::resource('industries')->except('show')` di-gate `role:admin|kaprog|guru|pembimbing`.
- **UI**: `pages/industries/{index,create,edit}.tsx` + komponen `IndustryForm` (3 seksi: akun mitra, profil industri + lat/long, pembimbing industri/sekolah). Pola **page-based** persis Siswa. Menu **Industri** aktif di sidebar.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 37 test passed** (+8 Industri). ESLint + tsc + Prettier + `vite build` lolos.

### 10. Modul Guru (Teacher) & Pembimbing — CRUD pembimbing
- **Backend**: `TeacherController` & `PembimbingController` (`index/store/update/destroy`, tanpa create/edit/show) + `Store/UpdateTeacherRequest` & `Store/UpdatePembimbingRequest`. `store` membuat **akun User (role `guru` / `pembimbing`) + profil** dalam satu transaksi; `update` sinkron akun (name/email) + profil; `destroy` hapus user (cascade). **Guard hapus**: Guru yg masih membimbing siswa (`students.teacher_id`) ditolak; Pembimbing yg masih terkait industri (`industries.pembimbing_id`) ditolak.
- **Temuan penting**: tabel `students` **tidak punya** kolom `pembimbing_id` (hanya `industries` yg punya) → relasi `Pembimbing::students()` mati/dead. Controller Pembimbing TIDAK memakainya: pakai `withCount('industry')` & guard via `industry()` saja. (Guru aman: `students.teacher_id` ada.)
- **Routes**: `Route::resource('teachers'|'pembimbings')->only([index,store,update,destroy])` di-gate `role:admin|kaprog`.
- **UI**: `pages/teachers/index.tsx` & `pages/pembimbings/index.tsx` pola **modal-based** (entitas kecil) — modal mendukung pembuatan akun (field password hanya saat tambah; saat edit disembunyikan). Pakai komponen reusable `Modal` & `Pagination`. Menu **Guru** & **Pembimbing** aktif.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 51 test passed** (+14 Guru/Pembimbing). ESLint + tsc + Prettier + `vite build` lolos.

### 11. Modul Kegiatan (jurnal harian) — CRUD siswa + monitoring staf + verifikasi
- **Editor rich-text**: `description` jurnal pakai editor Word-like (**Tiptap** `@tiptap/react` + `starter-kit`): bold/italic/strike/heading/list/blockquote/undo. Konten disimpan sebagai **HTML**. Migration baru `2025_01_02_000001_change_activities_description_to_text` menaikkan kolom `activities.description` dari VARCHAR(255) → **TEXT**.
- **Keamanan**: HTML jurnal **disanitasi saat render** dengan **DOMPurify** (komponen `components/ui/rich-text.tsx` → `RichText`), dipakai di semua surface yang menampilkan jurnal siswa lain (anti stored-XSS). Editor: `components/ui/rich-text-editor.tsx`.
- **Siswa (CRUD jurnal sendiri)**: `ActivityController` (`index/create/store/edit/update/destroy`, tanpa show) gate `role:siswa`, **scoped `user_id = auth`** + `ensureOwner()` (403 kalau bukan miliknya) + Store/UpdateActivityRequest (judul, date, start/end_time `H:i`, description HTML, tools, image opsional). UI page-based (`pages/activities/*` + `ActivityForm` pakai `useForm`; PUT+file via `_method` spoof + `forceFormData`). Menu **Jurnal Saya** (siswa).
- **Staf (monitoring + verifikasi)**: `ActivityMonitorController` (`index/show/verify`) gate `role:admin|kaprog|guru|pembimbing|industri|mitra`. **Role-scoped** (`scopedQuery`): admin/kaprog = semua; guru = siswa yg dia bimbing (`students.teacher_id`); pembimbing = siswa di industri yg dia bimbing (`industries.pembimbing_id`); industri/mitra = siswa di industrinya (`industries.user_id`). **Verifikasi** (set kolom `verified` '0'/'1') gate `role:pembimbing|industri|mitra` + cek scope. UI `pages/activity-monitor/{index,show}`. Menu **Kegiatan** (staf).
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 67 test passed** (+16 Kegiatan). ESLint + tsc + Prettier + `vite build` lolos.

---

## 📍 Current step
Modul transaksional pertama jalan: **Kegiatan/jurnal** — siswa menulis jurnal harian (rich-text), staf memantau & memverifikasi (role-scoped). Master data penempatan lengkap (Siswa, Jurusan, Kelas, Industri, Guru, Pembimbing). Pola baru yang kini tersedia: **rich-text editor (Tiptap) + render aman (DOMPurify)**, **monitoring role-scoped**, **verifikasi**.

Sisa "Soon": Absensi, Jadwal, Kunjungan, Bimbingan, Penilaian, Sidang, Sertifikat, Pengaturan.

---

## ⏭️ Next step — opsi terbaik

1. **Absensi (monitoring) (Rekomendasi)** — Lengkapi modul harian: rekap kehadiran siswa untuk staf (foto, geolokasi, jam masuk/pulang, status Masuk/Pulang/Sakit/Izin, verifikasi). Pembuatan absensi tetap di mobile (kamera/GPS); web fokus monitoring + verifikasi. Pola `ActivityMonitorController` bisa dipakai ulang.
2. **Halaman profil/ganti password + landing** — Pengaturan akun & ganti splash Laravel dengan landing SIMONIK.
3. **Master data sisa** — Periode PKL & Orang tua/Wali (saat ini hanya terisi via seeder; belum ada UI CRUD).
