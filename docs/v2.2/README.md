# SIMONIK v2.2 — Batch Permintaan Lanjutan

Empat permintaan baru (#10, #11, #12, #13 pada urutan backlog), independen
satu sama lain — bisa dikerjakan dan di-*ship* dalam urutan apa pun. Format
dokumen mengikuti `docs/v2.1/`: kondisi sekarang (dengan bukti kode),
keputusan, rencana implementasi, berkas yang disentuh, test, risiko.

## Peta fase

| Fase | Permintaan | Sifat | Risiko | Ketergantungan |
|------|------------|-------|--------|-----------------|
| [Fase 10](10-FASE-10-BREADCRUMB-DATA-ABSEN.md) | Breadcrumb "Data Absen" konsisten di semua level (jurusan → kelas → murid → detail) | UX | Sangat rendah | Tidak ada |
| [Fase 11](11-FASE-11-IMPOR-INDUSTRI-KOORDINAT-OPSIONAL.md) | Latitude/Longitude di impor & form industri jadi opsional, bukan wajib | Validasi | Rendah | Tidak ada |
| [Fase 12](12-FASE-12-ORANGTUA-HANYA-NAMA-WAJIB.md) | Form Orang Tua: hanya field Nama yang wajib (email/password ikut opsional) | Validasi + arsitektur akun | Sedang | Tidak ada |
| [Fase 13](13-FASE-13-DROPDOWN-GURU-PEMBIMBING.md) | Plotting & Penempatan: kolom Guru Pembimbing jadi dropdown aktif, bisa diubah per-siswa lepas dari industri | Fitur + skema data | Sedang–tinggi | Tidak ada |

Tidak ada urutan wajib — keempatnya menyentuh berkas yang berbeda:

- Fase 10: `attendance-monitor` (frontend saja).
- Fase 11: `industries` (Form Request, import, form React).
- Fase 12: `parents` (form, request, controller, model, migrasi).
- Fase 13: `students`/`placements` (migrasi baru, request, controller, frontend).

Kalau dikerjakan satu orang, urutan yang disarankan: **10 → 11 → 12 → 13**
(dari yang paling kecil/aman ke yang paling menyentuh skema data), tapi ini
bukan hard requirement.

## Aturan main (diwarisi dari `docs/v2.1/README.md`)

1. **Migrasi forward-only.** Fase 13 butuh migrasi baru (`students.teacher_id`
   nullable override); Fase 12 kemungkinan butuh migrasi kecil (`parents.user_id`
   nullable) — lihat dokumen masing-masing.
2. **Tidak ada abstraksi baru** kecuali dipakai ≥2 tempat hari ini.
3. **Setiap fase minimal 1 test PHPUnit** yang gagal kalau logikanya rusak.
4. **Gate rilis:** `composer ci:check` hijau sebelum merge.
5. **Tidak menyentuh modul USP** (absensi/jurnal/penilaian/sertifikat/approval)
   di luar breadcrumb Fase 10 — keempat fase ini murni navigasi, validasi
   form, dan plotting.

## Definition of Done per fase

- [ ] Test PHPUnit fase tersebut hijau.
- [ ] `composer ci:check` hijau.
- [ ] Diverifikasi manual di browser dengan data nyata.
- [ ] `docs/PROGRESS.md` diperbarui pada commit yang sama.
