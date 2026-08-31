# Fase 39 — Anulir Presensi oleh Pembimbing

**Request:** PKL-006 · **Prioritas:** P1 · **Risiko:** sedang · **Migrasi:** tidak.

**Status:** Selesai.

## Kebutuhan

Admin, pembimbing industri, dan pembimbing sekolah dapat membuka modal
**Presensikan** pada Data Absen untuk mencatat presensi masuk atau pulang murid
dalam cakupan mereka. Waktu presensi dipilih sesuai aksi dan hasil submit
menjadi kehadiran sah di sistem.

## Implementasi minimum

- Modal, pilihan murid, aksi Masuk/Pulang, input waktu, validasi, serta proses
  presensi sudah tersedia dari Fase 33.
- Perbaikan ini membuka capability `proxyAttendance` untuk role `pembimbing`,
  sehingga pembimbing industri dan sekolah melihat tombol/modal yang sama.
- Pembatasan data murid tetap melalui scope role pada Data Absen; tidak ada
  endpoint atau hak akses baru untuk murid di luar cakupan.

## Verifikasi

- Test regresi memastikan pembimbing menerima `can.proxyAttendance = true`.
- Test fokus: **36 test, 349 assertion**.
- Tidak ada migrasi atau perubahan format data presensi.
