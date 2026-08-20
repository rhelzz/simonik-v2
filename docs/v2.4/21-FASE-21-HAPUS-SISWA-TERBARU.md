# Fase 21 — Hapus tabel "Siswa terbaru" di dashboard admin

**Status:** 📝 Rencana · **Prioritas:** P3 · **Risiko regresi:** sangat rendah ·
**Migrasi:** tidak · **Perkiraan:** ~20 menit

## 1. Permintaan

> "Pada page admin dashboard Hapus fitur tabel 'Siswa terbaru'"

## 2. Kondisi sekarang

Dua sisi, keduanya harus ikut hilang — kalau hanya sisi React yang dihapus,
kuerinya tetap jalan setiap kali dashboard admin dibuka, selamanya, tanpa
pembaca.

**Backend** — `app/Http/Controllers/DashboardController.php:109-111`
(`adminDashboard()`):

```php
'recentStudents' => $this->presentStudents(
    Student::query()->with(['classes:id,name', 'industries:id,name'])->latest()->take(5),
),
```

**Frontend** — `resources/js/pages/dashboard.tsx`, komponen
`<RecentStudentsTable>` dari `@/components/dashboard/widgets`.

**Pemakai lain `presentStudents()` (JANGAN dihapus):**

| Pemanggil | Baris | Konteks |
|---|---|---|
| `adminDashboard()` | 109 | ← **yang ini saja yang dihapus** |
| `kaprogDashboard()` | 227 | prop `notStartedStudents` — "siswa belum mulai PKL", bukan "siswa terbaru" |
| `staffDashboard()` | 266 | prop `recentStudents` untuk `dashboard-staff.tsx` — **guru/pembimbing, bukan admin** |

**Pemakai lain `RecentStudentsTable` (JANGAN dihapus):**
`resources/js/pages/dashboard-staff.tsx` (baris ~96) dan
`resources/js/pages/dashboard-kaprog.tsx`.

## 3. Keputusan implementasi

### 3.1 Hapus di dua sisi, jangan sentuh yang lain

Permintaannya spesifik: **"page admin dashboard"**. Bukan dashboard guru,
bukan dashboard kaprog. Komponen `RecentStudentsTable` dan method
`presentStudents()` **tetap hidup** karena masih punya 2 pemanggil.

Ini poin penting: "hapus fitur X" tidak berarti "hapus semua kode yang dipakai
fitur X". Menghapus `RecentStudentsTable` akan merusak dua dashboard lain.

### 3.2 Tidak ada penataan ulang layout

Blok itu adalah `<div className="mt-5">` terakhir sebelum penutup — menghapusnya
tidak meninggalkan lubang di grid. Verifikasi visual saja, tidak ada penyesuaian
kelas Tailwind.

---

## 4. Rencana implementasi

1. `app/Http/Controllers/DashboardController.php` — hapus key `'recentStudents'`
   dari array `Inertia::render('dashboard', [...])` di `adminDashboard()`
   (baris 109-111). **Jangan** hapus `presentStudents()`.
2. `resources/js/pages/dashboard.tsx` — hapus blok `<RecentStudentsTable …/>`,
   hapus `recentStudents` dari tipe props, hapus dari destrukturisasi parameter,
   dan hapus `RecentStudentsTable` + tipe `RecentStudent` dari daftar `import`
   **jika tidak ada pemakai lain di file itu**.
3. Jalankan `npx tsc --noEmit` — impor tak terpakai / prop yatim akan ketahuan
   di sini, bukan di produksi.

Urutan ini disengaja: backend dulu. Kalau frontend duluan, ada jendela di mana
prop dikirim tapi tak dipakai — tidak berbahaya, tapi `tsc` tidak akan menolong
menemukan sisa-sisanya.

---

## 5. Berkas yang disentuh

```
app/Http/Controllers/DashboardController.php   (−3 baris)
resources/js/pages/dashboard.tsx               (−~10 baris)
```

Kemungkinan besar juga `tests/Feature/DashboardTest.php` — lihat §6.

---

## 6. Test

**Tidak ada test baru.** Yang wajib: cari assertion lama yang menyebut
`recentStudents` pada dashboard admin:

```bash
grep -rn "recentStudents" tests/
```

Kalau `DashboardTest.php` meng-assert prop tersebut untuk **admin**, assertion
itu dihapus/dibalik jadi `->missing('recentStudents')`. Kalau yang di-assert
adalah dashboard **staff**, biarkan.

`->missing('recentStudents')` lebih baik daripada sekadar menghapus assertion:
ia menjaga agar prop itu tidak diam-diam kembali di kemudian hari.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Ikut menghapus `presentStudents()` | Dashboard kaprog & staff fatal | §3.1 — cek 3 pemanggil sebelum menyentuh apa pun |
| Ikut menghapus `RecentStudentsTable` | `dashboard-staff.tsx` & `dashboard-kaprog.tsx` gagal build | `npx tsc --noEmit` + `npm run build` |
| Impor yatim tertinggal | ESLint gagal di CI | `npx eslint resources/js/pages/dashboard.tsx --fix` |

**Test lama yang harus tetap hijau:** `tests/Feature/DashboardTest.php`
(seluruhnya).
