# Fase 18 — Pengumuman (multi-role + periode tayang)

**Status:** 📝 Rencana · **Prioritas:** P1 · **Risiko regresi:** sedang ·
**Migrasi:** ya (1 tabel) · **Perkiraan:** ~5-7 jam

## 1. Permintaan

> "Membuat pengumuman yang bisa dilihat (muncul di dashboard) oleh role tertentu
> seperti: All User, Murid, Guru Pembimbing, Pembimbing Industri, Orangtua (Bisa
> multichoice). dan ada periode waktu berapa lama pengumuman ini dapat terlihat
> di dashboard. Fitur ini dibuatkan untuk role admin & guru pembimbing"

Tiga hal yang diminta:

1. Target **multi-role** (checkbox, bisa lebih dari satu).
2. **Periode tayang** — mulai & selesai.
3. Yang boleh **membuat**: admin & guru pembimbing (role `guru`).

## 2. Kondisi sekarang

**Tidak ada apa pun.** Grep `announcement|pengumuman` di `app/`, `routes/`,
`resources/js/`, `database/migrations/` → 0 hasil. Ini modul betul-betul baru.

Yang **sudah ada** dan akan dipakai ulang (jadi modul ini tidak menulis
infrastruktur baru sama sekali):

| Yang dibutuhkan | Sudah ada di | Bukti |
|---|---|---|
| Daftar role sistem | `spatie/laravel-permission` | `database/migrations/2026_06_27_173101_create_permission_tables.php`; role: `admin`, `wakasek`, `kaprog`, `guru`, `pembimbing`, `orangtua`, `siswa` (lihat `DashboardController::ROLE_PRIORITY` baris 44) |
| Role user di frontend | `HandleInertiaRequests::share()` | `auth.roles` sudah dibagikan ke setiap halaman |
| Editor teks kaya | `resources/js/components/ui/rich-text-editor.tsx` + `rich-text.tsx` (penampil) | dipakai modul Panduan PKL (`GuideController`) |
| Pola CRUD daftar + filter + modal | `docs/UI-PATTERNS.md`, `resources/js/pages/students/index.tsx` | |
| Komponen `Select` & `Modal` | `resources/js/components/ui/` | |
| Pola menu sidebar per-role | `resources/js/lib/nav.ts` (`roles:` per item) | |

**Yang penting:** ketujuh dashboard adalah **file berbeda**
(`dashboard.tsx`, `dashboard-staff.tsx`, `dashboard-student.tsx`,
`dashboard-parent.tsx`, `dashboard-kaprog.tsx`, `dashboard-wakasek.tsx`) yang
di-render dari `DashboardController` (satu method per role, baris 58 dst).
Menempelkan pengumuman ke masing-masing berarti **6 kali edit yang sama** —
lihat keputusan §3.4.

## 3. Keputusan implementasi

### 3.1 Target role disimpan sebagai kolom JSON, bukan tabel pivot

```php
$table->json('roles'); // ['siswa','orangtua'] — [] atau ['*'] = semua user
```

Alasan: target role adalah **daftar nilai statis milik satu pengumuman**, bukan
relasi ke entitas yang punya siklus hidup sendiri. Tabel pivot
`announcement_role` menambah 1 tabel + 1 relasi + 1 sinkronisasi
(`sync()`) demi kueri yang tidak pernah dibalik ("pengumuman apa saja untuk role
X" — tetap bisa dari JSON).

Laravel sudah punya `'roles' => 'array'` di `casts()` dan MySQL 8 punya
`JSON_CONTAINS`. Namun **filternya tidak dilakukan di SQL** — lihat §3.3.

> Ditolak: `string` dipisah koma. `LIKE '%guru%'` akan cocok juga dengan
> `orangtua`… tidak, tapi akan cocok dengan role masa depan yang mengandung
> substring. Bug yang menunggu. JSON + cast array menghindarinya gratis.

### 3.2 "All User" adalah `['*']`, bukan daftar semua role

Kalau "All User" disimpan sebagai `['admin','wakasek','kaprog','guru','pembimbing','orangtua','siswa']`,
maka menambah role baru di masa depan diam-diam **mengecualikan** role itu dari
semua pengumuman lama. `['*']` berarti "siapa pun", selamanya.

Di UI: checkbox "Semua pengguna" yang, saat dicentang, mematikan (disable)
checkbox lainnya.

### 3.3 Penyaringan target dilakukan di PHP, bukan `JSON_CONTAINS`

```php
Announcement::query()
    ->where('starts_at', '<=', $today)
    ->where('ends_at', '>=', $today)
    ->latest('starts_at')
    ->get()
    ->filter(fn (Announcement $a): bool => $a->isFor($user))
```

Alasan: `JSON_CONTAINS` **tidak ada di SQLite** — dan `phpunit.xml` menjalankan
test di database berbeda dari dev. Kueri yang jalan di produksi tapi meledak di
test suite adalah cara tercepat merusak `composer ci:check`.

Biaya penyaringan di PHP: **nol praktis**. Yang di-`get()` hanya pengumuman yang
sedang **aktif hari ini** — realistis 0-5 baris. Ini bukan tempat untuk
mengoptimalkan.

```php
// ponytail: filter target dilakukan di PHP karena himpunan aktif per hari
// sangat kecil (0-5 baris). Pindahkan ke WHERE JSON_CONTAINS kalau suatu
// hari pengumuman aktif serentak menembus ratusan baris.
public function isFor(User $user): bool
{
    return in_array('*', $this->roles, true)
        || $user->hasAnyRole($this->roles);
}
```

### 3.4 Pengumuman dibagikan lewat `HandleInertiaRequests::share()`, bukan per-dashboard

Ini keputusan terpenting di fase ini.

**Ditolak — menambah prop `announcements` di 6 method `DashboardController`:**
6 edit yang identik, dan setiap dashboard baru di masa depan lupa menyalinnya.

**Dipilih — satu tempat, `app/Http/Middleware/HandleInertiaRequests.php::share()`,**
persis seperti `auth.pendingApprovalsCount` yang sudah ada di sana (baris 48).
Preseden ini sudah dipakai untuk kebutuhan yang bentuknya sama persis: data
lintas-halaman, per-user, kecil.

Konsekuensi yang harus diperhatikan: `share()` jalan di **setiap** request
Inertia, bukan hanya dashboard. Karena itu:

```php
// Kueri hanya dijalankan saat halaman dashboard — share() dieksekusi di
// setiap request Inertia, dan pengumuman hanya dipakai di dashboard.
'announcements' => fn () => $request->routeIs('dashboard')
    ? $this->announcementsFor($request->user())
    : [],
```

`Closure` di dalam `share()` adalah **lazy prop** Inertia — tidak dievaluasi
kalau tidak dipakai, jadi biayanya nol di halaman lain.

Di frontend: satu komponen `<AnnouncementBoard />` yang membaca
`usePage().props.announcements`, dipasang **sekali** di
`resources/js/layouts/app-layout.tsx`… **tidak.** Lihat catatan berikut.

> **Catatan implementasi:** memasangnya di `app-layout.tsx` akan memunculkan
> pengumuman di **semua** halaman (layout dipakai semua). Yang diminta adalah
> "muncul di dashboard". Jadi komponen dipasang eksplisit di 6 file dashboard —
> **satu baris `<AnnouncementBoard />` per file**, bukan 6 blok logika.
> Datanya tetap datang dari satu tempat. Ini pembagian yang benar: data
> tersentralisasi, penempatan tetap eksplisit.

### 3.5 Periode tayang: dua kolom `date`, inklusif di kedua ujung

```php
$table->date('starts_at');
$table->date('ends_at');
```

- Tipe `date` (bukan `datetime`) — presisi jam tidak diminta, dan `date` bebas
  dari jebakan timezone yang sudah ada di modul absen.
- **Inklusif** (`<=` / `>=`) — pengumuman dengan `ends_at` hari ini masih tampil
  hari ini. Ini yang diharapkan operator saat mengetik "sampai 30 Agustus".
- Validasi: `ends_at` wajib `after_or_equal:starts_at` (pengumuman 1 hari sah).
- `starts_at` **boleh di masa lalu** (operator sering menulis pengumuman
  terlambat) dan **boleh di masa depan** (dijadwalkan). Tidak ada aturan
  `after:today`.

Tidak ada kolom `is_active`. Status ("Terjadwal" / "Tayang" / "Berakhir")
**diturunkan** dari kedua tanggal dan dipetakan ke label di controller
(sesuai `CLAUDE.md`: petakan enum di backend).

### 3.6 Cakupan guru pembimbing: hanya pengumuman miliknya sendiri

Admin melihat & mengubah semua. Guru (`role:guru`) hanya baris dengan
`user_id = auth()->id()`. Ini pola `scoped*()` yang sama dengan
`IndustryController::scopedIndustries()` — satu method privat, dipakai di
`index`, `edit`, `update`, `destroy`.

**Guru boleh menargetkan role apa saja**, termasuk `admin`. Membatasi target
guru (mis. "guru hanya boleh menargetkan siswa") tidak diminta, dan menambah
matriks aturan yang harus dijelaskan ke operator. Kalau ternyata perlu, itu satu
`if` di Form Request nanti.

```php
// ponytail: guru bebas menargetkan role mana pun. Batasi di StoreAnnouncementRequest
// kalau ternyata guru menyalahgunakan target admin/wakasek.
```

### 3.7 Yang **tidak** dibangun

| Tidak dibangun | Alasan |
|---|---|
| Lampiran berkas | Tidak diminta. `RichTextEditor` sudah cukup untuk isi. |
| Notifikasi email/push/WA | Tidak diminta — "muncul di dashboard" adalah kanalnya. |
| Tanda "sudah dibaca" per-user | Butuh tabel pivot `announcement_user` + endpoint. Tidak diminta. |
| Target per-kelas / per-jurusan / per-industri | Diminta **per-role**. Menambah dimensi target = menambah UI + kueri. |
| Prioritas / pin | Urutan `starts_at` terbaru sudah cukup. |

---

## 4. Rencana implementasi

### 4.1 Migrasi — `create_announcements_table`

`php artisan make:migration create_announcements_table`

```php
Schema::create('announcements', function (Blueprint $table): void {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->text('body');
    $table->json('roles');
    $table->date('starts_at');
    $table->date('ends_at');
    $table->timestamps();

    // Kueri dashboard selalu menyaring rentang tanggal lebih dulu.
    $table->index(['starts_at', 'ends_at']);
});
```

`cascadeOnDelete` disengaja (bukan `nullOnDelete`): pengumuman tanpa pembuat
tidak punya makna, dan `docs/PROGRESS.md` §53 mencatat bug nyata akibat salah
pilih di antara keduanya — jadi pilihannya ditulis eksplisit di sini.

### 4.2 Model — `app/Models/Announcement.php`

`php artisan make:model Announcement -f`

```php
#[Fillable(['user_id', 'title', 'body', 'roles', 'starts_at', 'ends_at'])]
class Announcement extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'roles' => 'array',
            'starts_at' => 'date',
            'ends_at' => 'date',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Pengumuman yang periodenya mencakup tanggal tertentu (inklusif).
     *
     * @param  Builder<Announcement>  $query
     * @return Builder<Announcement>
     */
    public function scopeActiveOn(Builder $query, CarbonInterface $date): Builder
    {
        return $query->whereDate('starts_at', '<=', $date)
            ->whereDate('ends_at', '>=', $date);
    }

    public function isFor(User $user): bool
    {
        return in_array('*', $this->roles, true) || $user->hasAnyRole($this->roles);
    }
}
```

`casts()` untuk semua tanggal & array sesuai `CLAUDE.md`. PHPDoc property block
lengkap seperti model lain (`Attendance`, `SakitIzin`).

### 4.3 Controller — `AnnouncementController`

`php artisan make:controller AnnouncementController --resource`

| Method | Rute | Isi |
|---|---|---|
| `index` | `GET pengumuman` | daftar paginasi + filter `status` (`tayang`/`terjadwal`/`berakhir`/`semua`) + `search` judul; `scopedAnnouncements()` |
| `create` / `store` | `GET/POST pengumuman` | form + `StoreAnnouncementRequest` |
| `edit` / `update` | `GET/PATCH pengumuman/{announcement}` | idem + `UpdateAnnouncementRequest` |
| `destroy` | `DELETE pengumuman/{announcement}` | |

```php
private function scopedAnnouncements(User $user): Builder
{
    return $user->hasRole('admin')
        ? Announcement::query()
        : Announcement::query()->where('user_id', $user->id);
}
```

`edit`/`update`/`destroy` diawali `abort_unless($this->scopedAnnouncements($user)->whereKey($announcement->id)->exists(), 403);`
— pola identik `IndustryController::show()` baris 130.

**Pemetaan label di backend** (sesuai `CLAUDE.md`): status & nama role
diterjemahkan di controller, bukan di React.

```php
/**
 * Target pengumuman — persis lima opsi yang diminta, dengan label yang
 * dipakai user di permintaannya. Bukan daftar seluruh role di sistem.
 */
public const ROLE_LABELS = [
    '*' => 'All User',
    'siswa' => 'Murid',
    'guru' => 'Guru Pembimbing',
    'pembimbing' => 'Pembimbing Industri',
    'orangtua' => 'Orangtua',
];
```

**Persis lima opsi yang diminta — tidak lebih.** Permintaannya menyebut:
*"All User, Murid, Guru Pembimbing, Pembimbing Industri, Orangtua"*. `kaprog`,
`wakasek`, dan `admin` **tidak** dijadikan target, dan labelnya memakai kata
yang user tulis sendiri ("All User", bukan "Semua pengguna"; "Orangtua", bukan
"Orang Tua") — supaya yang muncul di layar sama dengan yang ada di kepala
peminta.

Konsekuensi yang harus disadari: kaprog & wakasek **hanya** menerima pengumuman
ber-target `All User`. Itu perilaku yang benar untuk permintaan ini; menambahkan
mereka sebagai opsi terpisah nanti = menambah dua baris di konstanta ini dan nol
perubahan lain.

```php
// ponytail: target dibatasi ke lima opsi yang diminta. Menambah kaprog/wakasek
// sebagai target terpisah = dua baris di ROLE_LABELS, nol perubahan lain.
```

Perhatikan: label yang diminta user (`Murid`, `Guru Pembimbing`,
`Pembimbing Industri`, `Orangtua`) **berbeda** dari nama role internal
(`siswa`, `guru`, `pembimbing`, `orangtua`). Konstanta ini satu-satunya tempat
pemetaan itu hidup.

Status turunan:

```php
$status = match (true) {
    $a->starts_at->isFuture() => 'terjadwal',
    $a->ends_at->isPast() => 'berakhir',
    default => 'tayang',
};
```

### 4.4 Form Request — `StoreAnnouncementRequest`

`php artisan make:request StoreAnnouncementRequest`

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:150'],
        'body' => ['required', 'string', 'max:20000'],
        'roles' => ['required', 'array', 'min:1'],
        'roles.*' => ['string', Rule::in(array_keys(AnnouncementController::ROLE_LABELS))],
        'starts_at' => ['required', 'date'],
        'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
    ];
}
```

`Rule::in(...)` menutup celah "role sembarang dikirim dari devtools" — tanpa itu
`roles` adalah kolom JSON yang menerima apa pun.

`after()` untuk menormalkan `['*', 'siswa']` → `['*']` (kalau "semua" dicentang,
sisanya tidak bermakna dan hanya membuat data ambigu):

```php
protected function passedValidation(): void
{
    if (in_array('*', $this->input('roles', []), true)) {
        $this->merge(['roles' => ['*']]);
    }
}
```

`UpdateAnnouncementRequest` `extends` yang di atas tanpa perubahan aturan
(pola yang sudah ada: `UpdateIndustryRequest`).

### 4.5 Rute — `routes/web.php`

Diletakkan **di grup baru** setelah grup approval (baris ~261):

```php
// Pengumuman — dibuat admin & guru pembimbing, tampil di dashboard target.
Route::middleware('role:admin|guru')->group(function (): void {
    Route::resource('pengumuman', AnnouncementController::class)
        ->parameters(['pengumuman' => 'announcement'])
        ->except('show')
        ->names('announcements');
});
```

`except('show')` — detail satu pengumuman tidak dibutuhkan; isinya sudah tampil
penuh di dashboard. Pola `parameters()` + `names()` ini persis yang dipakai
`Route::resource('jurnal', ActivityController::class)` (baris 239-242).

Setelah ini: `php artisan wayfinder:generate` (atau otomatis via `npm run dev`).

### 4.6 Share ke dashboard — `HandleInertiaRequests::share()`

```php
'announcements' => fn (): array => $request->routeIs('dashboard')
    ? $this->announcementsFor($request->user())
    : [],
```

```php
/** @return array<int, array<string, mixed>> */
private function announcementsFor(?User $user): array
{
    if ($user === null) {
        return [];
    }

    return Announcement::query()
        ->activeOn(Carbon::today())
        ->with('author:id,name')
        ->latest('starts_at')
        ->get()
        ->filter(fn (Announcement $a): bool => $a->isFor($user))
        ->take(5)
        ->map(fn (Announcement $a): array => [
            'id' => $a->id,
            'title' => $a->title,
            'body' => $a->body,
            'author' => $a->author?->name,
            'until' => $a->ends_at->translatedFormat('d M Y'),
        ])
        ->values()
        ->all();
}
```

`take(5)` **setelah** filter: dashboard bukan arsip. Kalau ada 30 pengumuman
aktif, 5 terbaru yang relevan sudah lebih dari cukup untuk sebuah dashboard.

Tambahkan tipe `announcements` ke `SharedData` di `resources/js/types/`.

### 4.7 Frontend

**Berkas baru:**

- `resources/js/pages/announcements/index.tsx` — tabel + filter status +
  tombol Tambah. Ikuti `docs/UI-PATTERNS.md` §tabel & filter (contoh:
  `pages/students/index.tsx`).
- `resources/js/pages/announcements/create.tsx` & `edit.tsx` — keduanya tipis,
  memanggil satu komponen form (pola `students/create.tsx` + `student-form.tsx`).
- `resources/js/components/announcements/announcement-form.tsx` — judul,
  `RichTextEditor` untuk isi, dua `<input type="date">` untuk periode, dan
  checkbox role.
- `resources/js/components/announcements/announcement-board.tsx` — kartu
  pengumuman untuk dashboard. Tidak me-render apa pun kalau daftarnya kosong
  (`if (announcements.length === 0) return null;`) — dashboard tidak boleh
  menampilkan kotak kosong "belum ada pengumuman".

**Periode: `<input type="date">` bawaan, bukan komponen date picker.**
Native, tervalidasi browser, mendukung keyboard & pembaca layar gratis, dan
sudah dipakai di `pages/leave-requests/index.tsx`. Tidak ada dependensi baru.

**Checkbox role** — bukan `Select` multi (komponen `Select` yang ada bersifat
nilai-tunggal, `docs/UI-PATTERNS.md` §2). Checkbox HTML biasa dengan gaya token
tema. "Semua pengguna" men-`disabled` sisanya:

```tsx
const all = roles.includes('*');
// checkbox lain: disabled={all}, checked={all || roles.includes(value)}
```

**Berkas diubah:**

- `resources/js/lib/nav.ts` — item `Pengumuman` (ikon `Megaphone` dari
  `lucide-react`), `roles: ['admin', 'guru']`. Letakkan di seksi
  **"Dokumen & Forum"** (baris ~210), bersebelahan dengan "Panduan PKL" — sama-sama
  konten yang ditulis staf untuk dibaca orang lain.
- 6 file dashboard — satu baris `<AnnouncementBoard />` masing-masing, tepat di
  bawah `<HeroGreeting>`.
- `resources/js/types/index.ts` (atau `auth.ts`) — tipe `announcements` di
  `SharedData`.

---

## 5. Berkas yang disentuh

**Baru (10):**

```
database/migrations/XXXX_create_announcements_table.php
database/factories/AnnouncementFactory.php
app/Models/Announcement.php
app/Http/Controllers/AnnouncementController.php
app/Http/Requests/StoreAnnouncementRequest.php
app/Http/Requests/UpdateAnnouncementRequest.php
resources/js/pages/announcements/{index,create,edit}.tsx
resources/js/components/announcements/{announcement-form,announcement-board}.tsx
tests/Feature/AnnouncementTest.php
```

**Diubah (10):**

```
routes/web.php                                  (+1 grup rute)
app/Http/Middleware/HandleInertiaRequests.php   (+1 prop, +1 method privat)
resources/js/lib/nav.ts                         (+1 item)
resources/js/types/…                            (+1 tipe)
resources/js/pages/dashboard.tsx
resources/js/pages/dashboard-staff.tsx
resources/js/pages/dashboard-student.tsx
resources/js/pages/dashboard-parent.tsx
resources/js/pages/dashboard-kaprog.tsx
resources/js/pages/dashboard-wakasek.tsx        (masing-masing +1 baris)
```

**Regenerasi:** `resources/js/actions/`, `resources/js/routes/` (jangan
di-edit tangan).

---

## 6. Test — `tests/Feature/AnnouncementTest.php`

Minimal 7 test:

| Test | Yang dijaga |
|---|---|
| `test_admin_can_create_announcement` | happy path store + isi kolom `roles` benar |
| `test_guru_can_create_announcement` | role `guru` tidak tertolak middleware |
| `test_siswa_cannot_access_announcement_index` | 403 dari `role:admin|guru` |
| `test_guru_only_sees_own_announcements` | `scopedAnnouncements()` — guru A tidak melihat milik guru B |
| `test_guru_cannot_edit_other_teachers_announcement` | 403 (bukan sekadar tidak terlihat di daftar) |
| `test_dashboard_only_shares_announcements_targeting_the_user` | **inti fitur** — pengumuman `['siswa']` tidak muncul di dashboard orang tua; `['*']` muncul di semua |
| `test_dashboard_excludes_announcements_outside_their_period` | `starts_at` besok → tidak muncul; `ends_at` kemarin → tidak muncul; `ends_at` **hari ini** → **muncul** (inklusif, §3.5) |

Assertion prop Inertia memakai `assertInertia(fn (Assert $page) => $page->has('announcements', 1))`.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| `share()` menambah kueri di **setiap** request Inertia | Perlambatan menyeluruh | Closure lazy + `routeIs('dashboard')` (§3.4). Verifikasi dengan Laravel Debugbar/Telescope: halaman non-dashboard harus tetap 0 kueri `announcements`. |
| `roles` JSON menerima nilai sembarang | Pengumuman tak pernah tampil / tampil ke semua | `Rule::in()` di Form Request (§4.4) + test |
| Isi `body` dari `RichTextEditor` = HTML → XSS | Serius (pengumuman dibaca semua role) | Ikuti persis cara modul Panduan me-render (`components/ui/rich-text.tsx`). **Jangan** buat `dangerouslySetInnerHTML` baru tanpa sanitasi yang sama. Cek implementasi `rich-text.tsx` sebelum memakai — kalau ia belum menyaring, itu temuan tersendiri dan harus diperbaiki di sini. |
| Timezone: `whereDate` vs `Carbon::today()` | Pengumuman tampil/hilang sehari lebih cepat | Tipe `date` (bukan `datetime`) + `config('app.timezone')` yang sudah dipakai modul absen. Test `ends_at = hari ini`. |
| 6 dashboard, satu lupa dipasang | Satu role tidak pernah lihat pengumuman | Checklist verifikasi manual: login sebagai ke-6 role. |

**Test lama yang harus tetap hijau:** seluruh `tests/Feature/DashboardTest.php`
(prop dashboard bertambah, tidak berubah) dan test apa pun yang meng-assert
bentuk `usePage().props` bersama.
