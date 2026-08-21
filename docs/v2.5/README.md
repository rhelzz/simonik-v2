# SIMONIK v2.5 — Forum PKL

Satu modul, satu fase. Bentuknya **forum thread berjudul** (Opsi B) dengan
**tag bebas ber-`#`** sebagai pengelompokan, ditambah **kontrol penuh admin**.

| Fase | Isi | Migrasi | Perkiraan |
|------|-----|---------|-----------|
| [Fase 28](28-FASE-28-FORUM-PKL.md) | Forum PKL: thread + tag + balasan + moderasi | ✅ 3 (1 ubah, 2 tabel baru) | ~12-16 jam |

## Kenapa satu fase, bukan dipecah dua

Godaannya adalah mengirim "forum inti" dulu, lalu "moderasi" menyusul. **Jangan.**
Forum tanpa moderasi yang sudah dibuka ke siswa berarti tidak ada seorang pun
yang bisa menangani satu komentar tidak pantas — dan itu tidak bisa "menyusul
minggu depan". Moderasi ikut di fase yang sama.

## Keputusan yang sudah diambil (dari permintaan user)

| Permintaan | Keputusan |
|---|---|
| "opsi b saja" | Thread **berjudul** — bukan feed. Butuh kolom `title`. |
| "admin bisa control kaya hapus judul, dan lain lainnya" | Admin boleh **ubah & hapus thread/balasan siapa pun**, tutup/buka thread, sematkan, dan mengelola daftar tag. |
| "pengkategorian bivia #" | Tag bebas yang diketik user. |
| "ada pengelompokannya jadinya agar tidak bercampur campur" | Tag ternormalisasi (tabel `tags` + pivot) → daftar thread bisa disaring & dihitung per-tag **di SQL**, bukan di PHP. |
| "# default kaya ask, feedback, dll" | Kolom `is_suggested` pada `tags` — tag saran tampil sebagai chip yang bisa diklik, dan **admin yang menentukan** mana yang jadi saran. |
| "walau # itu di bebaskan" | User tetap boleh mengetik tag baru di luar daftar saran. |

## Aturan main (diwarisi `docs/v2.4/README.md`)

1. **Migrasi forward-only** — tambah migrasi baru, jangan ubah yang sudah
   ter-commit.
2. **Tidak ada abstraksi baru** kecuali dipakai ≥2 tempat hari ini.
3. **Setiap fase minimal 1 test PHPUnit** yang gagal kalau logikanya rusak.
   Fase ini menulis data dari input bebas siswa, jadi minimal **3 test**
   keamanan: XSS, otorisasi hapus/ubah, dan tag sampah.
4. **Gate rilis:** `composer ci:check` hijau sebelum merge.

## Catatan deploy

- **Wajib `npm run build`** (halaman & komponen baru).
- **Membawa migrasi** → backup DB MySQL manual sebelum push (Dokploy
  auto-migrate tanpa backup otomatis).
- **Seeder tag saran wajib dijalankan** di produksi, kalau tidak chip saran
  kosong dan user bingung persis seperti yang dikhawatirkan.
