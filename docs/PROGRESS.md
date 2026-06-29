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

---

## 📍 Current step
**Data Absen monitoring jalan**. Staf menelusuri kehadiran berjenjang Jurusan→Kelas→Murid→detail (role-scoped); pembimbing/industri memverifikasi tiap catatan absen. Data absen siswa mengalir riil dari modul Absen Foto + Geo. Di atas: master data penuh, dashboard analitik, Rekap Penilaian.

Sisa "Soon": **Jurnal harian (input siswa)** + Data Jurnal (drill-down + verifikasi), Panduan PKL, Sertifikat, Forum PKL, Kalender.

---

## ⏭️ Next step — opsi terbaik (detail & spec di [`ROADMAP.md`](ROADMAP.md))

1. **Jurnal harian (input siswa) (Rekomendasi)** — rich-text Tiptap (modul lama dihapus, bangun ulang) → mengisi rate jurnal dashboard, lalu **Data Jurnal** drill-down 4 layer (pola persis Data Absen — bisa reuse `ScopesStudentsByRole` + `Breadcrumb`).
2. **Panduan PKL** (upload PDF/dokumen → tampil ke siswa), lalu **Sertifikat**.
3. **Forum PKL** & **Kalender** — prioritas rendah.
