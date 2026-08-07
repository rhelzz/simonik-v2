# SIMONIK v2.1 — Batch Permintaan Lanjutan

Tiga permintaan baru (#7, #8, #9 pada urutan backlog), independen satu sama
lain — bisa dikerjakan dan di-*ship* dalam urutan apa pun. Format dokumen
mengikuti `docs/v2/`: kondisi sekarang (dengan bukti kode), opsi solusi,
rencana implementasi, berkas yang disentuh, test, risiko.

## Peta fase

| Fase | Permintaan | Sifat | Risiko | Ketergantungan |
|------|------------|-------|--------|-----------------|
| [Fase 7](07-FASE-7-PROFIL-SISWA-MANDIRI.md) | Siswa melengkapi akun login & data diri sendiri dari halaman Profil + peringatan di navbar bila belum lengkap | Fitur | Rendah | Tidak ada — kolom sudah nullable |
| [Fase 8](08-FASE-8-FILTER-PLOTTING.md) | Filter by kelas, industri, guru pembimbing, status PKL di Plotting & Penempatan | Fitur | Rendah | Tidak ada |
| [Fase 9](09-FASE-9-FORM-ORANGTUA-OPSIONAL.md) | Form Orang Tua: hapus semua tanda wajib, ganti Jenis Kelamin → Ayah/Ibu | UX + validasi | Rendah–sedang (lihat §risiko piutang data lama) | Tidak ada |

Tidak ada urutan wajib — ketiganya menyentuh berkas yang berbeda:

- Fase 7: `students`/`profile` (controller, request, halaman profil, navbar).
- Fase 8: `placements` (controller, halaman plotting).
- Fase 9: `parents` (form, request, controller, export, import).

Kalau dikerjakan satu orang, urutan yang disarankan tetap **7 → 8 → 9**
(dari yang paling menyentuh alur inti siswa, ke yang paling terisolasi),
tapi ini bukan hard requirement seperti di `docs/v2/`.

## Aturan main (diwarisi dari `docs/v2/README.md`)

1. **Migrasi forward-only.** Fase 7 sudah tidak butuh migrasi baru — kolom
   profil siswa **sudah** dibuat nullable oleh
   `2026_08_04_210000_make_student_profile_fields_nullable.php`. Fase 9
   kemungkinan butuh 1 migrasi kecil (lihat dokumennya).
2. **Tidak ada abstraksi baru** kecuali dipakai ≥2 tempat hari ini.
3. **Setiap fase minimal 1 test PHPUnit** yang gagal kalau logikanya rusak.
4. **Gate rilis:** `composer ci:check` hijau sebelum merge.
5. **Tidak menyentuh modul USP** (absensi, jurnal, penilaian, sertifikat,
   approval) — ketiga fase ini murni akun/profil, plotting, dan form master
   data.

## Definition of Done per fase

- [ ] Test PHPUnit fase tersebut hijau.
- [ ] `composer ci:check` hijau.
- [ ] Diverifikasi manual di browser dengan data nyata.
- [ ] `docs/PROGRESS.md` diperbarui pada commit yang sama.
