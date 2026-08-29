# Fase 37 — Ringkas Dokumen Penilaian PKL

**Request:** PKL-011 · **Risiko:** rendah · **Migrasi:** tidak.
**Dependency:** Fase 36 selesai.

**Status:** Selesai — ringkasan rapor dipadatkan sesuai scope tanpa mengubah
nilai akhir, grade, aspek penilaian, QR, atau tata letak cetak.

## Scope

- Pada bagian D, pertahankan Hadir, Izin, Sakit, dan Alpha.
- Hapus Libur dan Jurnal dari tampilan.
- Hapus seluruh blok rata-rata teknis, non-teknis, dan sidang.
- Pertahankan nilai akhir/grade hanya jika bukan bagian dari “semua kolom
  rata-rata”; konfirmasi visual terhadap spreadsheet sebelum edit.
- Hapus prop dan query backend yang tidak lagi mempunyai pembaca.

## File perkiraan

- `resources/js/pages/rapor/show.tsx`
- `app/Http/Controllers/RaporController.php`
- test rapor

## Test wajib

- Render admin dan siswa tidak memuat label Libur, Jurnal, atau Rata-rata.
- Hadir/Izin/Sakit/Alpha dan identitas siswa tetap benar.
- QR, print layout, aspek nilai, dan nilai akhir yang dipertahankan tidak rusak.
- Backend tidak lagi mengirim prop yang sudah dihapus.

## Regression akhir v2.6

Setelah fase ini, jalankan ulang test sertifikat untuk PKL-012/013 dan verifikasi:

- siswa melihat sertifikat sekolah serta industri;
- pembimbing hanya mengelola template dan siswa industrinya;
- tidak ada perubahan hak akses sertifikat akibat perubahan sidebar.
