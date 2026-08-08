# Fase 10 — Breadcrumb "Data Absen" Konsisten di Semua Level

**Status:** 📝 Rencana · **Prioritas:** P3 · **Risiko regresi:** sangat rendah ·
**Perkiraan:** ~20 menit

## 1. Permintaan

> "Route page dibuat konsisten, karena ketika klik 'Lihat absen', route page
> nya berubah jadi 'Data Absen > [nama murid]'."

## 2. Kondisi sekarang

Alur "Lihat absen" (dari `dashboard-parent.tsx:117`, `my-industry/show.tsx:226`,
dan `attendance-monitor/students.tsx:128`) semuanya mengarah ke
`AttendanceMonitorController`, dengan 4 halaman berjenjang:

```
attendance-monitor/index.tsx     Data Absen (pilih jurusan)
  → attendance-monitor/classes.tsx    Data Absen > [Jurusan] (pilih kelas)
    → attendance-monitor/students.tsx    Data Absen > [Jurusan] > [Kelas] (pilih murid)
      → attendance-monitor/show.tsx    Data Absen > [Nama Murid] (detail absen)
```

3 dari 4 halaman sudah pakai komponen `<Breadcrumb>` (`@/components/ui/breadcrumb`)
dengan benar — `classes.tsx:28-33`, `students.tsx:40-51`, `show.tsx:55-60`.
Yang **hilang** adalah level paling atas:

`resources/js/pages/attendance-monitor/index.tsx` — tidak ada `<Breadcrumb>`
sama sekali, hanya `<AppLayout title="Data Absen">` lalu langsung heading
"Monitoring kehadiran" (baris 22-39). Ini membuat rantai breadcrumb terasa
"muncul dari udara" begitu user pindah ke halaman kedua — halaman pertama
tidak menunjukkan dirinya sebagai bagian dari hierarki yang sama.

`AppLayout` sendiri (`resources/js/layouts/app-layout.tsx:65-68`) memakai
`title` hanya untuk `<Head title>` (tab browser) + `AppTopbar`, bukan sumber
breadcrumb — jadi perbaikan murni di level halaman, tidak menyentuh layout.

## 3. Rencana implementasi

Tambahkan `<Breadcrumb>` satu-item di `attendance-monitor/index.tsx`, sama
persis pola yang dipakai 3 halaman lain:

```tsx
import { Breadcrumb } from '@/components/ui/breadcrumb';

// di dalam <section className="rounded-3xl bg-surface p-5 sm:p-6">, sebelum <div className="flex items-start gap-3">
<Breadcrumb items={[{ label: 'Data Absen' }]} />
```

Tidak perlu `href` di item ini karena sudah berada di halaman itu sendiri
(pola yang sama dipakai untuk item terakhir di `classes.tsx`/`students.tsx`/
`show.tsx` — item aktif tidak diberi `href`).

Tidak ada perubahan controller/backend — ini murni penambahan komponen yang
sudah ada, bukan komponen baru.

## 4. Berkas yang disentuh

```
resources/js/pages/attendance-monitor/index.tsx   tambah <Breadcrumb items={[{label:'Data Absen'}]} />
```

## 5. Test

Tidak ada test PHPUnit yang relevan (perubahan murni presentasional, tidak
ada logika backend). Verifikasi manual: buka `/attendance-monitor` sebagai
kaprog/guru, pastikan breadcrumb "Data Absen" tampil konsisten di keempat
level saat drill-down ke murid.

## 6. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Ada halaman "Lihat absen" lain yang belum ditemukan saat eksplorasi | Grep `Lihat absen` di `resources/js/pages` sebelum merge untuk memastikan hanya 3 titik masuk yang ada, semuanya sudah mengarah ke `AttendanceMonitorController` |
