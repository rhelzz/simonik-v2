# Fase 28 — Forum PKL (thread + tag `#` + moderasi admin)

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko:** sedang ·
**Migrasi:** 3 · **Perkiraan:** ~12-16 jam

---

## 1. Kondisi sekarang

**Modalnya sudah ada dan tidak pernah dipakai sama sekali.** `Post` dan
`Comment` beserta migrasinya sudah ada sejak skema awal, tapi:

```
grep -rl "Post::|Comment::" app/Http routes/ resources/js  →  KOSONG
```

Tidak ada controller, rute, halaman, maupun seeder yang menyentuhnya. Menu
**Forum PKL** ada di `resources/js/lib/nav.ts:225` tanpa `href`, jadi tampil
sebagai "coming soon".

Bentuk tabel sekarang:

```php
// 2025_01_01_000019_create_posts_table.php
user_id, content (text), category (string), important (bool), timestamps

// 2025_01_01_000020_create_comments_table.php
post_id, user_id, content (text), timestamps
```

Dua hal yang menentukan rencana ini:

1. **`posts` TIDAK punya kolom `title`.** Tanpa judul, bentuknya feed — dan
   Opsi B yang dipilih user adalah forum thread berjudul.
2. **`posts.category` adalah kolom string tunggal.** Permintaan user adalah tag
   **jamak** dan **bebas**. Satu kolom string tidak bisa menampungnya.

---

## 2. Keputusan implementasi

### 2.1 Tag ternormalisasi (`tags` + `post_tag`), BUKAN kolom JSON

Ini keputusan terpenting di fase ini, dan alasannya bukan kerapian.

Interaksi inti forum adalah **"tampilkan thread ber-tag #absen, halaman 2"**.
Itu berarti penyaringan harus terjadi **di SQL supaya bisa dipaginasi**.

| Pilihan | Kenapa |
|---|---|
| Kolom JSON `tags` | ❌ `JSON_CONTAINS` **tidak ada di SQLite** yang dipakai test suite. Di modul Pengumuman (v2.4 Fase 18) hal ini disiasati dengan menyaring di PHP — sah di sana karena himpunan aktif per hari hanya 0-5 baris. **Di sini thread bisa ratusan**, dan menyaring di PHP berarti menarik semuanya ke memori lalu kehilangan paginasi. |
| Kolom `category` tunggal | ❌ tag harus jamak dan bebas |
| **`tags` + pivot `post_tag`** | ✅ satu `whereHas` yang dipaginasi database, dan jumlah thread per-tag bisa dihitung dengan `withCount` |

Bonus yang datang gratis: daftar tag beserta jumlah pemakaiannya (untuk chip
saran dan halaman kelola tag) tinggal satu kueri.

### 2.2 `posts.category` DIHAPUS, bukan dibiarkan

Setelah ada tag, `category` jadi konsep kedua yang mengerjakan hal yang sama.
Dua konsep untuk satu maksud adalah cara tercepat membuat orang berikutnya
bertanya "yang mana yang dipakai?".

Aman dihapus karena **tabelnya belum pernah berisi data** (§1). Dilakukan lewat
migrasi baru (forward-only), bukan dengan mengubah migrasi lama.

```php
// migrasi baru
$table->dropColumn('category');
```

> Kalau saat implementasi ternyata `posts` sudah berisi data di produksi
> (mis. ada yang mengisi manual), **batalkan penghapusan** dan pindahkan
> nilainya jadi tag lebih dulu. Periksa `select count(*) from posts` sebelum
> menulis migrasi.

### 2.3 `important` dipakai ulang jadi "sematkan", bukan kolom baru

Kolom `important` (boolean) sudah ada dan belum dipakai. Itu persis kebutuhan
"thread yang disematkan di atas". Tidak perlu kolom `is_pinned` baru.

Hanya **admin/kaprog/guru** yang boleh menyematkan.

### 2.4 Tag diketik di field TERSENDIRI, bukan diambil dari isi tulisan

Godaan: mem-parsing `#` dari badan tulisan seperti Twitter. Ditolak karena:

- `#1`, `#RPL2024`, atau `#` dalam potongan kode ikut jadi tag tanpa disengaja.
- Mengubah isi tulisan diam-diam mengubah tag-nya — pengguna tidak menduga
  memperbaiki typo bisa memindahkan thread-nya ke grup lain.

**Dipilih:** satu field "Tag" berisi chip. User mengetik dengan atau tanpa `#`
(keduanya diterima), Enter/koma menambahkan, dan **chip saran** bisa diklik.

```php
// ponytail: tag TIDAK di-parse dari badan tulisan — "#1" dan potongan kode
// akan ikut jadi tag, dan memperbaiki typo di isi akan memindahkan thread ke
// grup lain tanpa disadari penulisnya.
```

### 2.5 Normalisasi tag: satu fungsi, dipakai di satu tempat masuk

Tanpa ini, `#Absen`, `#absen`, dan `#ABSEN` jadi tiga grup berbeda — dan
"pengelompokan agar tidak bercampur" langsung gagal di minggu pertama.

```php
// app/Support/TagName.php
final class TagName
{
    /** Bentuk baku sebuah tag: huruf kecil, tanpa '#', spasi jadi '-'. */
    public static function normalise(string $raw): string
    {
        return Str::of($raw)
            ->replaceMatches('/^#+/', '')   // buang '#' di depan
            ->lower()
            ->replaceMatches('/[^a-z0-9\-_ ]/u', '') // buang simbol & emoji
            ->trim()
            ->replaceMatches('/\s+/', '-')  // spasi -> tanda hubung
            ->limit(30, '')
            ->value();
    }
}
```

Aturan yang mengikutinya:

- `tags.name` **unique** — tag yang sama tidak boleh punya dua baris.
- Tag kosong setelah normalisasi (mis. user mengetik `###`) **dibuang diam-diam**,
  bukan jadi galat validasi: itu salah ketik, bukan kesalahan yang perlu
  dijelaskan.
- **Maksimal 5 tag per thread.** Tanpa batas, satu orang menempelkan 30 tag dan
  seluruh gagasan pengelompokan runtuh.

### 2.6 Tag saran = baris `tags` ber-`is_suggested`, bukan konstanta di kode

Permintaan user: *"siapkan juga # yang memang default kaya ask, feedback, dll"*
**dan** *"admin bisa control"*. Kalau daftar saran ditulis sebagai konstanta PHP,
menambah satu saran berarti deploy ulang.

```php
$table->boolean('is_suggested')->default(false);
```

Seeder awal (bisa diubah admin kapan saja lewat halaman Kelola Tag):

| Tag | Maksud |
|---|---|
| `#ask` | pertanyaan umum |
| `#feedback` | masukan untuk sekolah/aplikasi |
| `#absen` | kendala presensi |
| `#jurnal` | kendala jurnal |
| `#industri` | seputar tempat PKL |
| `#sidang` | persiapan sidang/laporan |
| `#info` | pengumuman ringan antar-siswa |

### 2.7 Siapa boleh apa

| Aksi | siswa | guru / pembimbing / kaprog | admin |
|---|:---:|:---:|:---:|
| Lihat & cari thread | ✅ | ✅ | ✅ |
| Buat thread & balas | ✅ | ✅ | ✅ |
| Ubah/hapus **milik sendiri** | ✅ | ✅ | ✅ |
| Ubah **judul & isi thread siapa pun** | ❌ | ❌ | ✅ |
| Hapus thread/balasan **siapa pun** | ❌ | ✅ | ✅ |
| Tutup / buka thread | ❌ | ✅ | ✅ |
| Sematkan thread | ❌ | ✅ | ✅ |
| Kelola tag (ubah nama, jadikan saran, gabung, hapus) | ❌ | ❌ | ✅ |

Dua baris yang perlu dijelaskan:

- **Guru boleh menghapus, tapi tidak boleh mengubah tulisan orang.** Menghapus
  adalah moderasi; mengubah kalimat orang lain lalu membiarkannya tampil atas
  nama penulis aslinya adalah pemalsuan. Hanya admin yang punya wewenang itu,
  dan pemakaiannya diharapkan langka (memperbaiki judul yang menyesatkan).
- **Forum TIDAK di-scope per industri/jurusan** (Opsi C ditolak). Membubarkan
  forum yang terlanjur terpecah jauh lebih sulit daripada memecah forum yang
  terlanjur ramai.

### 2.8 Isi tulisan: teks biasa, BUKAN HTML

`RichTextEditor` sudah ada dan dipakai Panduan & Pengumuman. **Di sini tidak
dipakai.** Bedanya: Panduan & Pengumuman ditulis staf; forum ditulis **siswa**.

Menyimpan HTML dari input siswa berarti keamanan bergantung pada DOMPurify di
sisi klien tidak pernah luput. Teks biasa + `whitespace-pre-wrap` sudah cukup
untuk tanya-jawab, dan menutup seluruh kelas masalah itu sekaligus.

```php
// ponytail: isi forum disimpan sebagai TEKS BIASA, bukan HTML. Naikkan ke
// rich-text hanya kalau memang diminta, dan saat itu sanitasi wajib
// dilakukan di SERVER, bukan hanya di klien.
```

### 2.9 Yang **tidak** dibangun (dicatat eksplisit)

| Tidak dibangun | Alasan | Bangun kalau |
|---|---|---|
| Tombol "Laporkan" + antrean laporan | Moderasi hapus langsung sudah menutup kebutuhannya; antrean laporan = modul baru tanpa pembaca | Guru kewalahan memantau manual |
| Notifikasi balasan | Belum ada infrastruktur notifikasi di aplikasi ini | Ada modul notifikasi |
| Like / upvote | Tidak diminta | — |
| Lampiran berkas/gambar | Tidak diminta; menambah penyimpanan & moderasi berkas | Diminta eksplisit |
| Balasan bersarang (reply-to-reply) | Satu tingkat sudah cukup untuk tanya-jawab; bersarang butuh UI & kueri rekursif | Percakapan benar-benar bercabang |
| Riwayat suntingan | Berguna kalau admin mengubah tulisan orang, tapi tabel baru tanpa pembaca | Ada sengketa nyata |

---

## 3. Rencana implementasi

### 3.1 Migrasi (3)

```php
// 1. add_title_and_close_to_posts_table
$table->string('title')->after('user_id');
$table->boolean('is_closed')->default(false)->after('important');
$table->dropColumn('category');   // §2.2 — periksa dulu tabelnya kosong
$table->index(['important', 'created_at']);  // daftar: sematan dulu, lalu terbaru

// 2. create_tags_table
$table->id();
$table->string('name')->unique();
$table->boolean('is_suggested')->default(false);
$table->timestamps();

// 3. create_post_tag_table
$table->foreignId('post_id')->constrained()->cascadeOnDelete();
$table->foreignId('tag_id')->constrained()->cascadeOnDelete();
$table->primary(['post_id', 'tag_id']);   // cegah tag ganda di satu thread
```

`primary()` gabungan, bukan `id()` — pivot ini tidak pernah dirujuk sendirian,
dan kunci gabungan sekaligus menjadi penjaga duplikat.

### 3.2 Model

- `Post`: `+title`, `+is_closed`, `-category` di `#[Fillable]` & PHPDoc;
  `casts()` tambah `is_closed`; relasi `tags(): BelongsToMany`;
  scope `scopeWithTag(Builder $q, ?string $tag)`.
- `Tag` (baru): `name`, `is_suggested`, relasi `posts(): BelongsToMany`.
- `Comment`: tidak berubah.

### 3.3 Action — `app/Actions/SyncPostTags.php`

Dipakai `store()` **dan** `update()` (≥2 tempat → memenuhi syarat).

```php
/**
 * Ubah masukan tag mentah jadi relasi. Tag yang belum ada dibuat.
 *
 * @param  array<int, string>  $raw
 */
public function handle(Post $post, array $raw): void
{
    $names = collect($raw)
        ->map(fn (string $tag): string => TagName::normalise($tag))
        ->filter()          // buang yang kosong setelah normalisasi (§2.5)
        ->unique()
        ->take(5);          // batas keras, bukan cuma di validasi frontend

    $ids = $names->map(fn (string $name): int => Tag::firstOrCreate(['name' => $name])->id);

    $post->tags()->sync($ids);
}
```

`firstOrCreate` — tag baru lahir dari pemakaian, itulah maksud "# dibebaskan".

### 3.4 Controller — `ForumController`

| Method | Rute | Catatan |
|---|---|---|
| `index` | `GET /forum` | daftar thread: `withCount('comments')`, `with('user:id,name','tags')`, filter `?tag=`, cari judul, urut **sematan dulu lalu terbaru**, paginate 15 |
| `show` | `GET /forum/{post}` | thread + balasan (paginate 20) |
| `store` | `POST /forum` | judul, isi, tag |
| `update` | `PATCH /forum/{post}` | pemilik **atau** admin (§2.7) |
| `destroy` | `DELETE /forum/{post}` | pemilik, guru/kaprog, admin |
| `toggleClose` | `PATCH /forum/{post}/tutup` | guru ke atas |
| `togglePin` | `PATCH /forum/{post}/sematkan` | guru ke atas |
| `storeComment` | `POST /forum/{post}/komentar` | **ditolak kalau `is_closed`** |
| `destroyComment` | `DELETE /forum/komentar/{comment}` | pemilik, guru ke atas |

Prop `can` per-thread dikirim dari backend (pola `IndustryController::show()`):

```php
'can' => [
    'edit' => $user->can('update', $post),
    'delete' => $user->can('delete', $post),
    'moderate' => $user->hasAnyRole(['admin', 'kaprog', 'guru']),
],
```

### 3.5 Controller — `TagController` (admin saja)

`index` (daftar + jumlah pemakaian), `update` (ubah nama / jadikan saran),
`destroy` (hapus tag; thread tidak ikut terhapus, hanya pivotnya).

**Gabung tag** (`#absensi` → `#absen`) ditunda:

```php
// ponytail: penggabungan tag belum dibuat. Ubah-nama sudah menutup sebagian
// besar kasus; penggabungan baru perlu saat dua tag populer benar-benar
// tumpang tindih. Kalau perlu: sync pivot ke tag tujuan lalu hapus asal.
```

### 3.6 Policy — `PostPolicy`

```php
public function update(User $user, Post $post): bool
{
    // Guru boleh MENGHAPUS, tidak boleh MENGUBAH tulisan orang (§2.7).
    return $post->user_id === $user->id || $user->hasRole('admin');
}

public function delete(User $user, Post $post): bool
{
    return $post->user_id === $user->id
        || $user->hasAnyRole(['admin', 'kaprog', 'guru']);
}

public function moderate(User $user): bool
{
    return $user->hasAnyRole(['admin', 'kaprog', 'guru']);
}
```

### 3.7 Rute

```php
// Forum PKL — semua role boleh membaca & menulis.
Route::get('forum', [ForumController::class, 'index'])->name('forum.index');
Route::get('forum/{post}', [ForumController::class, 'show'])->name('forum.show');
Route::post('forum', [ForumController::class, 'store'])->name('forum.store');
Route::patch('forum/{post}', [ForumController::class, 'update'])->name('forum.update');
Route::delete('forum/{post}', [ForumController::class, 'destroy'])->name('forum.destroy');
Route::post('forum/{post}/komentar', [ForumController::class, 'storeComment'])->name('forum.comments.store');
Route::delete('forum/komentar/{comment}', [ForumController::class, 'destroyComment'])->name('forum.comments.destroy');

Route::middleware('role:admin|kaprog|guru')->group(function (): void {
    Route::patch('forum/{post}/tutup', [ForumController::class, 'toggleClose'])->name('forum.toggle-close');
    Route::patch('forum/{post}/sematkan', [ForumController::class, 'togglePin'])->name('forum.toggle-pin');
});

// Kelola tag — admin saja.
Route::middleware('role:admin')->group(function (): void {
    Route::get('forum-tag', [TagController::class, 'index'])->name('tags.index');
    Route::patch('forum-tag/{tag}', [TagController::class, 'update'])->name('tags.update');
    Route::delete('forum-tag/{tag}', [TagController::class, 'destroy'])->name('tags.destroy');
});
```

`forum/{post}` diletakkan **setelah** rute literal lain agar `forum-tag` tidak
tertangkap sebagai `{post}` — pola yang sama dengan `students/export` di
`routes/web.php`.

### 3.8 Frontend

```
pages/forum/index.tsx            daftar thread + strip tag + kotak cari + tombol Buat
pages/forum/show.tsx             detail thread + balasan + form balas
pages/forum-tags/index.tsx       kelola tag (admin)
components/forum/thread-card.tsx satu baris thread (judul, penulis, tag, jml balasan)
components/forum/tag-input.tsx   input chip + chip saran
components/forum/tag-strip.tsx   deretan tag untuk menyaring
```

- `nav.ts`: **Forum PKL** dapat `href` (menu "coming soon"-nya hilang), semua
  role. Item **Kelola Tag Forum** untuk admin.
- Isi tulisan dirender dengan `whitespace-pre-wrap` (§2.8), **bukan**
  `dangerouslySetInnerHTML`.
- Thread tertutup: form balas diganti keterangan "Diskusi ditutup".

---

## 4. Berkas yang disentuh

**Baru (16):**

```
database/migrations/*_add_title_and_close_to_posts_table.php
database/migrations/*_create_tags_table.php
database/migrations/*_create_post_tag_table.php
database/seeders/TagSeeder.php
database/factories/TagFactory.php
app/Models/Tag.php
app/Support/TagName.php
app/Actions/SyncPostTags.php
app/Policies/PostPolicy.php
app/Http/Controllers/ForumController.php
app/Http/Controllers/TagController.php
app/Http/Requests/{StorePostRequest,UpdatePostRequest,StoreCommentRequest}.php
resources/js/pages/forum/{index,show}.tsx
resources/js/pages/forum-tags/index.tsx
resources/js/components/forum/{thread-card,tag-input,tag-strip}.tsx
tests/Feature/ForumTest.php
tests/Feature/ForumModerationTest.php
tests/Unit/TagNameTest.php
```

**Diubah (4):** `app/Models/Post.php`, `routes/web.php`,
`resources/js/lib/nav.ts`, `database/seeders/DatabaseSeeder.php`.

---

## 5. Test

**`tests/Unit/TagNameTest.php`** (tanpa DB, cepat):

| Test | Yang dijaga |
|---|---|
| `test_hash_and_case_are_normalised` | `#Absen`, `absen`, `#ABSEN` → `absen` |
| `test_spaces_become_hyphens` | `#kendala absen` → `kendala-absen` |
| `test_symbols_and_emoji_are_stripped` | `#ab$en!` → `aben` |
| `test_empty_after_normalisation_returns_empty` | `###` → `''` (dibuang, bukan galat) |

**`tests/Feature/ForumTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_any_role_can_create_thread_and_reply` | alur dasar |
| `test_tags_are_created_and_reused` | `firstOrCreate` — dua thread ber-`#ask` memakai **satu** baris tag |
| `test_thread_is_limited_to_five_tags` | §2.5 — batas ditegakkan di server, bukan cuma UI |
| `test_index_can_filter_by_tag` | inti pengelompokan; pastikan **terpaginasi** |
| `test_pinned_threads_appear_first` | §2.3 |
| `test_cannot_reply_to_closed_thread` | §3.4 |
| `test_body_is_stored_as_plain_text` | §2.8 — kirim `<script>`, pastikan tersimpan apa adanya & **tidak** dirender sebagai HTML |

**`tests/Feature/ForumModerationTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_student_cannot_edit_another_students_thread` | 403 |
| `test_guru_can_delete_any_thread_but_cannot_edit_it` | **§2.7** — pembeda hapus vs ubah |
| `test_admin_can_edit_any_thread_title` | permintaan "admin bisa hapus judul dll" |
| `test_only_admin_can_manage_tags` | 403 untuk guru/kaprog |
| `test_deleting_tag_keeps_the_threads` | hanya pivot yang hilang |
| `test_deleting_thread_removes_its_comments_and_pivot` | cascade benar-benar jalan |

---

## 6. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| XSS dari isi tulisan siswa | Serius — dibaca semua role | Teks biasa, bukan HTML (§2.8) + test |
| Tag berantakan (`#Absen` vs `#absen`) | Pengelompokan gagal total | `TagName::normalise()` di satu pintu masuk (§2.5) + test unit |
| Tag sampah menumpuk | Chip saran & halaman tag jadi berisik | Batas 5 tag/thread; halaman Kelola Tag untuk admin |
| Forum sepi lalu ditinggalkan | Fitur mati | Tag saran di-seed (§2.6) supaya tidak ada layar kosong tanpa arah |
| `posts` ternyata sudah berisi data | Kolom `category` hilang bersama isinya | **Periksa `count(*)` sebelum menulis migrasi** (§2.2) |
| Rute `forum-tag` tertangkap `forum/{post}` | Halaman kelola tag 404 | Urutan rute (§3.7) + test |
| Komentar tidak pantas tanpa penanganan | Masalah nyata di lingkungan sekolah | Moderasi ikut di fase yang sama, bukan menyusul |

**Test lama yang harus tetap hijau:** seluruh suite — fase ini modul baru dan
seharusnya tidak menyentuh apa pun, kecuali `nav.ts` dan `routes/web.php`.
