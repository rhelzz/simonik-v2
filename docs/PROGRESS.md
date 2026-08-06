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

### 12. Modul Absensi (monitoring) — rekap kehadiran staf + verifikasi
- **Staf (monitoring + verifikasi)**: `AttendanceMonitorController` (`index/show/verify`) gate `role:admin|kaprog|guru|pembimbing|industri|mitra`. **Role-scoped** sama persis pola `ActivityMonitorController` (`scopedQuery`: admin/kaprog = semua; guru = `students.teacher_id`; pembimbing = `industries.pembimbing_id`; industri/mitra = `industries.user_id`). **Verifikasi** (set `attendances.verified` '0'/'1') gate `role:pembimbing|industri|mitra` + cek scope. Index: filter nama siswa + tanggal + **status** (opsi status diisi dari nilai distinct dalam scope); detail menampilkan **foto** (accessor `image` → URL), **geolokasi** (lat/long + link Google Maps), jam masuk/pulang, alasan, keterangan.
- **Tanpa input web**: pembuatan absensi tetap di mobile (butuh kamera/GPS); web fokus pantau + verifikasi (read-only + verify).
- **UI**: `pages/attendance-monitor/{index,show}` + helper `lib/attendance.ts` (badge & label status, case-insensitive: hadir/masuk/pulang/izin/sakit/alpha). Menu **Absensi** aktif (staf).
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 74 test passed** (+7 Absensi). ESLint + tsc + Prettier + `vite build` lolos.

### 13. Profil & ganti sandi + Landing SIMONIK
- **Landing**: route `/` kini menampilkan **landing SIMONIK** untuk tamu (hero + fitur + CTA Masuk) & redirect ke `/dashboard` untuk user login (closure `Auth::check()`). Mengganti redirect `/`→login sebelumnya dan splash Laravel (`pages/welcome.tsx` ditulis ulang on-brand). Logout (`redirect('/')`) kini mendarat di landing.
- **Profil (semua role)**: `ProfileController` (`edit`/`update`) + `ProfileUpdateRequest` (name, email unik-ignore-self) dan `PasswordController` (`update`: rule `current_password` + `Password::defaults()` + `confirmed`). Routes `GET/PATCH /profile`, `PUT /password` di grup `auth` (tanpa role gate — semua role). UI `pages/profile/edit.tsx` (2 kartu: info akun & ganti sandi) pakai `<Form>` Inertia. Kartu user di sidebar kini link ke profil.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 82 test passed** (+8: profil & landing). ESLint + tsc + Prettier + `vite build` lolos.

### 14. Tata ulang sidebar + roadmap baru
- **Keputusan**: aplikasi **web-only** (tak ada mobile) → siswa wajib bisa absen lewat web. Sistem "Bimbingan" **diganti Forum PKL** (tanya-jawab).
- **Sidebar (`lib/nav.ts`) ditata ulang** dengan item "Soon" baru: **Panduan PKL** (Utama), **Absen Foto + Geo** (siswa), **Forum PKL** (ganti Bimbingan), **Rekap Penilaian** (ganti "Penilaian"); **Profil** kini jadi menu (seksi **Akun**, aktif). Item lain tetap.
- **Dokumentasi jadi 2**: [`PROGRESS.md`](PROGRESS.md) (log selesai) + [`ROADMAP.md`](ROADMAP.md) (konteks + rencana/spec fitur). Spec fitur "Soon" lengkap ada di ROADMAP.
- ✅ ESLint + tsc + `vite build` lolos (perubahan nav only).

### 15. Revisi desain besar (master data & acuan semua role) — dokumentasi
- **Desain final dirombak & didokumentasikan di [`ROADMAP.md`](ROADMAP.md)** (kini jadi acuan utama): aktor/entitas + terminologi (Guru Pembimbing=`Teacher`/`guru`, Pembimbing Industri=`Pembimbing`/`pembimbing`, PT=`Industry`/`mitra`), **model data & relasi target** + delta vs skema (relasi **Industri↔Guru Pembimbing** belum ada; siswa↔pembimbing diturunkan via industri), **Dashboard analytical** (7 metrik + filter waktu), **menu admin** (Data User dropdown, Data Jurusan/Kelas, Panduan PKL, Data Absen/Jurnal **drill-down 4 layer** Jurusan→Kelas→Murid→detail, Rekap Penilaian, Sertifikat, Periode PKL; Forum & Kalender = Soon), **Rekap Penilaian** (master aspek teknis/non-teknis: field No+Kemampuan; nilai non-teknis oleh guru, teknis oleh pembimbing; grade A 80-100 / B 70-79 / C 60-69 / D 0-59), **Sertifikat** (template + anchor x/y), **Periode PKL**, dan **matriks hak akses semua role**.
- **Belum ada kode** untuk item baru — ini murni perencanaan. Implementasi mengikuti urutan rekomendasi di ROADMAP §11.

### 16. Rombak fondasi master data + penyempitan scope (admin) ✅
Penyempitan scope ke master-data admin + adaptasi relasi sesuai ROADMAP.
- **Skema (migration baru, forward-only)**: `industries` + `teacher_id` (guru pembimbing per-PT, nullOnDelete) & **buang** `industryMentorName/industryMentorNo`; `students` **buang** `teacher_id`. Guru & pembimbing siswa kini **diturunkan dari industrinya**.
- **Relasi model**: `Industry` → `teachers()` (belongsTo) + `pembimbingNormatif()` + `students()` (hasMany); `Teacher` → `industries()` (hasMany) + `students()` (hasManyThrough industri); `Pembimbing` → `industry()` (hasOne) + `students()` (hasManyThrough industri, sebelumnya mati); `Student` tak lagi punya `teachers()`.
- **Backend master data**: `IndustryController` (form pilih guru + pembimbing, index tampil guru/pembimbing/jumlah siswa), `StudentController` (form tak lagi pilih guru), `TeacherController` (jumlah PT + murid), `PembimbingController` (PT + murid), **baru** `ParentController` (CRUD + akun role `orangtua`, guard anak) & `PeriodController` (CRUD periode + validasi rentang tanggal). Semua master data di-gate **`role:admin|kaprog`**.
- **Hapus modul transaksional** (akan dibangun ulang nanti): Jurnal Saya (`ActivityController`), monitoring `ActivityMonitorController` & `AttendanceMonitorController` + request/page/test/`lib/attendance.ts`. Komponen reusable (rich-text editor, modal, pagination) disimpan.
- **Frontend**: sidebar baru sesuai desain admin — **dropdown "Data User"** (Siswa, Guru Pembimbing, Industri, Pembimbing Industri, Orang Tua), Data Jurusan/Kelas, Periode PKL, + grup Dokumen/Monitoring/Penilaian (Soon). `NavItem` dukung `children`; `app-sidebar` render dropdown. Halaman baru `pages/parents`, `pages/periods`.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 74 test passed**. ESLint + tsc + Prettier + `vite build` lolos. `migrate:fresh --seed` sukses.

### 17. Dashboard analytical ✅
- **`DashboardController`** kini analitik: **5 ringkasan kuantitatif** (jumlah siswa [archived=false], siswa aktif PKL [status `proses`], guru pembimbing, pembimbing industri, industri/PT) + **2 metrik partisipasi**:
  - **Rate Absensi** = % siswa aktif yang hadir (status `hadir`/`masuk`) — hari-siswa unik / (siswa aktif × hari efektif).
  - **Rate Pengisian Jurnal** = % siswa aktif yang mengisi jurnal — formula sama.
  - Tiap metrik dihitung untuk 4 rentang server-side (**hari ini / minggu ini / bulan ini / keseluruhan**); hari efektif: today=1, week=hari berjalan minggu ini, month=tanggal hari ini, all=jumlah tanggal distinct yang ada datanya. Capped 100%.
- **UI** `pages/dashboard.tsx`: kartu `RateCard` dengan **segmented filter** (toggle rentang, client-side) + progress bar. 5 stat card lama dipertahankan.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 77 test passed** (+3 Dashboard). ESLint + tsc + Prettier + `vite build` lolos.

### 18. Rekap Penilaian — master aspek (admin) + input nilai (guru/pembimbing) + lihat (semua cakupan)
- **Skema dirombak** (migration baru `2025_01_03_000001_rework_assessment_tables`, forward-only — drop+recreate kedua tabel legacy yang belum pernah dipakai di v2): `aspek_produktifs` kini **MASTER aspek** (`category` teknis/non_teknis, `no` urut, `kemampuan`) — bukan lagi baris skor per siswa; `evaluations` kini **SKOR per siswa per aspek** (`student_id`, `aspek_produktif_id`, `score` 0-100, **unique(student_id, aspek_produktif_id)**, FK cascade). Grade A/B/C/D **dihitung** dari skor (tidak disimpan).
- **Model**: `AspekProduktif` (fillable category/no/kemampuan, konstanta `CATEGORY_TEKNIS`/`CATEGORY_NON_TEKNIS`/`CATEGORIES`, relasi `evaluations()`); `Evaluation` (fillable student_id/aspek_produktif_id/score, relasi `students()`/`aspek()`, static **`gradeFor()`** A≥80/B≥70/C≥60/D + **`qualificationFor()`** Sangat baik/Baik/Cukup/Kurang). Relasi mati dibuang: `Student::produktif()`, `Industry::produktif()` & `Industry::evaluations()`. Factory & `EvaluationFactory`/`AspekProduktifFactory` (state `teknis()`/`nonTeknis()`) disesuaikan.
- **Master aspek (admin/kaprog)**: `AspectController` (`index/store/update/destroy`) + `AspectRequest` (category in CATEGORIES, no integer ≥1, kemampuan). UI modal `pages/aspects/index.tsx` (badge kategori, `withCount('evaluations')`). Gate `role:admin|kaprog`. Menu sidebar **Aspek Penilaian** (admin).
- **Rekap Penilaian (`AssessmentController`)**: `index` daftar siswa **role-scoped** (`scopedStudents`: admin/kaprog=semua; guru=siswa di PT yg diampu `industries.teacher_id`; pembimbing=`industries.pembimbing_id`; mitra/industri=`industries.user_id`; orangtua=`students.parent_id`; siswa=miliknya → **redirect** ke rekap sendiri) + `withAvg`/`withCount` ringkasan grade; `show(Student)` rekap aspek teknis+non-teknis dgn skor+grade+keterangan (abort 403 di luar scope); `update(Student)` upsert skor — **guru→non-teknis, pembimbing→teknis** (route `role:guru|pembimbing`, skor di luar kategori role diabaikan, nilai kosong menghapus). UI `pages/assessments/{index,show}.tsx` + helper `lib/grade.ts` (selaras backend; preview grade live saat input). Menu **Rekap Penilaian** kini aktif (STAFF + siswa + orangtua).
- **Seeder**: `DemoDataSeeder` menambah 10 aspek master (5 non-teknis + 5 teknis) + nilai contoh untuk 6 siswa pertama.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 97 test passed** (+20: AspectTest 8, AssessmentTest 12). ESLint + tsc + Prettier + `vite build` lolos. `migrate:fresh --seed` sukses.

### 19. Absen Foto + Geolokasi (siswa) — input kehadiran via web
- **Input absen web (role `siswa`)**: aplikasi web-only → siswa absen lewat browser. `AttendanceController` (gate `role:siswa`, semua dibatasi `user_id=auth`): `index` (status hari ini + riwayat paginate), `checkIn` (foto **wajib** + geolokasi lat/long, sekali/hari, status `hadir`, set `arrivalTime`), `checkOut` (lengkapi `departureTime` pada record hari ini; guard sudah masuk & belum pulang), `absence` (izin/sakit + `absenceReason`, lampiran opsional). Pakai kolom `attendances` lama (`arrivalTime`/`departureTime`/`image`/`latitude`/`longitude`/`status`/`absenceReason`/`verified`); `verified` tetap null (verifikasi = langkah Data Absen drill-down berikutnya).
- **FormRequest**: `CheckInRequest` (image required image/mimes/max 4096, latitude `between:-90,90`, longitude `between:-180,180`), `AbsenceRequest` (status in izin/sakit, absenceReason required). Foto disimpan ke disk `public` (`attendances/…`), accessor `Attendance::image` → URL.
- **Frontend**: `pages/attendance/index.tsx` (kartu status hari ini: belum absen → panel absen / sudah masuk → tombol pulang / izin-sakit → info; + riwayat). Komponen **`components/photo-capture.tsx`** (kamera langsung `getUserMedia`+canvas, fallback unggah berkas `capture="environment"`) & helper **`lib/attendance.ts`** (badge/label status, dibuat ulang). Geolokasi via `navigator.geolocation.getCurrentPosition`. Form pakai `useForm`+`forceFormData`. Menu **Absen Foto + Geo** (seksi "PKL Saya", roles `siswa`).
- **Seeder**: `DemoDataSeeder` menambah absen `hadir` 5 hari kerja terakhir untuk siswa status `proses` (today belum pulang/unverified) → rate dashboard & riwayat langsung terisi.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 107 test passed** (+10 AttendanceTest). ESLint + tsc + Prettier + `vite build` lolos. `migrate:fresh --seed` sukses; `storage:link` aktif.

### 20. Data Absen — monitoring drill-down 4 layer + verifikasi
- **Drill-down berjenjang** (`AttendanceMonitorController`, gate `role:admin|kaprog|guru|pembimbing|industri|mitra|orangtua`): **Layer 1** `index` (jurusan yg memuat siswa dalam cakupan + jumlah murid) → **Layer 2** `classes(Departemen)` (kelas dalam jurusan, abort 403 bila jurusan tak punya murid dalam cakupan) → **Layer 3** `students(Classes)` (murid + jumlah catatan absen & `pending_count` belum terverifikasi, search nama/NIS, paginate 10) → **Layer 4** `show(Student)` (seluruh absen paginate 15 + ringkasan hadir/izin/sakit/alpha + foto/geolokasi/jam). Setiap layer **role-scoped** sama persis Rekap Penilaian.
- **Scope di-DRY-kan**: logika `scopedStudents()` diekstrak ke **trait `App\Http\Controllers\Concerns\ScopesStudentsByRole`** (admin/kaprog=semua; guru=`industries.teacher_id`; pembimbing=`industries.pembimbing_id`; mitra/industri=`industries.user_id`; orangtua=`students.parent_id`; siswa=miliknya). `AssessmentController` **direfaktor** memakai trait yg sama (hapus duplikasi 3 method privat).
- **Verifikasi** `verify(Attendance)` (gate `role:pembimbing|industri|mitra` + cek scope via `user_id`): toggle kolom `attendances.verified` '0'↔'1', flash sukses. Tombol Verifikasi/Batalkan per-catatan di Layer 4 (hanya muncul utk `canVerify`).
- **Model**: relasi baru `Student::attendances()` = `hasMany(Attendance, 'user_id', 'user_id')` (tabel absen pakai `user_id`, bukan `student_id`).
- **Frontend**: `pages/attendance-monitor/{index,classes,students,show}.tsx` + komponen reusable **`components/ui/breadcrumb.tsx`** (jejak Jurusan→Kelas→Murid). Kartu jurusan/kelas, tabel murid (badge "n menunggu"), kartu detail absen (foto, link Google Maps, badge status, tombol verifikasi). Menu **Data Absen** kini **aktif** (STAFF + orangtua).
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 120 test passed** (+13 AttendanceMonitorTest). ESLint + tsc + Prettier + `vite build` lolos.

### 21. Jurnal harian (input siswa) + Data Jurnal monitoring drill-down
- **Jurnal siswa (CRUD sendiri)**: `ActivityController` (gate `role:siswa`, semua dibatasi `user_id=auth` + `ensureOwner()` 403) — `index/create/store/edit/update/destroy` (tanpa show), route `Route::resource('jurnal')` param `activity`, nama `activities.*`. Store/UpdateActivityRequest (judul, date, start/end_time `H:i` + `after`, description **HTML**, tools, image opsional 4MB). Foto disimpan disk `public` (`activities/…`), foto baru ganti lama.
- **Editor rich-text**: `description` pakai **Tiptap** (`RichTextEditor`, komponen lama dipakai ulang) — disubmit via hidden input ke `<Form>` Inertia. Render **disanitasi DOMPurify** (`RichText`) di daftar jurnal & monitoring (anti stored-XSS). UI `pages/activities/{index,create,edit}.tsx` + komponen `components/activities/activity-form.tsx`. Edit/Hapus hanya untuk jurnal **belum terverifikasi**. Menu **Jurnal Saya** (siswa, seksi PKL Saya).
- **Data Jurnal (staf, drill-down 4 layer)**: `JournalMonitorController` — pola **identik Data Absen**, reuse trait **`ScopesStudentsByRole`** + komponen **`Breadcrumb`**. Layer 1 jurusan → 2 kelas → 3 murid (jumlah jurnal + `pending_count`) → 4 daftar jurnal (RichText + foto + jam + tools). Verifikasi `verify(Activity)` toggle `activities.verified` '0'↔'1' (gate `role:pembimbing|industri|mitra` + cek scope). Relasi baru `Student::activities()` (`hasMany` via `user_id`). UI `pages/journal-monitor/{index,classes,students,show}.tsx`. Menu **Data Jurnal** kini **aktif** (STAFF + orangtua).
- **Dashboard**: rate pengisian jurnal kini **terisi riil** (DashboardController sudah menghitungnya sejak §17). **Seeder**: `DemoDataSeeder` menambah jurnal 5 hari kerja terakhir utk siswa `proses` (today unverified).
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 142 test passed** (+22: ActivityTest 12, JournalMonitorTest 10). ESLint + tsc + Prettier + `vite build` lolos. `migrate:fresh --seed` sukses.

### 22. Panduan PKL — CRUD dokumen (admin) + lihat/unduh (semua role)
- **Skema**: migration baru (forward-only) menambah `guides.judul` (string) + `guides.deskripsi` (text nullable) ke tabel lama yang cuma punya `user_id`+`dokumen`. Model `Guide` fillable diperluas; factory diisi judul/deskripsi.
- **Backend** (`GuideController`): `index` (semua role login — daftar panduan + flag `can.manage`), `store`/`update`/`destroy` **gate `role:admin|kaprog`**. `GuideRequest` (judul wajib, deskripsi opsional, **dokumen wajib saat tambah / opsional saat ubah**, mimes pdf/doc/docx/ppt/pptx/xls/xlsx maks 10 MB). Berkas di disk `public` (`guides/…`), foto/berkas lama dihapus saat diganti/hapus. `present()` mengekspos tipe (ekstensi) + ukuran human-readable + tanggal unggah; accessor `Guide::dokumen` → URL publik.
- **Routes**: `GET /panduan` (semua role, dalam grup `auth`), `POST/PUT/DELETE /panduan` di sub-grup `role:admin|kaprog`.
- **Frontend**: `pages/guides/index.tsx` — kartu dokumen (ikon + tipe/ukuran/tanggal + tombol "Buka / Unduh" `target=_blank`). Admin/kaprog melihat tombol **Tambah/Edit/Hapus** + modal unggah (`useForm` + `forceFormData`, PUT via `_method` spoof). Menu **Panduan PKL** kini **aktif** untuk **semua role** (seksi Dokumen & Forum). Tidak di-seed (admin unggah berkas riil; empty-state ramah).
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 153 test passed** (+11 GuideTest). ESLint + tsc + Prettier + `vite build` lolos. `migrate` sukses.

### 23. Sertifikat — CRUD template (anchor x/y) + output cetak per siswa
- **Skema**: migration baru `certificate_templates` (name, background_path, **anchors JSON**, is_active). Model `CertificateTemplate` (casts `anchors`=>array, `is_active`=>bool; accessor `background` → URL; scope `active`; konstanta `FIELDS` = nama/nis/nomor/industri/tanggal). Factory + state `active()`.
- **Template (admin/kaprog)**: `CertificateTemplateController` (`index/create/store/edit/update/destroy` + **`activate`**) gate `role:admin|kaprog`. `CertificateTemplateRequest`: `prepareForValidation` men-decode `anchors` (string JSON dari form multipart) → array, lalu validasi berjenjang (`field` in FIELDS, x/y 0–100, size 1–100, align, color, enabled). Background wajib saat tambah / opsional saat ubah (cek `route('certificateTemplate')` — **param resource di-rename agar binding cocok**). `activate` set satu template aktif (transaksi). Berkas latar di disk `public`.
- **Output (admin/kaprog + siswa)**: `CertificateController` — `index` (siswa → redirect ke miliknya; admin → daftar siswa + `hasActiveTemplate`), `show(Student)` (siswa hanya miliknya 403; admin semua) merender **template aktif + anchor di-resolve ke data siswa** (nomor `PKL/{tahun}/{id}`, tanggal dari `pkl_end`/now). Hanya anchor `enabled` dikirim.
- **Frontend**: komponen **`CertificatePreview`** (latar + teks ter-anchor pakai **container-query `cqw`** → skala identik pratinjau & cetak) dipakai editor & halaman cetak. `certificate-templates/{index,create,edit}` + `CertificateTemplateForm` (upload latar, editor anchor per-field x/y/size/align/color + **live preview**). `certificates/{index,show}`; halaman cetak pakai `@media print` (`@page landscape`, sembunyikan chrome) + tombol **Cetak/Unduh PDF** (`window.print()`). Menu **Sertifikat** (output, admin/kaprog/siswa) + **Template Sertifikat** (admin/kaprog) aktif.
- **Tanpa dependency PDF server** — output via cetak browser (Save as PDF). Tidak di-seed (admin unggah latar riil; empty-state ramah).
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 171 test passed** (+18: CertificateTemplateTest 11, CertificateTest 7). ESLint + tsc + Prettier + `vite build` lolos. `migrate` sukses.

### 24. Konsistensi CRUD — Guru Pembimbing, Pembimbing Industri, Orang Tua jadi page-based
- **Konversi dari modal → page-based** (selaras Siswa/Industri): `TeacherController`, `PembimbingController`, `ParentController` kini punya `create`/`edit` (route `->except('show')`), dan `store`/`update` **redirect ke `*.index`** (sebelumnya `back()`). FormRequest tidak berubah.
- **Frontend**: komponen form baru `components/{teachers,pembimbings,parents}/*-form.tsx` (pakai `<Form>` Inertia, password hanya saat tambah) + halaman `pages/{...}/create.tsx` & `edit.tsx`. Halaman `index` ketiganya **dibersihkan dari modal/useForm** → tombol Tambah & ikon Edit kini `<Link>` ke halaman create/edit; hapus tetap inline `confirm` + `router.delete`. Judul disamakan ("Guru Pembimbing", "Pembimbing Industri", "Orang Tua").
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 171 test passed** (28 Guru/Pembimbing/Orang Tua tetap hijau). ESLint + tsc + Prettier + `vite build` lolos.

### 25. Konsolidasi role akun industri (`mitra` → `industri`)
- **Role `mitra` dihapus** — akun PT/Industri kini **hanya** pakai role **`industri`** (sebelumnya modul Industri assign `mitra` sementara role `industri` cuma akun demo, membingungkan). Tinggal **8 role kanonik**: admin, kaprog, guru, pembimbing, industri, siswa, orangtua, kepala_sekolah.
- **Backend**: `RoleSeeder` buang `mitra`; `IndustryController::store` `assignRole('industri')`; trait `ScopesStudentsByRole` `hasRole('industri')` (dari `hasAnyRole(['mitra','industri'])`); `canVerify` di Attendance/JournalMonitor `['pembimbing','industri']`; route middleware (assessments, monitoring, kedua verify) buang `|mitra`. Komentar Store/UpdateIndustryRequest dirapikan.
- **Frontend**: `types/auth.ts` Role buang `'mitra'`; `nav.ts` STAFF buang `'mitra'`; teks UI "Akun mitra" → "Akun industri" (industry-form + industries/index). `DemoUserSeeder` otomatis: kini ada `industri@simonik.test` (tak ada lagi `mitra@…`).
- **Catatan**: enum `signature_settings.role` (`['kepala_sekolah','mitra']`) dibiarkan — tabel `SignatureSetting` belum dipakai & migration forward-only.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 171 test passed**. ESLint + tsc + Prettier + `vite build` lolos. `migrate:fresh --seed` sukses (8 role).

### 26. Dashboard ringkas per-role
- **`DashboardController` kini bercabang per role** (`__invoke`): admin/kaprog/kepala_sekolah → dashboard analitik penuh (lama); guru/pembimbing/industri → **`dashboard-staff`**; siswa → **`dashboard-student`**; orangtua → **`dashboard-parent`**. Logika rate/partisipasi diekstrak ke helper `participation()`/`rates()`/`rate()` (DRY); scope siswa pakai trait **`ScopesStudentsByRole`**.
- **Staf** (`dashboard-staff`): stat **dibatasi cakupan** (siswa dibina, PKL berjalan, **absen & jurnal menunggu verifikasi** via `pendingCount`), rate absensi/jurnal scoped, daftar siswa bimbingan + banner + kartu link ke Data Absen/Jurnal.
- **Siswa** (`dashboard-student`): status absen hari ini, nilai rata-rata + grade, hari hadir & jurnal bulan ini, total jurnal, info PKL (industri/periode/status), 4 quick-action (Absen/Jurnal/Rekap/Sertifikat).
- **Orang tua** (`dashboard-parent`): kartu per anak (kehadiran & jurnal bulan ini, grade, status) + link lihat absen/jurnal/nilai anak (route-scoped).
- **Frontend DRY**: widget bersama diekstrak ke `components/dashboard/widgets.tsx` (`HeroGreeting`, `StatCard`, `RateCard`, `RecentStudentsTable`, status/grade helper); `pages/dashboard.tsx` (admin) ikut direfaktor memakainya.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 175 test passed** (+4 DashboardTest: guru/siswa/orangtua/kepala_sekolah). ESLint + tsc + Prettier + `vite build` lolos.

### 27. Industri jadi container (bukan user) + hapus verifikasi → rekap performa + Industri Saya (pembimbing)
- **Industri bukan lagi akun User** — kini **container relasi** (guru, pembimbing, siswa) murni. Migration baru (forward-only) `drop_user_id_from_industries_table` membuang `industries.user_id`; `Industry` buang `user_id` (fillable/@property) & relasi `users()`; `User` buang relasi `industries()`; `IndustryFactory` tak lagi membuat User. `IndustryController` store/update/destroy tanpa akun (CRUD profil saja, guard hapus bila masih ada siswa tetap); Store/UpdateIndustryRequest buang field `email`/`password`. Frontend `industry-form` & `industries/index` buang seksi/kolom akun.
- **Role `industri` dihapus** (mengikuti pola `mitra` §25) → **7 role kanonik** (admin, kaprog, guru, pembimbing, siswa, orangtua, kepala_sekolah). Dihapus dari `RoleSeeder`, `ScopesStudentsByRole` (cabang industri), `DashboardController::__invoke`, route middleware (penilaian & monitoring), `types/auth.ts`, `nav.ts` (`STAFF`). `DemoUserSeeder` otomatis tak lagi membuat `industri@simonik.test`.
- **Sidebar**: **Data Industri** dikeluarkan dari dropdown "Data User" → jadi **item Data Master tersendiri** (admin/kaprog). Ditambah item **Industri Saya** (pembimbing).
- **Verifikasi absen & jurnal dihapus** — route `*-monitor.verify` + method `verify()` di kedua monitor controller dibuang; Layer 3 buang `pending_count`; Layer 4 ganti `summary`/`canVerify` dengan **rekap performa**. Trait baru **`SummarizesStudentPerformance`** (`performance(Student)`): count kehadiran (hadir/izin/sakit/alpha/total), count jurnal, **rate%** (atas hari kerja efektif PKL, fallback hari tercatat), serta nilai rata-rata + grade via `Evaluation::gradeFor()`. Komponen FE reusable **`PerformanceSummary`** dipakai di kedua halaman detail murid. Kolom `attendances.verified`/`activities.verified` dibiarkan fisik (dead, tak dipakai). Dashboard staf ganti kartu "menunggu verifikasi" → "Sudah dinilai" + "Rata-rata nilai" (count/rate/grade).
- **Industri Saya (pembimbing, "gabungan kontrol")**: `MyIndustryController` (gate `role:pembimbing`) — `show` (profil industri + roster anak magang dgn quick-stat performa + link ke absen/jurnal/input nilai), `edit`/`update` (kelola profil sendiri via `UpdateMyIndustryRequest`, tanpa ubah relasi). Halaman `pages/my-industry/{show,edit}.tsx`. Industri di-resolve dari `pembimbing.industry` (empty-state bila belum ditugaskan).
- **Tests**: `IndustryTest` ditulis ulang (tanpa akun/email/role); `Attendance/JournalMonitorTest` buang test verify + asersi `pending`→`total`, `summary/canVerify`→`performance`; baru **`MyIndustryTest`** (6 test: akses, roster, empty-state, update). 
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 174 test passed**. ESLint + Prettier + tsc + `vite build` lolos. `migrate:fresh --seed` sukses (7 role, `industries` tanpa `user_id`, tanpa akun industri).

### 28. Deteksi emosi pada absensi foto (face-api.js)
- **Deteksi real-time** (live badge overlay pada `<video>`): `@vladmandic/face-api` (fork terawat dari face-api.js, bundel TF.js sendiri). Library dilayani sebagai **static asset** (`public/libs/face-api.esm.js`) dan di-load via `new Function('return import("/libs/face-api.esm.js")')` agar Vite **tidak** menyentuhnya (menghindari konflik bundler dengan TensorFlow.js internal). Model `TinyFaceDetector` + `FaceExpressionNet` (~510KB total) di `public/models/`. Detection loop setiap 600ms via `setInterval`.
- **Badge di-bake ke foto** (permanen): `drawEmotionBadge()` menggambar pill berwarna (emoji + label) ke Canvas sebelum `canvas.toBlob()` → JPEG final sudah mengandung badge.
- **Skema**: migration baru `add_emotion_to_attendances_table` → `emotion` (after `image`) + `departure_emotion` (after `departure_image`), keduanya `string nullable`.
- **Backend**: `CheckInRequest`/`CheckOutRequest` + validasi `emotion` (nullable, in: 7 nilai enum); `AttendanceController::checkIn` simpan `emotion`, `checkOut` simpan `departure_emotion`; `present()` kirim kedua field ke Inertia.
- **Frontend**: `components/photo-capture.tsx` — ekspor `EmotionKey` + `EMOTION_INFO` (emoji/label/warna per 7 emosi); prop `onCapture(file, emotion?)`. `pages/attendance/index.tsx` + `show.tsx` tampilkan `EmotionBadge` overlay pada foto (absolute positioned pill), dikirim saat form submit.
- **Fix kritis Vite HMR**: mengganti `type FaceApiModule = typeof import('@vladmandic/face-api')` dengan inline interface — bahkan type-only import dari paket ini membuat Vite gagal reload modul saat HMR. Seluruh referensi ke `@vladmandic/face-api` dihilangkan dari kode.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 174 test passed**. ESLint (termasuk `react-hooks/set-state-in-effect` suppress di 1 baris intentional) + tsc + Prettier lolos.

### 29. M0.1 — Refactor Peran & Kerangka Navigasi (Blueprint Modul)

- **Peran:** Role `kepala_sekolah` **dihapus** (role + semua user yg hanya punya role itu); role `wakasek` (Wakasek Humas/Hubin) **ditambahkan** → **7 role kanonik final**: admin, wakasek, kaprog, guru, pembimbing, siswa, orangtua.
- **Migrasi:** `2026_06_30_131118_replace_kepala_sekolah_with_wakasek_role` — hapus user & model_has_roles untuk kepala_sekolah, tambah role wakasek via DB:: (forward-only).
- **Seeder:** `RoleSeeder::ROLES` diperbarui (wakasek in, kepala_sekolah out). `SignatureSettingFactory` default `role` diubah ke `wakasek`.
- **Backend:** `DashboardController` — cabang `wakasek` → `wakasekDashboard()` (stats global: total siswa/PKL/industri/guru, render `dashboard-wakasek`). `ScopesStudentsByRole` — `wakasek` dapat global view (sama dengan admin/kaprog). `routes/web.php` — `wakasek` ditambahkan ke middleware monitoring, penilaian (view), dan sertifikat.
- **Frontend:** `types/auth.ts` (Role: kepala_sekolah → wakasek). `lib/nav.ts` — STAFF array include wakasek; tambah placeholder "Soon" untuk semua modul blueprint mendatang: Pengajuan Libur (M2.1), Streak & Badge (M3.3) di PKL Saya; Inbox Persetujuan (M2.3) di Monitoring; Rapor Digital (M4.2) di Penilaian; section baru **Humas & Keuangan** (Akuntabilitas Dana M5.1, Kemitraan & Kuota M5.2, Statistik Global M5.3, roles: wakasek/admin). Sertifikat di-extend ke wakasek.
- **Page baru:** `pages/dashboard-wakasek.tsx` — skeleton dengan 4 stat cards + 3 "Segera hadir" cards untuk M5.x.
- **Tests:** DashboardTest — `test_kepala_sekolah` → `test_wakasek_sees_wakasek_dashboard` (assert component dashboard-wakasek + 4 stat props). AssessmentTest — `test_roles_outside_scope_are_forbidden` → `test_wakasek_can_view_assessments`. AttendanceMonitorTest + JournalMonitorTest — forbidden kepala_sekolah → positive test wakasek bisa akses.
- ✅ **`composer test` penuh: 174/174 passed + 603 assertions**. `npm run types:check` + `npm run lint` + `npm run build` lolos. Migration applied ke dev DB.

### 30. M0.2 — Fondasi Skema Presensi (Blueprint Modul)

- **Migration forward-only** `2026_06_30_142650_add_smart_attendance_columns_to_industries_and_attendances`:
  - `industries` + `radius` (unsignedInteger, default 100, meter), `jam_masuk` (time nullable), `jam_pulang` (time nullable).
  - `attendances` + `mode` (string nullable: `wfo|wfa`), `is_late` (boolean, default false), `distance_m` (unsignedInteger nullable, meter), `gps_accuracy` (float nullable), `is_suspect` (boolean, default false).
- **Model `Industry`**: `radius`, `jam_masuk`, `jam_pulang` ditambah ke `#[Fillable]` + `@property` PHPDoc; `casts()` baru (`radius` => integer).
- **Model `Attendance`**: `mode`, `is_late`, `distance_m`, `gps_accuracy`, `is_suspect` ditambah ke `#[Fillable]` + `@property` PHPDoc; `casts()` diperbarui (`is_late`/`is_suspect` => boolean, `distance_m` => integer, `gps_accuracy` => float).
- **Factories**: `IndustryFactory` + `radius`/`jam_masuk`/`jam_pulang`; `AttendanceFactory` + `mode`/`is_late`/`distance_m`/`gps_accuracy`/`is_suspect`.
- **Fix PHPStan pre-existing**: `StudentController::show` — nullsafe `?->` tidak perlu pada `industries->name`; ternary untuk `parents` menggantikan nullsafe-concat + `??` yang tidak bisa null.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 174/174 passed + 603 assertions**. `php artisan migrate` sukses.

### 31. M0.3 — Approval Engine / Cross-Approval Bersama (Blueprint Modul)

- **Migration** `2026_06_30_144039_create_approvals_table`: tabel polimorfik `approvals` — `morphs('approvable')` (approvable_type/id), `status` (pending|approved|rejected, default pending), `approver_role` (string nullable), `approver_id` (FK users nullable + nullOnDelete), `note` (text nullable).
- **Model `Approval`**: `HasFactory`, `morphTo approvable()`, `belongsTo approver(User)`, konstanta `STATUS_*` + `PRIMARY_ROLES`/`FALLBACK_ROLE`/`ELIGIBLE_ROLES`, method `isPending()` + static `initiate(Model)`.
- **Factory `ApprovalFactory`**: state `approved()` / `rejected()`.
- **Action `ApproveRequest`** (`app/Actions/`): engine First-to-Approve reusable — `handle(Approval, User, decision, ?note)` memperbarui status + approver_id + approver_role; `canAct(Approval, User)` → pending AND hasAnyRole(eligible). Primary: `pembimbing`, `guru`; fallback: `kaprog`.
- **Policy `ApprovalPolicy`**: method `act()` mendelegasikan ke `ApproveRequest::canAct()` (auto-discovered oleh Laravel).
- **Controller `ApprovalController`**: `approve()` dan `reject()` — gate via `Gate::authorize('act', $approval)`, lalu delegasi ke action.
- **Routes**: `POST /approvals/{approval}/approve` + `POST /approvals/{approval}/reject`, middleware `role:pembimbing|guru|kaprog`.
- **Wayfinder**: regenerasi — `resources/js/actions/App/Http/Controllers/ApprovalController.ts` tergenerate.
- **Komponen frontend `components/approval-status.tsx`**: badge status (Menunggu/Disetujui/Ditolak dengan warna palette SIMONIK) + info approver + catatan + tombol **Setujui/Tolak** (muncul hanya saat `canAct && pending`, menggunakan Wayfinder actions).
- **Tests `ApproveRequestTest`** (16 test, 41 assertions): unit `canAct()` (pembimbing/guru/kaprog bisa, siswa/orangtua/admin/wakasek tidak bisa, resolved tidak bisa); unit `handle()` (pembimbing approve, guru approve, kaprog fallback, reject + note, first-approver-wins); HTTP (approve/reject via endpoint, siswa 403, kaprog via HTTP, resolved kembali 403, guest redirect login).
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 190/190 passed + 635 assertions**. `npm run types:check` + `npm run lint` + `npm run build` lolos.

---

### 32. M1.1 — Koordinat Dinamis & Radius (Blueprint Modul)

- **Backend:**
  - Menambahkan validasi `radius` (`integer|min:10|max:10000`) pada `StoreIndustryRequest`, `UpdateIndustryRequest`, dan `UpdateMyIndustryRequest`.
  - Membuat Form Request `UpdateIndustryCoordinatesRequest` untuk validasi pembaruan lokasi secara modular.
  - Membuat `IndustryPolicy` dengan method `updateCoordinates()` untuk membatasi pengubahan koordinat & radius industri berdasarkan otorisasi multi-peran:
    - `admin` (global)
    - `kaprog` (jurusan, jika pembimbing/siswa berada di bawah jurusan tersebut)
    - `guru` (bimbingan, jika merupakan guru pembimbing industri tersebut)
    - `pembimbing` (sendiri, jika merupakan pembimbing industri tersebut)
  - Mendaftarkan rute `PATCH /industries/{industry}/coordinates` di `routes/web.php` yang diproteksi `role:admin|kaprog|guru|pembimbing` dan diotorisasi policy.
  - Memperbarui `IndustryController` dan `MyIndustryController` (method `show`/`edit`) untuk menyertakan atribut `radius` dalam response JSON/Props, serta menambahkan method `updateCoordinates()`.
- **Frontend:**
  - Membuat komponen peta interaktif reusable [MapPicker](file:///C:/laragon/www/simonik-v2/resources/js/components/map-picker.tsx) menggunakan Leaflet (distribusi OSM unpkg CDN) dengan fitur marker draggable, click-to-place, deteksi lokasi perangkat (Geolocation API), serta visualisasi lingkaran jangkauan radius presensi.
  - Membuat komponen peta read-only reusable [MapViewer](file:///C:/laragon/www/simonik-v2/resources/js/components/map-viewer.tsx) untuk visualisasi lokasi & radius di halaman detail.
  - Mengintegrasikan `MapPicker` & radius field ke dalam form edit/create industri ([IndustryForm](file:///C:/laragon/www/simonik-v2/resources/js/components/industries/industry-form.tsx) & [MyIndustryEdit](file:///C:/laragon/www/simonik-v2/resources/js/pages/my-industry/edit.tsx)).
  - Menampilkan peta read-only `MapViewer` di detail industri ([IndustryShow](file:///C:/laragon/www/simonik-v2/resources/js/pages/industries/show.tsx) & [MyIndustryShow](file:///C:/laragon/www/simonik-v2/resources/js/pages/my-industry/show.tsx)).
  - Mengatasi kendala ESLint (`Avoid calling setState() directly within an effect` & dependency arrays) dengan inisialisasi state pintar dan bypass linter yang sesuai.
- **Wayfinder:** Meregenerasi TypeScript route action helpers.
- **Tests:** Membuat [UpdateIndustryCoordinatesTest.php](file:///C:/laragon/www/simonik-v2/tests/Feature/UpdateIndustryCoordinatesTest.php) (11 test, 20 assertions) untuk memverifikasi hak akses per peran, pembatasan jurusan kaprog, bimbingan guru, kepemilikan pembimbing, validasi, dan penolakan tamu/peran lain.
- ✅ **`composer test` penuh: Pint + PHPStan 0 error + 200/200 passed + 653 assertions**. `npm run lint` + `npm run types:check` lolos.

---

---

### 46. Roadmap v2 — riset & perencanaan batch UAT Agustus 2026 (docs saja)

Enam temuan lapangan baru dipecah jadi 6 fase yang bisa dikirim terpisah, lengkap dengan bukti kode per akar masalah. **Tidak ada kode aplikasi yang diubah pada langkah ini** — sengaja: dua dari enam temuan ternyata bukan seperti yang terlihat, dan menebak akan menghasilkan tambalan di tempat yang salah.

- **`docs/v2/00-RISET-DAN-TEMUAN.md`** — setiap klaim ditelusuri ke berkas + baris, termasuk ke `vendor/` saat perilakunya ditentukan library.
- **Temuan terpenting #1 (impor gagal):** template kita workbook 3 sheet (`Petunjuk`/`Data …`/`Referensi`), importer single-sheet. `vendor/maatwebsite/excel/src/Reader.php` menyuapkan **semua** sheet ke `collection()` yang sama saat importer bukan `WithMultipleSheets` → sheet `Petunjuk` dibaca sebagai data. Karena `StudentsImport` *all-or-nothing*, impor siswa dengan template resmi **mustahil berhasil**. Turunannya: baris contoh "Budi Santoso" akan ikut masuk DB, kolom `Periode` di template tak pernah dibaca, dan CSV jadi satu-satunya jalur yang bekerja hari ini.
- **Temuan terpenting #2 (akun bentrok):** bukan bug autentikasi. Setiap modul selalu `User::create()` + `Rule::unique('users','email')`, jadi satu orang di dua jabatan dipaksa punya dua email. Spatie sudah mendukung multi-peran dan tak ada `syncRoles()` di mana pun → **nol migrasi**. Bug laten yang ikut ketahuan: `DashboardController` memeriksa `guru` sebelum `kaprog`, jadi peran ganda akan selalu mendarat di dashboard salah.
- **Fase 1–5** menjawab enam temuan UAT; **Fase 6** (halaman impor dengan pratinjau + tempel/isi-ke-bawah ala Excel) opsional, ditinjau ulang setelah Fase 1 terbukti jalan. Grid spreadsheet penuh ditolak dengan alasan tertulis (lisensi + permukaan bug di jalur yang menulis data master).
- Tiap fase memuat opsi + pro/kontra **termasuk yang ditolak beserta alasannya**, langkah implementasi, berkas yang disentuh, test, ekspektasi output, dan risiko + mitigasi. Urutan eksekusi 1 → 2 → 4 → 5 → 3 → (6) beserta gerbang verifikasi per fase ada di `docs/v2/README.md`.

---

### 47. Fase 1 v2 — impor Excel akhirnya benar-benar bisa dipakai

Template impor adalah workbook 3 sheet (`Petunjuk` / data / `Referensi`), sedangkan importer dibangun untuk 1 sheet. `Reader::loadSpreadsheet()` menyuapkan **setiap** sheet ke `collection()` yang sama saat importer bukan `WithMultipleSheets`, jadi sheet `Petunjuk` terbaca sebagai data — baris pertamanya (judul besar) jadi nama kolom, semua key hilang, seluruh barisnya invalid. Karena `StudentsImport` *all-or-nothing*, **impor siswa dengan template resmi tidak pernah bisa berhasil sejak awal**.

- **`ImportsRows::sheets()`** memilih sheet data secara eksplisit; nama sheet dipusatkan di `ImportDefaults::SHEETS` dan dipakai dua arah (oleh `ImportTemplates` saat membuat, oleh importer saat membaca) supaya tak bisa menyimpang. 9 importer cukup mendeklarasikan `sheetName()`.
- **Regresi yang tertangkap saat mengerjakan:** begitu importer jadi `WithMultipleSheets`, 10 test impor CSV langsung merah — CSV dimuat PhpSpreadsheet sebagai sheet bernama `Worksheet`, bukan `Data Siswa`. `sheets()` kini mendaftar dua nama (konstanta `CSV_SHEET`). Asumsi di dokumen fase bahwa "CSV sudah ditangani library" ternyata keliru dan sudah dikoreksi di sana.
- **Deteksi "tidak ada yang terbaca"** tidak jadi memakai penanda `SkipsUnknownSheets`: karena `sheets()` mendaftar dua nama, salah satunya *selalu* absen. Diganti kondisi yang sebenarnya dipedulikan — nol dibuat, nol dilewati, nol gagal → jelaskan sheet mana yang dicari.
- **`StudentsImport` disamakan dengan importer lain:** memakai trait `ImportsRows`, berperilaku skip-duplikat (bukan all-or-nothing), `StudentController::import()` memakai `runImport()`. Duplikasi `lookup()`/`gender()`/`date()`/`DEFAULT_PASSWORD` hilang; NIS ganda yang dulu lolos diam-diam kini dilewati dan dilaporkan. `$warnings` pindah ke trait dan ikut diringkas di flash, jadi relasi yang gagal dikenali tak lagi hilang tanpa jejak.
- **Baris contoh dibuang dari sheet data** (dulu "Budi Santoso" ikut tersimpan bila operator lupa menghapusnya) — beserta parameter `example` di `GenericTemplateExport` dan helper `ImportTemplates::sample()` yang jadi tak terpakai. Contoh pindah ke sheet `Petunjuk`. Kolom `Periode` dihapus dari template siswa: importer tidak pernah membacanya.
- **Tests (+6, `ImportTemplateRoundTripTest`):** menempuh jalur operator sungguhan — unduh template, isi sheet data, unggah lewat route. Dijalankan terhadap kode sebelum perbaikan: **0/6 lulus**; sesudahnya 6/6. Test impor lama semuanya memakai CSV, dan itulah sebabnya suite selalu hijau meski impor `.xlsx` rusak — CSV satu-satunya jalur yang tak melewati bug ini.
- ✅ **Pint + PHPStan 0 error + 361/361 passed + 1502 assertions.** `composer ci:check` hijau (eslint + prettier + `tsc`).

**Belum:** verifikasi manual di browser dengan data sekolah sungguhan.

---

### 48. Fase 2 v2 — satu orang, satu akun, banyak jabatan

Keluhan "kaprog + guru pembimbing bikin nggak bisa login" ternyata bukan bug autentikasi. `LoginRequest` polos tanpa filter peran; yang salah adalah tiap modul kepegawaian selalu `User::create()` dengan `Rule::unique('users','email')`, jadi satu orang di dua jabatan dipaksa punya dua akun dan dua kata sandi. Menghapus entri kaprog "menyembuhkan" gejalanya karena `destroy()` menghapus baris `users`-nya, bukan mencabut perannya.

- **Nol migrasi.** Spatie sudah menyimpan peran many-to-many dan tak ada `syncRoles()` di mana pun, jadi hanya alur create/destroy yang perlu dibetulkan.
- **`ResolvesRoleAccount`** (trait controller): `accountFor()` memakai akun terpilih atau membuat baru lalu `assignRole()` (aditif); `detachRole()` mencabut jabatan dan hanya menghapus akun bila itu peran terakhirnya; `accountCandidates()` mencari kandidat. `ValidatesRoleAccount` (trait form request) membuat nama/email/kata sandi `required_without:user_id` dan menolak rangkap terlarang.
- **Siswa & orang tua tidak boleh merangkap jabatan kepegawaian** (`App\Support\Roles::EXCLUSIVE`). Alasannya nyata: `ScopesStudentsByRole` dan dashboard memilih cakupan data dari peran, jadi akun siswa+guru akan melihat dirinya sendiri sebagai siswa bimbingan dan bisa masuk antrean persetujuannya sendiri.
- **Bug laten yang ikut diperbaiki:** `DashboardController` memeriksa `guru` sebelum `kaprog`, jadi begitu peran ganda diizinkan seorang guru+kaprog akan **selalu** mendarat di dashboard staf. Urutan kini dari kewenangan terluas ke tersempit, plus `?as=<peran>` untuk berpindah. `app-sidebar.tsx` juga memakai `auth.roles[0]` sebagai label — satu peran dipilih sembarang mengikuti urutan baris DB; kini menampilkan semua jabatan + pemilih dashboard.
- **`accountNotice()`** mengumpulkan peringatan semua jabatan alih-alih `return` pada yang pertama, jadi pemegang jabatan guru *dan* pembimbing melihat kedua sebabnya.
- **Tanpa endpoint JSON:** kandidat akun datang sebagai prop halaman `create` dan disegarkan lewat partial reload (`only: ['candidates']`) — rencana awal sempat meminta `UserSearchController` + rute `users/search`, tapi itu bertentangan dengan prinsip "halaman adalah fungsi dari propnya".
- **Jebakan PHP yang tertangkap test:** konstanta di dalam trait tidak bisa diakses lewat nama trait-nya (`ResolvesRoleAccount::EXCLUSIVE_ROLES` melempar `Error` saat runtime). Dipindah ke `App\Support\Roles`.
- **Tests (+11, `MultiRoleAccountTest`):** guru jadi kaprog tanpa akun kedua, login & dashboard akun dua jabatan, urutan dashboard + `?as=`, cabut jabatan tidak menghapus akun, cabut jabatan terakhir menghapus akun, hapus guru yang masih pembimbing, tolak akun siswa, tolak yang sudah menjabat, kandidat menyembunyikan siswa & yang sudah menjabat, dan alur buat-akun-baru tetap jalan.
- ✅ **Pint + PHPStan 0 error + 372/372 passed + 1560 assertions.** `composer ci:check` hijau.

**Belum:** command `simonik:merge-accounts` untuk melaporkan akun kembar yang terlanjur ada di produksi (dibuat kalau memang ditemukan, jangan spekulatif), dan verifikasi manual di browser.

---

### 49. Fase 4 v2 — satu domain email untuk semua akun

Tidak ada konvensi terpusat: seeder saja memakai `@simonik.local` **dan** `@simonik.test`, template impor mencontohkan `budi@contoh.sch.id`, dan form menerima apa pun. Operator jadi mengetik gaya berbeda tiap kali lalu lupa mana yang dipakai — sekaligus memperparah masalah akun kembar di Fase 2.

- **`ImportDefaults::EMAIL_DOMAIN` + `email()`** jadi satu-satunya tempat email disusun dari username. Nilai yang sudah memuat `@` dibiarkan apa adanya, jadi berkas impor lama tetap jalan dan operator yang refleks mengetik domain tidak menghasilkan domain ganda.
- **`NormalizesEmailDomain`** (trait form request) menormalkan di `prepareForValidation()`, dipakai 11 request. Aturan `ends_with` **hanya pada form tambah** — form ubah dan profil sengaja dibebaskan: menolak email akun lama saat disunting sama dengan mengganti kredensial login orang tanpa diminta.
- **Impor menormalkan di titik baca**, bukan di `makeUser()`, supaya validasi `isEmail()` melihat alamat yang sudah lengkap. Kolom Email di template boleh diisi username saja.
- **`EmailInput`** menampilkan `@simonik.local` sebagai sufiks mati di samping kolom; operator hanya mengetik username. Akun lama berdomain lain tetap tampil utuh. Dipasang di 6 form master data, **tidak** di login (harus menerima email apa pun) dan tidak di profil.
- **Kekhawatiran yang ternyata tidak berlaku:** rencana sempat mencemaskan reset kata sandi lewat email jadi mustahil karena `@simonik.local` bukan domain sungguhan. Diperiksa: aplikasi ini memang tidak punya alur lupa-kata-sandi (hanya `PUT /password` untuk yang sudah masuk), dan login Google belum punya rute apa pun.
- **9 berkas test lama disesuaikan** karena memakai domain sekolah/contoh yang kini ditolak saat membuat akun — konsekuensi perubahan yang diminta, bukan bug.
- **Temuan sampingan (bukan bug aplikasi):** `Call to a member function all() on array` dari `TestResponseAssert` muncul karena `config/session.php` memakai `serialization => 'json'`, sehingga `errors` di session kembali sebagai array. Hanya terjadi saat sebuah assertion sudah gagal pada response redirect; alur asli (POST gagal validasi → GET form) diverifikasi tetap 200. Tidak diubah apa pun.
- ✅ **Pint + PHPStan 0 error + 378/378 passed + 1574 assertions.** `composer ci:check` hijau.

**Belum:** command `simonik:normalize-emails` untuk merapikan email lama (sengaja ditunda — mengubah email = mengubah kredensial login), dan verifikasi manual di browser.

---

### 50. Fase 5 v2 — industri bisa ditetapkan langsung dari modul Pembimbing

Relasi pembimbing ↔ industri dimiliki sisi industri (`industries.pembimbing_id`), jadi penugasan sebelumnya hanya bisa lewat modul Data Industri: tambah pembimbing → simpan → pindah modul → cari industrinya → edit → pilih pembimbing. Langkah kedua gampang terlupa, dan pembimbing yang terlanjur "yatim" akan melihat spanduk "akun belum ditautkan ke industri".

- **`industryOptions()` + `syncIndustry()`** menyalin pola `KaprogController::departemenOptions()`/`syncDepartemens()` yang sudah ada — tidak ada pola baru untuk dipelajari, nol migrasi.
- **Kardinalitas dinyatakan di UI, bukan didiamkan.** `pembimbing_id` kolom tunggal, jadi satu industri hanya menampung satu pembimbing: opsi yang sudah dipegang diberi label `PT Maju Jaya · dipegang Rina`, dan memilihnya memunculkan peringatan bahwa menyimpan akan memindahkannya. **Diperingatkan, bukan dilarang** — melarangnya memaksa operator bolak-balik ke modul Industri untuk melepas dulu, yaitu pekerjaan yang justru sedang dihilangkan.
- **Kolom `industry_id` baru di `pembimbings` ditolak** (Opsi B): akan ada dua sumber kebenaran untuk relasi yang sama, dan pasti menyimpang begitu satu sisi diubah lewat modul lain. Modul Data Industri tetap bisa menugaskan seperti biasa — keduanya menulis kolom yang sama.
- Saat menyunting, industri milik pembimbing itu sendiri tidak ditandai sebagai "dipegang orang lain".
- **Tests (+7, `PembimbingIndustryTest`):** tugaskan saat membuat, industri boleh kosong, ganti industri melepas yang lama, kosongkan melepas penugasan, klaim industri milik orang lain menggeser pemegang lama (perilaku disengaja, dikunci test), penandaan `taken_by` di form tambah, dan pengecualian diri sendiri di form ubah.
- ✅ **Pint + PHPStan 0 error + 385/385 passed + 1610 assertions.** `composer ci:check` hijau.

**Belum:** verifikasi manual di browser, termasuk memastikan spanduk "akun belum ditautkan" hilang setelah admin menetapkan industri dari modul Pembimbing.

---

### 51. Fase 3 v2 — pilih & hapus massal siswa, plus jarak kolom tabel

Menghapus satu kelas siswa yang salah impor sebelumnya berarti 40 klik hapus + 40 konfirmasi, tanpa jaminan tidak ada yang terlewat. Kolom tabel juga berdempetan karena seluruh sel hanya memakai `py-3`/`pb-3` tanpa padding mendatar sama sekali.

- **`DELETE students/bulk`** dideklarasikan sebelum `Route::resource`, sesuai preseden `students/export` — kalau urutannya salah, ia terbaca sebagai `students/{student}` dan tak pernah sampai ke `bulkDestroy()`. Dibuktikan test.
- **Otorisasi tidak dilubangi:** `authorizeStudent()` di-refactor memanggil `canManageStudent()`, satu sumber aturan. Setiap id melewati gerbang yang sama dengan hapus satuan; id di luar cakupan kaprog **dilewati dan dilaporkan**, bukan menggagalkan seluruh operasi. `max:200` mencegah bug frontend menghapus seisi sekolah.
- **UI:** kolom checkbox + pilih-semua-halaman-ini (`indeterminate` lewat `ref`), action bar `role="status"` menyebut jumlah, konfirmasi lewat `Modal` (bukan `window.confirm`) yang juga menyebut jumlahnya. Select-all lintas halaman sengaja tidak dibuat — satu klik menghapus ratusan baris tanpa operator melihatnya terlalu berisiko.
- **Penyimpangan dari rencana:** pilihan **diturunkan**, bukan di-reset lewat `useEffect`. Implementasi pertama memakai `useEffect(() => setSelected([]), [...])` dan ditolak ESLint (`react-hooks/set-state-in-effect`); diganti `selected.filter((id) => pageIds.includes(id))`. Hasilnya lebih kuat, bukan sekadar lolos linter: baris yang tidak terlihat **tidak mungkin** ikut terkirim.
- **Jarak kolom** `px-3` diterapkan ke tabel siswa dan 8 tabel master data lain supaya tidak ada dua gaya spasi. Padding tepi ditulis eksplisit (`pb-3 pr-3 pl-2`) karena menggabung `px-3` dengan `pl-2` membuat hasilnya bergantung pada urutan properti di CSS Tailwind, bukan urutan tulisan di JSX. Pola ini dicatat di `docs/UI-PATTERNS.md`.
- **Tests (+6, `StudentBulkDestroyTest`):** hapus beberapa sekaligus (akun login ikut terhapus), kaprog tidak bisa menghapus siswa di luar jurusannya, ids kosong ditolak, >200 ditolak, siswa biasa ditolak, dan kelas tidak ikut terhapus.
- ✅ **Pint + PHPStan 0 error + 391/391 passed + 1627 assertions.** `composer ci:check` hijau.

**Catatan proses:** CLAUDE.md diperbarui — verifikasi kini berlingkup pada yang disentuh (`--filter`, `pint --dirty`, phpstan per berkas, eslint/prettier per berkas); `composer ci:check` penuh hanya saat mau commit, saat menyentuh kode bersama, atau diminta. Output perintah tidak boleh dibuang ke `/dev/null` — galat yang tersembunyi terlihat seperti hang.

## 📍 Current step
**Seluruh enam temuan UAT selesai (Fase 1, 2, 3, 4, 5).** Impor Excel bisa dipakai lagi, satu orang bisa memegang beberapa jabatan dengan satu login, akun baru seragam `@simonik.local`, industri bisa ditetapkan dari form pembimbing, dan tabel siswa punya hapus massal dengan jarak kolom yang wajar.

**Catatan deploy:** nol migrasi pada kelima fase. Wajib `npm run build`. Akun kembar dan email lama **tidak** diubah otomatis — keduanya perlu ditinjau manual bila mengganggu.

**Sisa verifikasi di browser** (belum dilakukan sama sekali):
1. Unduh template siswa → isi 2 baris → unggah → data masuk.
2. Tambahkan guru yang sudah ada sebagai kaprog → login dengan akunnya → kedua menu terlihat.
3. Buat akun baru → sufiks `@simonik.local` muncul di form.
4. Tetapkan industri dari form pembimbing → spanduk "belum ditautkan" hilang.
5. Pilih beberapa siswa → hapus massal → cek juga tabel di lebar 1366px.

---

## ⏭️ Next step
1. **Verifikasi manual kelima fase di atas** — ini gerbang yang tersisa sebelum batch UAT ini benar-benar ditutup.
2. **[Fase 6 — Halaman impor](v2/06-FASE-6-HALAMAN-IMPOR.md)** — opsional (~12 jam). **Tinjau ulang dulu**: ia menyelesaikan keluhan UX, dan keluhannya mungkin sudah hilang setelah Fase 1. Putuskan dari keluhan nyata, bukan dari rencana.
3. Tiga opsi lama masih berlaku: wajib lengkapi profil saat login pertama, bersihkan approval WFA menggantung, audit scoping kaprog untuk master data lain.
