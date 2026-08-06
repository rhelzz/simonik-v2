# Fase 3 — Tabel Data Siswa: Select-All & Jarak Kolom (Masalah UAT #3 dan #4)

**Status:** ✅ **SELESAI** · **Prioritas:** P1 · **Risiko regresi:** rendah ·
**Perkiraan:** ~4 jam

> **Hasil implementasi** — lihat [§9](#9-hasil-implementasi).

---

## 1. Masalah

> #3 Di Admin > Data User > Data Siswa, tambahkan fitur select & select-all
> untuk mempercepat proses hapus daftar siswa.
>
> #4 Jarak kolom di tabel data siswa agar disesuaikan lagi.

## 2. Kondisi sekarang

- Hapus hanya per-baris: `Route::resource('students', …)` →
  `StudentController::destroy(Request, Student)`. Menghapus 40 siswa = 40 klik
  + 40 konfirmasi.
- `destroy()` menghapus **user**-nya (baris `students` ikut lewat FK cascade)
  dan memanggil `deleteImage($student)`. Ada gerbang otorisasi
  `authorizeStudent($request, $student)` dari `ScopesStudentsByRole` — kaprog
  hanya boleh menyentuh siswa di jurusannya.
- Tabel di `resources/js/pages/students/index.tsx`: seluruh sel hanya
  `py-3` / `pb-3`, tanpa padding horizontal. Hanya kolom pertama (`pl-2`) dan
  terakhir (`pr-2`) yang punya. Pada `min-w-160` kolom Kelas / Industri /
  Status saling menempel.
- Tidak ada pola select/select-all yang bisa dipakai ulang di codebase.

## 3. Bagian #3 — Hapus massal

### Opsi solusi

#### Opsi A — Satu endpoint `students.bulk-destroy` menerima array id ✅ **DIPILIH**

| Pro | Kontra |
|-----|--------|
| Satu request, satu transaksi, satu konfirmasi | Perlu route + method + Form Request baru |
| Otorisasi per-id tetap dijalankan → tidak melubangi scoping | — |
| Bisa melaporkan hasil per item ("38 dihapus, 2 dilewati") | — |

#### Opsi B — Frontend melakukan loop `router.delete()` per id

❌ Ditolak. N request, N redirect, N flash message; gagal separuh jalan
meninggalkan keadaan tak jelas; rawan race dengan pagination.

#### Opsi C — "Select all" lintas halaman (semua hasil filter, bukan hanya halaman ini)

❌ Ditolak **untuk sekarang**. Menggoda, tapi berbahaya: satu klik bisa
menghapus 800 siswa, dan operator tidak melihat apa yang dipilihnya. Ship
select-all **per halaman** dulu (10 baris). Kalau ternyata benar-benar dibutuhkan,
tambahkan sebagai langkah kedua yang eksplisit ("Pilih semua 247 hasil filter")
dengan konfirmasi ketik-jumlah.

### Implementasi backend

```php
// routes/web.php — sebelum Route::resource('students', ...), di grup yang sama
Route::delete('students/bulk', [StudentController::class, 'bulkDestroy'])
    ->name('students.bulk-destroy');
```

> **Penting:** rute ini **harus** dideklarasikan sebelum `Route::resource`,
> persis seperti komentar yang sudah ada di `routes/web.php:105` soal
> `students/export` yang tertangkap `students/{student}`. Jebakan yang sama.

```php
/**
 * Hapus beberapa siswa sekaligus. Setiap id tetap melewati gerbang
 * otorisasi yang sama dengan hapus satuan; id di luar cakupan pemanggil
 * dilewati dan dilaporkan, bukan menggagalkan seluruh operasi.
 */
public function bulkDestroy(BulkDestroyStudentRequest $request): RedirectResponse
{
    $students = Student::query()
        ->whereIn('id', $request->validated('ids'))
        ->get();

    $deleted = 0;
    $blocked = 0;

    DB::transaction(function () use ($request, $students, &$deleted, &$blocked): void {
        foreach ($students as $student) {
            if (! $this->canManageStudent($request, $student)) {
                $blocked++;
                continue;
            }

            $this->deleteImage($student);
            $student->users?->delete();   // cascade ke students
            $deleted++;
        }
    });

    // ... flash "N siswa dihapus" (+ "M dilewati (di luar cakupan Anda)")
}
```

`BulkDestroyStudentRequest`:

```php
'ids'   => ['required', 'array', 'min:1', 'max:200'],
'ids.*' => ['integer', 'distinct', 'exists:students,id'],
```

Batas 200 mencegah satu request menghapus seisi sekolah karena bug frontend.
`max:200` jauh di atas 10 baris per halaman — tidak akan mengganggu pemakaian
normal.

> **Catatan otorisasi.** `StudentController::authorizeStudent()` (baris 40)
> berbentuk `abort_unless($this->scopedStudents($user)->whereKey($student->id)->exists(), 403)`.
> Untuk versi massal kita butuh varian boolean agar bisa melaporkan "dilewati"
> alih-alih menggagalkan semuanya:
>
> ```php
> private function canManageStudent(Request $request, Student $student): bool
> {
>     return $this->scopedStudents($request->user())->whereKey($student->id)->exists();
> }
>
> private function authorizeStudent(Request $request, Student $student): void
> {
>     abort_unless($this->canManageStudent($request, $student), 403);
> }
> ```
>
> **Satu sumber aturan**, bukan dua salinan logika yang bisa menyimpang.
> Keduanya tetap di `StudentController` (bukan di trait `ScopesStudentsByRole`),
> karena hanya controller ini yang memakainya — jangan naikkan ke trait sebelum
> ada pemakai kedua.
>
> Catatan performa: bentuk ini menjalankan satu query per id. Untuk ≤200 id
> itu sepenuhnya baik-baik saja. Kalau nanti batasnya dinaikkan, ganti dengan
> satu `scopedStudents($user)->whereIn('id', $ids)->pluck('id')` lalu bandingkan
> himpunannya.

### Implementasi frontend

Di `resources/js/pages/students/index.tsx`:

```tsx
const [selected, setSelected] = useState<number[]>([]);
const pageIds = students.data.map((s) => s.id);
const allChecked = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
```

- Kolom checkbox paling kiri; header berisi checkbox select-all
  (`indeterminate` bila sebagian terpilih — set lewat `ref` karena atribut
  ini tidak punya prop React).
- Reset `selected` setiap kali `students.current_page` atau filter berubah
  (pilihan tidak boleh "terbawa" ke halaman lain — itulah kenapa Opsi C
  ditolak).
- Bila `selected.length > 0`, tampilkan **action bar** di atas tabel:
  `"12 siswa dipilih"` + tombol `Batal` + tombol `Hapus terpilih` (merah).
- Konfirmasi lewat `Modal` yang sudah ada (`@/components/ui/modal`) — **bukan**
  `window.confirm` — menyebutkan jumlahnya secara eksplisit.
- Kirim lewat helper Wayfinder hasil regenerasi:
  `router.delete(bulkDestroy.url(), { data: { ids: selected } })`.

Aksesibilitas (tidak boleh disederhanakan): setiap checkbox punya
`aria-label` bernama siswa; checkbox header `aria-label="Pilih semua siswa di halaman ini"`;
action bar memakai `role="status"` agar jumlah terpilih dibacakan screen reader.

## 4. Bagian #4 — Jarak kolom

Perbaikan murni CSS, tanpa logika:

| Sekarang | Jadi |
|----------|------|
| `<th className="pb-3 font-semibold">` | `<th className="px-3 pb-3 font-semibold">` |
| `<td className="py-3 text-ink/80">` | `<td className="px-3 py-3 text-ink/80">` |
| `pl-2` / `pr-2` di kolom tepi | `pl-2 pr-3` / `pl-3 pr-2` agar tepi tabel tetap rapat ke kartu |

Tambahan yang layak sekalian:

- Beri lebar minimum pada kolom Status agar badge tidak terpotong:
  `<th className="px-3 pb-3 w-32">`.
- `whitespace-nowrap` pada kolom Kelas dan Status (nilainya pendek dan tidak
  boleh membungkus jadi dua baris).
- Kolom Industri tetap boleh membungkus/truncate — namanya panjang.
- **Jangan** menaikkan `min-w-160`; itu hanya memindahkan masalah ke scrollbar
  horizontal.

Setelah perubahan, jalankan `npm run format` — **jangan** mengurutkan kelas
Tailwind secara manual (plugin Prettier yang mengurus).

Terapkan padding yang sama ke tabel master data lain yang seragam
(`teachers`, `pembimbings`, `kaprogs`, `industries`) supaya tidak muncul tabel
dengan dua gaya spasi berbeda — dan **perbarui `docs/UI-PATTERNS.md`** dengan
padding sel baku, karena dokumen itu yang jadi acuan halaman berikutnya.

## 5. Berkas yang disentuh

```
routes/web.php                                       + students/bulk (sebelum resource)
app/Http/Controllers/StudentController.php           + bulkDestroy(), + canManageStudent()
app/Http/Requests/BulkDestroyStudentRequest.php      BARU
resources/js/pages/students/index.tsx                checkbox, action bar, padding
resources/js/pages/{teachers,pembimbings,kaprogs,industries}/index.tsx  padding saja
docs/UI-PATTERNS.md                                  + padding sel baku
```

## 6. Test

`tests/Feature/StudentBulkDestroyTest.php`:

```
test_admin_dapat_menghapus_beberapa_siswa_sekaligus()
    → 3 siswa, DELETE dengan 2 id → 1 tersisa, akun user-nya juga terhapus

test_kaprog_tidak_dapat_menghapus_siswa_di_luar_jurusannya()
    → 1 siswa dalam cakupan + 1 di luar
    → yang di luar tetap ada, flash menyebut 1 dilewati

test_ids_kosong_ditolak()          → 422
test_lebih_dari_200_id_ditolak()   → 422
```

Test kedua adalah yang paling penting di fase ini: hapus massal adalah tempat
paling mudah untuk tidak sengaja melewati otorisasi.

## 7. Ekspektasi output

**Sebelum:** menghapus satu kelas siswa yang salah impor = 40 klik hapus + 40
konfirmasi, tanpa jaminan tidak ada yang terlewat. Kolom tabel berdempetan di
layar laptop.

**Sesudah:**

- Centang header → 10 baris terpilih → "Hapus terpilih" → satu modal
  konfirmasi menyebut jumlah → selesai.
- Pilihan otomatis bersih saat pindah halaman/ganti filter → tidak ada
  penghapusan mengejutkan.
- Kaprog tetap tidak bisa menyentuh siswa di luar jurusannya, dan diberi tahu
  kalau ada yang dilewati.
- Tabel bernapas: jarak antar kolom konsisten `px-3`, status tidak terpotong,
  dan gaya yang sama berlaku di seluruh tabel master data.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| **Kehilangan data massal karena salah klik** | Modal konfirmasi menyebut jumlah; select-all terbatas per halaman (10); `max:200` di validasi |
| Otorisasi terlewat pada jalur baru | `authorizeStudent()` di-refactor memanggil `canManageStudent()` — satu sumber aturan; ditutup test khusus |
| Route `students/bulk` tertangkap `students/{student}` | Deklarasikan sebelum `Route::resource`, sesuai preseden `students/export` |
| Gambar profil yatim di storage | `deleteImage()` dipanggil per siswa, sama persis dengan `destroy()` satuan |
| Padding baru merusak tabel lain | Perubahan CSS murni; verifikasi visual di layar 1366px dan 1920px sebelum merge |


---

## 9. Hasil implementasi

`composer ci:check` hijau: Pint, PHPStan 0 error, **391/391 test lulus**
(+6 dari `StudentBulkDestroyTest`), eslint + prettier + `tsc` lolos.
Nol migrasi.

### Yang dikerjakan

- **`DELETE students/bulk`** dideklarasikan sebelum `Route::resource`, sesuai
  preseden `students/export`. Dibuktikan oleh test: kalau urutannya salah,
  request tidak akan pernah sampai ke `bulkDestroy()`.
- **`canManageStudent()`** dipakai bersama `authorizeStudent()` — satu sumber
  aturan otorisasi, bukan dua salinan yang bisa menyimpang. Id di luar cakupan
  pemanggil **dilewati dan dilaporkan**, bukan menggagalkan seluruh operasi.
- **`BulkDestroyStudentRequest`** membatasi `max:200` supaya bug frontend tidak
  bisa menghapus seisi sekolah.
- **UI**: kolom checkbox + pilih-semua-halaman-ini (`indeterminate` lewat `ref`),
  action bar `role="status"` yang menyebut jumlah, dan konfirmasi lewat `Modal`
  (bukan `window.confirm`) yang juga menyebut jumlahnya.
- **Padding kolom** `px-3` diterapkan ke tabel siswa **dan** 8 tabel master data
  lain supaya tidak muncul dua gaya spasi. Kolom Kelas & Status diberi lebar
  tetap + `whitespace-nowrap` agar badge tidak terpotong.

### Penyimpangan dari rencana

**Pilihan diturunkan, bukan di-reset lewat `useEffect`.** Rencana §3 menyebut
"reset `selected` setiap kali halaman/filter berubah". Implementasi pertama
memakai `useEffect(() => setSelected([]), [...])` dan **ditolak ESLint**
(`react-hooks/set-state-in-effect`). Diganti nilai turunan:

```tsx
const onPage = selected.filter((id) => pageIds.includes(id));
```

Hasilnya lebih kuat, bukan sekadar lolos linter: pilihan yang tidak terlihat di
halaman ini **tidak mungkin** ikut terkirim, tanpa bergantung pada efek yang
berjalan tepat waktu.

**Padding tepi ditulis eksplisit.** Menggabung `px-3` dengan `pl-2`/`pr-2`
membuat hasilnya bergantung pada urutan properti di CSS Tailwind, bukan urutan
tulisan di JSX. Kolom tepi memakai `pb-3 pr-3 pl-2` / `pb-3 pl-3 pr-2`.

### Yang sengaja tidak dibuat

- **Select-all lintas halaman** (Opsi C) tetap ditolak: satu klik yang
  menghapus ratusan baris tanpa operator melihatnya terlalu berisiko.
- **`canManageStudent()` tidak dinaikkan ke trait `ScopesStudentsByRole`** —
  hanya `StudentController` yang memakainya. Naikkan saat ada pemakai kedua.

### Belum

Verifikasi manual di browser, termasuk memeriksa tabel di lebar 1366px.
