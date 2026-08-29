# Fase 36 — Informasi Grade dan Terminologi Penilaian

**Request:** PKL-009 + PKL-010 · **Risiko:** rendah · **Migrasi:** tidak.
**Dependency:** Fase 35 selesai.

## Informasi grade

- Tambahkan tombol berlabel/aria-label jelas di halaman Rekap Penilaian.
- Modal memakai komponen `Modal` yang sudah ada: tutup lewat X, Escape, dan backdrop.
- Kategori grade harus berasal dari konstanta/helper yang sama dengan kalkulasi,
  bukan teks angka kedua yang bisa menyimpang.
- Tampilkan A 80–100, B 70–79, C 60–69, D 0–59 beserta keterangannya.

## Sidebar

Urutan akhir grup Penilaian:

1. Aspek Penilaian
2. Penilaian PKL
3. Rekap Penilaian
4. Sertifikat PKL
5. Template Sertifikat PKL

`Penilaian PKL` adalah label route rapor lama. Route/URL tidak perlu diganti.
Hilangkan istilah “Rapor Digital” dari judul, breadcrumb, tombol, print, dan
teks pengguna; nama class/controller boleh tetap agar diff kecil.

## File perkiraan

- `resources/js/pages/assessments/show.tsx`
- `resources/js/lib/grade.ts`
- `resources/js/lib/nav.ts`
- halaman rapor dan breadcrumb yang memuat label lama

## Test dan verifikasi

- Boundary grade 0, 59, 60, 69, 70, 79, 80, 100 sama di UI/backend.
- Modal dapat dioperasikan keyboard dan ditutup sesuai acceptance criteria.
- Urutan/visibility menu benar untuk admin, siswa, dan pembimbing.
- `rg "Rapor Digital" resources/js` tidak menemukan teks pengguna aktif.

