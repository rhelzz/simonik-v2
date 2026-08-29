# SIMONIK v2.6 — Request Update 27 Agustus 2026

Sumber: `SIMONIK V2 - Catatan Perbaikan.xlsx`, termasuk 6 gambar tertanam.
Dokumen ini adalah urutan eksekusi, bukan tanda bahwa fiturnya sudah selesai.

## Status awal

| Status audit | Request |
|---|---|
| Sudah ada; jangan dibangun ulang | PKL-001, PKL-012, PKL-013 |
| Parsial | PKL-002, PKL-003, PKL-004, PKL-005, PKL-008, PKL-014 |
| Belum ada | PKL-006, PKL-007, PKL-009, PKL-010, PKL-011 |

Detail bukti dan kriteria terima ada di [00-TRACEABILITY.md](00-TRACEABILITY.md).

## Urutan eksekusi

| Fase | Request | Prioritas | Risiko | Migrasi | Bergantung pada |
|---|---|---:|---|---|---|
| [29](29-LOGIN-DOMAIN.md) | PKL-002 — placeholder login | P1 | Rendah | Tidak | — |
| [30](30-IMPORT-ORANG-TUA.md) | PKL-014 — impor orang tua + tautan anak | P1 | Sedang | Tidak | — |
| [31](31-SEMANTIK-KEHADIRAN.md) | PKL-003 — masuk, pulang, dan definisi hadir | P1 | **Tinggi** | Tidak | — |
| [32](32-KETERLAMBATAN-DAN-JAM-PULANG.md) | PKL-004 — menit terlambat + batas checkout | P1 | **Tinggi** | Tidak* | Fase 31 |
| [33](33-PRESENSI-DIWAKILKAN.md) | PKL-005 + PKL-006 — anulir masuk/pulang | P1 | **Tinggi** | Tidak | Fase 31–32 |
| [34](34-PEMERIKSAAN-JURNAL.md) | PKL-007 — Belum/Sudah Dilihat | P1 | Sedang | Tidak** | — |
| [35](35-PENILAIAN-INDUSTRI.md) | PKL-008 — penilaian penuh industri | P1 | **Tinggi** | Ya | — |
| [36](36-INFORMASI-GRADE-DAN-SIDEBAR.md) | PKL-009 + PKL-010 — info grade dan terminologi menu | P2 | Rendah | Tidak | Fase 35 |
| [37](37-RINGKAS-PENILAIAN-PKL.md) | PKL-011 — hapus Libur/Jurnal/rata-rata | P2 | Rendah | Tidak | Fase 36 |

\* Menit terlambat dihitung dari `arrivalTime - industry.jam_masuk`; tidak
disimpan ulang. Tambah kolom hanya jika kemudian dibutuhkan koreksi historis jam kerja.

\** Kolom `activities.verified` sudah ada. Fase 34 memakai kolom itu; tidak
membuat tabel atau kolom kedua.

PKL-001 menunggu teks panduan dari pemilik produk. PKL-012 dan PKL-013 cukup
menjalani regression check setelah fase terakhir.

## Aturan eksekusi satu per satu

1. Kerjakan hanya satu dokumen fase per instruksi user.
2. Sebelum edit, baca ulang fase, caller terkait, route, policy/scope, dan test lama.
3. Jangan mengerjakan fase berikutnya “sekalian”, meskipun filenya sama.
4. Migrasi selalu forward-only.
5. Query siswa wajib memakai `ScopesStudentsByRole` bila datanya role-scoped.
6. Satu definisi bisnis harus diperbaiki di helper bersama, bukan ditambal di tiap UI.
7. Setiap fase memiliki test yang membuktikan acceptance criteria utamanya.
8. Gate fase: test fokus hijau, `composer ci:check` hijau, dan verifikasi browser
   pada role yang disebutkan.
9. Setelah fase selesai, ubah statusnya di traceability dan catat di
   `docs/PROGRESS.md`; baru kemudian minta izin masuk fase berikutnya.

## Checkpoint keputusan

Fase 31, 34, dan 35 tidak boleh dimulai sebelum keputusan berikut dikonfirmasi:

- **Kehadiran historis:** data lama tanpa `departureTime` berubah menjadi tidak
  hadir, atau aturan baru hanya berlaku mulai tanggal rilis?
- **Jurnal baru:** bila seluruh jurnal sudah dilihat lalu murid membuat jurnal
  baru, persentase kembali disembunyikan sampai jurnal baru dilihat (default: ya).
- **“Industri” pada penilaian:** dipetakan ke role teknis `pembimbing`, sesuai
  screenshot dan model aplikasi (default: ya).
- **Lima aspek teknis custom:** berlaku per siswa, bukan mengubah master aspek
  sekolah untuk semua siswa (default: per siswa).

## Definition of Done

- Acceptance criteria fase dapat dibuktikan, bukan hanya UI terlihat.
- Otorisasi lintas-role dan lintas-industri diuji.
- Statistik/dashboard/rapor yang terdampak memakai arti data yang sama.
- Tidak ada query/prop mati setelah UI dihapus.
- `composer ci:check` dan build frontend hijau.
- Verifikasi manual desktop dan mobile untuk fase yang mengubah UI.

