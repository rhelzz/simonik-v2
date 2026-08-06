# Fase 5 — Dropdown Industri di Modul Pembimbing Industri (Masalah UAT #6)

**Status:** belum dikerjakan · **Prioritas:** P1 · **Risiko regresi:** rendah ·
**Perkiraan:** ~3 jam
**Prasyarat:** Fase 2 & 4 (form pembimbing sudah disentuh keduanya — kerjakan
berurutan agar tidak menulis ulang form yang sama tiga kali).

---

## 1. Permintaan

> "Tambahkan kolom dropdown industri (daftar nama industri hasil inputan dari
> modul Data Industri) di modul Pembimbing Industri. Sehingga setelah input
> nama pembimbing industri, kita dapat langsung menentukan nama industrinya."

## 2. Kondisi sekarang

Relasi **dimiliki sisi industri**:

```
industries : id, name, …, pembimbing_id, teacher_id, kuota
pembimbings: id, user_id, name, no_hp, gender
```

`Pembimbing::industry()` adalah `hasOne` terbalik lewat
`industries.pembimbing_id`. Karena itu:

- `PembimbingController::index()` **sudah** menampilkan kolom industri
  (`->with('industry:id,name,pembimbing_id')`) — jadi operator sudah melihat
  kolomnya di tabel, tapi tidak punya cara mengisinya dari sini.
- `create` / `edit` / `store` / `update` **tidak punya field industri sama
  sekali** → penugasan hanya bisa lewat modul Data Industri. Persis
  ketidaknyamanan yang dilaporkan.

**Konsekuensi kardinalitas yang wajib disadari:** `pembimbing_id` adalah kolom
tunggal, bukan pivot. Artinya **satu industri hanya punya satu pembimbing**.
Menugaskan pembimbing B ke industri X yang sudah dipegang A akan **menggeser A
keluar**. Ini bukan bug — ini bentuk skema yang ada — tapi UI harus
mengatakannya, bukan mendiamkannya.

## 3. Opsi solusi

### Opsi A — Field industri di form pembimbing, menulis ke `industries.pembimbing_id` ✅ **DIPILIH**

Menyalin pola yang **sudah ada** di codebase untuk kasus identik:
`KaprogController::syncDepartemens()` + `departemenOptions()`, yang menulis
kepemilikan ke tabel seberang dan menandai opsi yang sudah dipegang orang lain.

| Pro | Kontra |
|-----|--------|
| Nol migrasi, nol perubahan skema | Menulis ke tabel lain dari controller pembimbing — tapi ini sudah jadi pola yang mapan di repo ini |
| Konsisten dengan modul Kaprog → tidak ada pola baru untuk dipelajari | — |
| Modul Data Industri tetap bisa menugaskan seperti biasa; keduanya menulis kolom yang sama | Perlu berhati-hati soal penggeseran pembimbing lama |

### Opsi B — Kolom `industry_id` baru di tabel `pembimbings`

❌ Ditolak, dan ini penting. Akan ada **dua** sumber kebenaran untuk relasi yang
sama (`pembimbings.industry_id` vs `industries.pembimbing_id`), yang pasti
menyimpang begitu satu sisi diubah lewat modul lain. Ini kelas bug yang paling
mahal untuk diperbaiki belakangan, dan menyentuh tabel yang dipakai modul USP
(absensi memakai `industries` untuk geofence, penilaian & sertifikat memakai
`pembimbing_id`).

### Opsi C — Pivot `industry_pembimbing` (banyak industri per pembimbing)

❌ Ditolak untuk batch ini. Migrasi + backfill + mengubah setiap pembacaan
`industries.pembimbing_id` di modul LTS (dashboard, `accountNotice`, approval,
sertifikat, `MyIndustryController`). Kalau memang satu pembimbing perlu
memegang beberapa industri, itu perubahan tersendiri dengan roadmapnya sendiri
— bukan diselundupkan ke perbaikan UAT.

## 4. Rencana implementasi

### 4.1 Controller

```php
// PembimbingController::create()
return Inertia::render('pembimbings/create', [
    'industries' => $this->industryOptions(),
]);

// edit(): sertakan industry_id terpilih
'industry_id' => $pembimbing->industry?->id,
'industries'  => $this->industryOptions($pembimbing->id),
```

```php
/**
 * Opsi industri untuk form, menandai yang sudah dipegang pembimbing lain
 * (satu industri hanya menampung satu pembimbing).
 *
 * @return array<int, array{id: int, name: string, taken_by: string|null}>
 */
private function industryOptions(?int $exceptPembimbingId = null): array
{
    return Industry::query()
        ->with('pembimbing:id,name')
        ->orderBy('name')
        ->get(['id', 'name', 'pembimbing_id'])
        ->map(fn (Industry $i): array => [
            'id' => $i->id,
            'name' => $i->name,
            'taken_by' => $i->pembimbing_id !== null && $i->pembimbing_id !== $exceptPembimbingId
                ? $i->pembimbing?->name
                : null,
        ])
        ->all();
}

/**
 * Tetapkan industri yang dibimbing $pembimbing: klaim yang dipilih, lepas
 * industri lain yang sebelumnya ia pegang. Pembimbing lama pada industri
 * yang diklaim akan tergeser — itu konsekuensi kolom tunggal
 * industries.pembimbing_id, dan sudah diperingatkan di form.
 */
private function syncIndustry(Pembimbing $pembimbing, ?int $industryId): void
{
    Industry::query()
        ->where('pembimbing_id', $pembimbing->id)
        ->when($industryId !== null, fn ($q) => $q->whereKeyNot($industryId))
        ->update(['pembimbing_id' => null]);

    if ($industryId !== null) {
        Industry::query()->whereKey($industryId)->update(['pembimbing_id' => $pembimbing->id]);
    }
}
```

Dipanggil di dalam transaksi `store()` dan `update()` yang sudah ada — jangan
buat transaksi kedua.

### 4.2 Form Request

```php
// Store/UpdatePembimbingRequest::rules()
'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
```

`nullable` disengaja: pembimbing boleh didaftarkan lebih dulu, industrinya
menyusul. Memaksanya wajib akan memblokir alur kerja yang wajar.

### 4.3 Frontend

`resources/js/pages/pembimbings/create.tsx` dan `edit.tsx` mendapat satu field
memakai `Select` dari `@/components/ui/select` (**bukan** `<select>` native —
lihat `docs/UI-PATTERNS.md`):

- Label: **Industri**, opsional, ditempatkan setelah No HP.
- Opsi kosong pertama: `— Belum ditentukan —`.
- Opsi yang `taken_by !== null` diberi keterangan di dalam label:
  `PT Maju Jaya · dipegang Budi` dan ditampilkan meredup — **tetap bisa
  dipilih**, tapi memilihnya memunculkan peringatan inline:
  `"PT Maju Jaya saat ini dipegang Budi. Menyimpan akan memindahkannya ke <nama>."`

  Mencegahnya sama sekali akan memaksa operator bolak-balik ke modul Industri
  untuk melepas dulu — itu justru pekerjaan yang sedang kita hilangkan.
  Peringatan yang jelas lebih baik daripada larangan.

- Kolom **Industri** di `pembimbings/index.tsx` sudah ada; pastikan
  menampilkan `—` bila kosong (perilaku sekarang sudah begitu).

### 4.4 Konsistensi dua arah

Modul Data Industri **tetap** bisa menugaskan pembimbing (jangan dihapus —
ada operator yang bekerja dari sisi industri). Keduanya menulis kolom yang
sama, jadi tidak ada kemungkinan divergensi. Yang perlu dipastikan: form
industri juga harus memperingatkan hal yang sama saat memindahkan pembimbing
yang sudah memegang industri lain.

### 4.5 Efek samping positif yang layak diperiksa

`HandleInertiaRequests::accountNotice()` menampilkan banner
*"Akun Anda belum ditautkan ke industri manapun"* untuk pembimbing tanpa
industri. Setelah fase ini, admin bisa menyelesaikan kondisi itu **langsung
dari modul Pembimbing**, bukan harus pindah modul. Sertakan verifikasi ini
di pengujian manual: buat pembimbing → login sebagai dia → banner muncul →
admin set industrinya → banner hilang.

## 5. Berkas yang disentuh

```
app/Http/Controllers/PembimbingController.php     create/edit/store/update + industryOptions() + syncIndustry()
app/Http/Requests/StorePembimbingRequest.php      + industry_id
app/Http/Requests/UpdatePembimbingRequest.php     + industry_id
resources/js/pages/pembimbings/create.tsx         + Select Industri
resources/js/pages/pembimbings/edit.tsx           + Select Industri
```

**Nol migrasi.** Regenerasi Wayfinder tidak diperlukan (tidak ada rute baru),
tapi `npm run dev` akan menjalankannya otomatis.

## 6. Test

`tests/Feature/PembimbingIndustryTest.php`:

```
test_pembimbing_baru_dapat_langsung_ditugaskan_ke_industri()
    → POST pembimbings.store dengan industry_id
    → assertDatabaseHas('industries', ['id' => X, 'pembimbing_id' => <id baru>])

test_mengganti_industri_melepas_industri_lama()
    → pembimbing pegang A, update ke B
    → A.pembimbing_id null, B.pembimbing_id = pembimbing

test_industri_kosong_melepas_penugasan()
    → update dengan industry_id null → A.pembimbing_id null

test_mengklaim_industri_milik_pembimbing_lain_menggeser_pemilik_lama()
    → industri X dipegang A, B mengklaim
    → X.pembimbing_id = B, dan A tidak lagi memegang industri apa pun
```

Test keempat mengunci perilaku yang paling mudah salah dipahami — sekaligus
mendokumentasikannya sebagai keputusan sadar, bukan kecelakaan.

## 7. Ekspektasi output

**Sebelum:** tambah pembimbing → simpan → buka modul Data Industri → cari
industrinya → edit → pilih pembimbing → simpan. Dua modul, dua form, mudah lupa
langkah kedua sehingga pembimbing terdaftar tapi tidak bisa memakai sistem
(banner "belum ditautkan ke industri").

**Sesudah:**

- Satu form: nama, email, no HP, jenis kelamin, **industri** → simpan → selesai.
- Tabel Pembimbing langsung menampilkan industri yang benar (kolomnya sudah ada).
- Opsi yang sudah dipegang orang lain terlihat jelas beserta nama pemegangnya
  → operator tidak menggeser orang tanpa sadar.
- Berkurangnya pembimbing "yatim" tanpa industri → berkurangnya banner
  peringatan dan tiket dukungan yang mengikutinya.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| **Menggeser pembimbing lama tanpa disadari** | Opsi menampilkan pemegang saat ini; peringatan inline sebelum simpan; ditutup test |
| Divergensi dengan modul Data Industri | Keduanya menulis kolom yang sama (`industries.pembimbing_id`); tidak ada kolom duplikat — inilah alasan Opsi B ditolak |
| Data pembimbing menggantung saat industri dihapus | Perilaku FK sekarang tidak diubah oleh fase ini; verifikasi `onDelete` pada migrasi `industries` sebelum merge dan catat temuannya di sini |
| Daftar industri panjang bikin dropdown tidak terpakai | **Diverifikasi: `resources/js/components/ui/select.tsx` belum punya pencarian** (props-nya hanya `options`, `value`, `onChange`, `placeholder`, `disabled`). Untuk sekarang cukup urutkan menurut nama — daftar industri satu sekolah realistis berada di puluhan, bukan ratusan. Kalau nanti benar-benar mengganggu, tambahkan input filter **di dalam `Select`** sehingga semua modul ikut kebagian, jangan bikin dropdown khusus untuk halaman ini |
