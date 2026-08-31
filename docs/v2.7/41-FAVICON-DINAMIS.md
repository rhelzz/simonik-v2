# Fase 41 — Favicon Dinamis

**Request:** PKL-015, 29 Agustus 2026 · **Prioritas:** P1 · **Risiko:** rendah ·
**Migrasi:** tidak.

**Status:** Selesai.

## Masalah

Pengaturan website selalu menimpa `favicon.ico`, tetapi halaman juga memuat
`favicon.svg` statis setelahnya. Browser dapat memilih SVG tersebut sehingga
ikon tab tidak berubah setelah admin mengunggah favicon baru.

## Perbaikan

- Link favicon di layout mengambil nama file dari pengaturan website dan
  menambahkan versi dari waktu pembaruan agar cache browser diperbarui.
- Upload menyimpan ekstensi file yang tervalidasi: **ICO, PNG, JPG/JPEG, SVG**.
- Pengaturan menyimpan nama berkas aktif sehingga halaman pengaturan dan tab
  browser memakai favicon yang sama.
- Tidak ada migrasi, tabel, atau dependency baru.

## Verifikasi

- Test fokus upload ICO dan PNG: **6/6 test, 12 assertion**.
- TypeScript check berhasil.
