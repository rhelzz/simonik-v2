# Fase 40 — Informasi Grade Penilaian PKL

**Request:** PKL-009, 27 Agustus 2026 · **Prioritas:** P1 · **Risiko:** rendah ·
**Migrasi:** tidak.

**Status:** Selesai.

## Kebutuhan

Pada Rekap Penilaian (`/penilaian`), terutama untuk Industri, tampilkan tombol
**Informasi Penilaian** di sebelah kiri ikon lonceng. Tombol membuka modal
kategori grade untuk aspek Teknis dan Non-Teknis; modal dapat ditutup dengan
ikon close atau klik di luar modal.

## Rentang grade revisi

| Nilai | Grade | Keterangan |
|---:|:---:|---|
| 90–100 | A | Sangat Baik |
| 80–89 | B | Baik |
| 71–79 | C | Cukup |
| 0–70 | D | Kurang |

Request menyebut `D < 70` sehingga skor 70 tidak tercakup. Sistem menetapkan
**70 sebagai D** agar setiap skor 0–100 memiliki grade.

## Implementasi minimum

- Reuse modal aplikasi yang sudah mendukung tombol close, backdrop, dan Escape.
- Satu komponen informasi grade dipakai halaman rekap dan detail penilaian.
- Aturan grade frontend dan `Evaluation::gradeFor()` backend diperbarui bersama
  agar nilai, badge, dan laporan konsisten.
- Tidak ada tabel, kolom, atau dependency baru.

## Verifikasi

- Test batas grade: 100/90 = A, 89/80 = B, 79/71 = C, 70/0 = D.
- Gate penuh: **569/569 test, 2.550 assertion**; ESLint, Prettier, TypeScript,
  Pint, dan PHPStan lolos.
- Build produksi Vite/PWA berhasil.
