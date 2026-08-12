# Fase 17 — Pembimbing Industri: Hilangkan Blokir Hapus "Masih Terkait Industri"

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** sedang ·
**Perkiraan:** ~45 menit – 1 jam

## 1. Permintaan

> "Pada modul pembimbing industri, hilangkan allert untuk menghapus daftar
> pembimbing industri. allertnya sekarang itu: 'Pembimbing tidak bisa
> dihapus karena masih terkait industri.'"

## 2. Kondisi sekarang

Pesan itu **bukan** dialog konfirmasi frontend — itu adalah pesan error
server-side (flash Inertia) yang muncul dari guard backend nyata:

`app/Http/Controllers/PembimbingController.php:223-234`:

```php
public function destroy(Pembimbing $pembimbing): RedirectResponse
{
    if ($pembimbing->industry()->exists()) {
        return back()->with('error', 'Pembimbing tidak bisa dihapus karena masih terkait industri.');
    }

    $user = $pembimbing->user;
    // Profil pembimbing selalu ikut dilepas: tanpa peran `pembimbing` ia
    // hanya akan memicu spanduk "akun belum ditautkan".
    $pembimbing->delete();
    ...
```

`$pembimbing->industry()` — `app/Models/Pembimbing.php:36-38`,
`hasOne(Industry::class, 'pembimbing_id')`.

Pesan itu dirender oleh banner flash generik di layout, bukan komponen
per-halaman: `resources/js/layouts/app-layout.tsx:19,83-86`.

Confirm dialog yang **memang** di frontend (`resources/js/pages/pembimbings/
index.tsx:89-97`) teksnya beda dan tetap dipertahankan:

```tsx
function remove(pembimbing: Pembimbing) {
    if (confirm(`Hapus pembimbing ${pembimbing.name}? Akun login beserta datanya akan ikut terhapus.`)) {
        router.delete(destroy.url(pembimbing.id), { preserveScroll: true });
    }
}
```

Jadi permintaan "hilangkan alert" = **hapus guard backend**
(`PembimbingController.php:225-227`), bukan mengubah/menghapus `confirm()`
di frontend.

### Kenapa guard itu ada — dan kenapa aman dihapus

Guard ini kemungkinan dibuat berjaga-jaga terhadap FK constraint. Tapi kolom
`industries.pembimbing_id` **sudah** didefinisikan dengan `nullOnDelete()`
sejak awal:

`database/migrations/2025_01_01_000005_create_industries_table.php:25`:

```php
$table->foreignId('pembimbing_id')->nullable()->constrained('pembimbings')->nullOnDelete();
```

Artinya database **sudah** menangani penghapusan pembimbing yang masih
terkait industri secara aman — FK otomatis di-null-kan, tidak ada
`RESTRICT`/error SQL, tidak ada baris industri yang jadi yatim. Guard PHP di
`destroy()` jadi murni pembatasan bisnis tambahan yang lebih ketat daripada
yang dibutuhkan skema — dan ini yang diminta dihapus.

## 3. Keputusan implementasi

### 3.1 Hapus guard, biarkan `nullOnDelete()` yang bekerja

Hapus blok `if ($pembimbing->industry()->exists()) { ... }` di
`destroy()`. Setelah pembimbing dihapus, `industries.pembimbing_id` untuk
industri yang tadinya terkait otomatis jadi `NULL` (ditangani DB, bukan
kode) — kolom "Pembimbing" di tabel Data Industri akan menampilkan strip
(`—`), sama seperti industri yang memang belum pernah punya pembimbing.

### 3.2 Tidak menyentuh apa pun di frontend

`confirm()` di `pembimbings/index.tsx:89-97` sudah cukup sebagai konfirmasi
sebelum hapus, dan sudah menyebutkan konsekuensi ("akun login... ikut
terhapus"). Tidak perlu komponen alert baru maupun perubahan teks.

## 4. Rencana implementasi

### 4.1 Controller — `PembimbingController::destroy()`

```php
public function destroy(Pembimbing $pembimbing): RedirectResponse
{
    $user = $pembimbing->user;

    // Profil pembimbing selalu ikut dilepas: tanpa peran `pembimbing` ia
    // hanya akan memicu spanduk "akun belum ditautkan". Industri yang
    // masih terkait otomatis kehilangan pembimbing_id (nullOnDelete pada
    // migrasi industries) — bukan diblokir.
    $pembimbing->delete();

    // ...sisa method (hapus role/akun user) tidak berubah
}
```

## 5. Berkas yang disentuh

```
app/Http/Controllers/PembimbingController.php   destroy(): hapus guard industry()->exists()
```

## 6. Test

Cek dulu apakah sudah ada test untuk guard lama (kemungkinan
`tests/Feature/PembimbingControllerTest.php` atau serupa) yang mengasserted
pesan error — kalau ada, **update** test itu (jangan hapus tanpa
menggantikannya) supaya tetap ada 1 test yang gagal kalau perilaku hapus
kembali rusak:

```
test_pembimbing_yang_masih_terkait_industri_bisa_dihapus()
    → industri dengan pembimbing_id = pembimbing X
    → DELETE pembimbings.destroy(X)
    → assertDatabaseMissing('pembimbings', ['id' => X])
    → assertDatabaseHas('industries', ['id' => ..., 'pembimbing_id' => null])
    → tidak ada flash 'error'
```

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Guard lama mungkin sengaja dipasang untuk alasan bisnis yang tidak terlihat dari kode (mis. supaya operator sadar dulu sebelum industri kehilangan pembimbing) | Ini keputusan produk eksplisit dari permintaan user (§1) — bukan bug, jadi guard dihapus sesuai instruksi; risikonya murni UX (operator tidak lagi diperingatkan), bukan risiko data (FK sudah aman) |
| Test lama yang mengasserted pesan error lama akan gagal setelah guard dihapus | Ditelusuri & diupdate sebagai bagian dari fase ini (§6), bukan dibiarkan merah |
