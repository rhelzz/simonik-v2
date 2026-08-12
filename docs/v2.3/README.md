# SIMONIK v2.3 — Batch Permintaan Lanjutan

Empat permintaan baru (#14, #15, #16, #17 pada urutan backlog), independen
satu sama lain — bisa dikerjakan dan di-*ship* dalam urutan apa pun. Format
dokumen mengikuti `docs/v2.2/`: kondisi sekarang (dengan bukti kode),
keputusan, rencana implementasi, berkas yang disentuh, test, risiko.

## Peta fase

| Fase | Permintaan | Sifat | Risiko | Ketergantungan |
|------|------------|-------|--------|-----------------|
| [Fase 14](14-FASE-14-FILTER-INDUSTRI-BY-GURU.md) | Data Industri: filter daftar industri by guru | Fitur (filter) | Rendah | Tidak ada |
| [Fase 15](15-FASE-15-RAPIKAN-TABEL-DATA-INDUSTRI.md) | Data Industri: rapikan tabel — kolom alamat terlalu panjang | UX/layout | Sangat rendah | Tidak ada |
| [Fase 16](16-FASE-16-FILTER-STRIP-TANPA-INDUSTRI.md) | Data Siswa: opsi filter "— Belum ada industri —" di dropdown industri | Fitur (filter) | Rendah | Tidak ada |
| [Fase 17](17-FASE-17-HAPUS-BLOKIR-DELETE-PEMBIMBING.md) | Pembimbing Industri: hapus guard backend yang memblokir delete pembimbing terkait industri | Perubahan aturan bisnis | Sedang | Tidak ada |

Tidak ada urutan wajib — keempatnya menyentuh berkas yang berbeda:

- Fase 14: `industries` (controller: filter + opsi guru; frontend: dropdown).
- Fase 15: `industries` (frontend saja — layout tabel).
- Fase 16: `students` (controller: baca query param sebagai string; frontend: opsi dropdown).
- Fase 17: `pembimbings` (controller saja — hapus satu guard).

Fase 14 dan 15 sama-sama menyentuh `industries/index.tsx` — kalau dikerjakan
satu orang, kerjakan **15 dulu lalu 14** (layout tabel duluan supaya kolom
dropdown filter baru dari Fase 14 tidak perlu disesuaikan dua kali dengan
perubahan `colgroup`).

## Aturan main (diwarisi dari `docs/v2.2/README.md`)

1. **Migrasi forward-only.** Tidak ada fase di batch ini yang butuh migrasi
   baru — Fase 16 memanfaatkan nullability `industri_id` yang sudah ada;
   Fase 17 memanfaatkan `nullOnDelete()` yang sudah ada di skema.
2. **Tidak ada abstraksi baru** kecuali dipakai ≥2 tempat hari ini.
3. **Setiap fase minimal 1 test PHPUnit** yang gagal kalau logikanya rusak
   (Fase 15 murni CSS/layout, jadi verifikasi manual di browser menggantikan
   test otomatis — dicatat eksplisit di dokumen fase tersebut).
4. **Gate rilis:** `composer ci:check` hijau sebelum merge.
5. **Tidak menyentuh modul USP** (absensi/jurnal/penilaian/sertifikat/approval)
   — keempat fase ini murni filter, layout tabel, dan satu aturan hapus.

## Definition of Done per fase

- [ ] Test PHPUnit fase tersebut hijau (kecuali Fase 15 — verifikasi manual).
- [ ] `composer ci:check` hijau.
- [ ] Diverifikasi manual di browser dengan data nyata.
- [ ] `docs/PROGRESS.md` diperbarui pada commit yang sama.
