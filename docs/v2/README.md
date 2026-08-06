# SIMONIK v2 — Roadmap Perbaikan (Batch UAT Agustus 2026)

Enam temuan lapangan, dipecah jadi 5 fase yang bisa di-*ship* terpisah.
Setiap fase punya dokumen sendiri berisi: akar masalah (dengan bukti kode),
opsi solusi + pro/kontra, keputusan, langkah implementasi, risiko regresi,
dan ekspektasi output.

## Prinsip batch ini

Fitur USP (absensi geofence, jurnal, penilaian, sertifikat, approval) sudah
stabil/LTS. **Tidak ada satu pun fase di bawah yang boleh menyentuh tabel atau
alur modul-modul itu.** Semua perubahan dibatasi pada: lapisan impor Excel,
manajemen akun/peran, dan UI tabel master data.

Aturan main:

1. **Migrasi forward-only.** Tidak ada edit migrasi lama.
2. **Tidak ada abstraksi baru** kecuali dua modul atau lebih benar-benar
   memakainya hari ini. Satu implementasi = tidak perlu interface.
3. **Setiap fase punya minimal 1 test PHPUnit** yang gagal kalau logikanya
   rusak. Bukan suite lengkap — satu test yang tepat sasaran.
4. **Gate rilis:** `composer ci:check` hijau sebelum merge.

## Peta fase

| Fase | Masalah UAT | Sifat | Risiko | Estimasi |
|------|-------------|-------|--------|----------|
| [Fase 1](01-FASE-1-IMPOR-EXCEL.md) | #1 Impor Excel selalu gagal, bahkan dengan template resmi | **Bug kritis** | Rendah | ✅ **selesai** |
| [Fase 2](02-FASE-2-AKUN-MULTI-PERAN.md) | #2 Akun bentrok: kaprog + guru pembimbing tidak bisa login | **Bug arsitektural** | Sedang | ✅ **selesai** |
| [Fase 3](03-FASE-3-TABEL-SISWA.md) | #3 Select & select-all untuk hapus massal · #4 Jarak kolom tabel siswa | Fitur + UI | Rendah | ✅ **selesai** |
| [Fase 4](04-FASE-4-EMAIL-DOMAIN.md) | #5 Seragamkan email ke `@simonik.local` | Konvensi + UX | Rendah | ✅ **selesai** |
| [Fase 5](05-FASE-5-INDUSTRI-DI-PEMBIMBING.md) | #6 Dropdown industri di modul Pembimbing Industri | Fitur | Rendah | ✅ **selesai** |
| [Fase 6](06-FASE-6-HALAMAN-IMPOR.md) | Halaman impor dengan pratinjau + tempel/isi-ke-bawah ala Excel | UX, **opsional** | Rendah | ~12 jam |

## Urutan eksekusi

**1 → 2 → 4 → 5 → 3 → (6).** Kerjakan satu fase sampai tuntas dan ter-*commit*
sebelum membuka fase berikutnya. Jangan menggabung dua fase dalam satu commit —
Fase 2 dan 4 menyentuh berkas yang sama, dan kalau digabung, saat ada regresi
tidak ketahuan yang mana penyebabnya.

| Urutan | Fase | Kenapa di posisi ini | Gerbang sebelum lanjut |
|:--:|---|---|---|
| ~~1~~ ✅ | Fase 1 — Impor Excel | Memblokir seluruh onboarding data. Selama ini rusak, tidak ada gunanya memoles apa pun di sekitarnya | Unduh template siswa → isi 2 baris → unggah → data masuk. Diverifikasi **manual di browser**, bukan hanya test |
| ~~2~~ ✅ | Fase 2 — Multi-peran | Bug kedua yang menghambat pemakaian nyata. Mengubah alur pembuatan akun yang jadi fondasi Fase 4 & 5 | Guru yang dijadikan kaprog bisa login dan melihat kedua menu; mencabut peran kaprog tidak menghapus akunnya |
| ~~3~~ ✅ | Fase 4 — Domain email | Menempel pada alur pembuatan akun yang **baru saja** dirapikan Fase 2. Dikerjakan sebelum Fase 2 = menulis dua kali | Akun baru dari form & impor otomatis `@simonik.local`; akun lama tidak tersentuh |
| ~~4~~ ✅ | Fase 5 — Industri di Pembimbing | Form pembimbing sudah disentuh Fase 2 & 4. Datang terakhir supaya form itu hanya ditulis ulang sekali | Tambah pembimbing + pilih industri dalam satu form; banner "belum ditautkan" hilang |
| ~~5~~ ✅ | Fase 3 — Tabel siswa | Murni frontend + satu endpoint, **nol ketergantungan** ke fase lain. Ditaruh akhir bukan karena tidak penting, tapi karena bisa ditunda tanpa memblokir apa pun | Hapus massal menghormati scoping kaprog; kolom tabel tidak berdempetan di 1366px |
| **1** | Fase 6 — Halaman impor ← satu-satunya sisa | **Opsional.** Tinjau ulang setelah Fase 1 jalan — kalau operator sudah tidak mengeluh, tunda | — |

### Catatan penjadwalan

- **Fase 3 boleh dikerjakan paralel** oleh orang lain kapan saja; ia tidak
  bertabrakan dengan fase mana pun. Kalau timnya satu orang, tetap taruh di
  akhir.
- **Fase 1 + 2 adalah rilis pertama yang layak dikirim** ke sekolah (~9 jam).
  Keduanya bug; sisanya peningkatan. Jangan tahan rilis demi menunggu Fase 3–5.
- **Fase 6 ditinjau ulang, bukan otomatis dikerjakan.** Ia ~12 jam untuk
  keluhan yang mungkin sudah hilang setelah Fase 1. Putuskan berdasarkan
  keluhan nyata sesudahnya, bukan berdasarkan rencana ini.

## Ringkasan akar masalah (detail: [00-RISET-DAN-TEMUAN.md](00-RISET-DAN-TEMUAN.md))

| # | Gejala yang dilaporkan | Akar masalah sebenarnya |
|---|------------------------|--------------------------|
| 1 | "Upload pakai template tetap gagal" | Template = workbook 3 sheet (`Petunjuk`, `Data …`, `Referensi`). Importer tidak mengimplementasi `WithMultipleSheets`, sehingga Laravel Excel menyuapkan **ketiga sheet** ke `collection()` yang sama. Sheet `Petunjuk` dibaca sebagai data → semua baris invalid. Pada siswa yang bersifat *all-or-nothing*, satu sheet rusak = seluruh impor batal. |
| 2 | "Kaprog + guru pembimbing → tidak bisa login" | Identitas orang = baris `users`, dan setiap modul (`kaprog`, `guru`, `pembimbing`, …) **selalu `User::create()` baru** dengan `Rule::unique('users','email')`. Satu orang di dua modul dipaksa punya dua email → operator kehilangan jejak kredensial. Ditambah `DashboardController` memeriksa `guru` sebelum `kaprog`, jadi peran ganda pun salah arah. |
| 3 | Butuh select & select-all | Belum ada; hapus hanya per-baris (`students.destroy`). |
| 4 | Jarak kolom tabel siswa | `<th>/<td>` tidak punya padding horizontal sama sekali (`py-3` saja), kolom mepet saat `min-w-160` tercapai. |
| 5 | Banyak varian domain email | Tidak ada konvensi terpusat. Seeder saja sudah memakai `@simonik.local` **dan** `@simonik.test`; template impor mencontohkan `budi@contoh.sch.id`. |
| 6 | Perlu dropdown industri di form pembimbing | Relasi dimiliki sisi industri (`industries.pembimbing_id`), jadi hanya bisa di-set dari modul Industri. Form pembimbing tidak punya kolomnya. |

## Definition of Done per fase

Sebuah fase dianggap selesai bila:

- [ ] Test PHPUnit fase tersebut hijau (`php artisan test --filter=...`).
- [ ] `composer ci:check` hijau.
- [ ] Diverifikasi manual di browser dengan data nyata (bukan seeder saja).
- [ ] `docs/PROGRESS.md` diperbarui pada commit yang sama.
