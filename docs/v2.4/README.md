# SIMONIK v2.4 — Batch Pengumuman, Reset Data & Presensi Diwakilkan

Batch permintaan ke-4 dari lapangan. Sumber: satu pesan permintaan user berisi
**13 butir** (1 fitur pengumuman, 2 fitur reset, 6 butir halaman admin,
4 butir halaman guru pembimbing, 2 butir halaman siswa).

Format dokumen mengikuti `docs/v2.3/`: kondisi sekarang (dengan bukti kode),
keputusan, rencana implementasi, berkas yang disentuh, test, risiko.

---

> 📋 **[00-TRACEABILITY.md](00-TRACEABILITY.md) — penelusuran tiap butir
> permintaan → fase → kriteria terima.** Baca itu untuk memastikan tidak ada
> permintaan yang terlewat, dan untuk memeriksa fase yang sudah selesai. Dua
> tafsir dan satu superset ditandai eksplisit di sana.

## 0. Deduplikasi permintaan — 13 butir → 10 fase

Sebelum apa pun, permintaannya dipetakan ulang. **Enam butir ternyata adalah
tiga fitur yang sama, diminta dua kali** (sekali untuk admin, sekali untuk guru
pembimbing) — karena `/monitoring/absen` adalah **satu halaman yang sama** untuk
kedua role (`routes/web.php:279-282`, satu grup
`role:admin|kaprog|wakasek|guru|pembimbing|orangtua`), dengan data yang sudah
dibatasi otomatis oleh `ScopesStudentsByRole`.

| Butir permintaan | Fase | Catatan |
|---|---|---|
| Fitur 1 — Pengumuman | **18** | |
| Fitur 2 — Reset Data Absen (jurusan/kelas/industri) | **19** | digabung dengan butir *admin #6* |
| Admin #6 — reset presensi via modal (tanggal / semua murid / beberapa murid) | **19** | **duplikat parsial** dari Fitur 2; satu modal, kriteria digabung |
| Fitur 3 — Reset Data Jurnal | **20** | mesin yang sama dengan Fase 19 |
| Admin #1 — hapus tabel "Siswa terbaru" | **21** | |
| Admin #2 — card Rate absensi di Data Absen | **22** | digabung dengan admin #3 (halaman & file yang sama) |
| Admin #3 — hapus grid gap kartu jurusan | **22** | |
| Guru #1 — hapus grid gap kartu jurusan | **22** | **duplikat** admin #3 — file yang sama |
| Admin #4 — tabel sudah/belum presensi | **23** | |
| Guru #2 — tabel sudah/belum presensi | **23** | **duplikat** admin #4 |
| Admin #5 — button presensi diwakilkan | **24** | |
| Guru #3 — button presensi diwakilkan | **24** | **duplikat** admin #5 |
| Guru #4 — edit info industri di halaman detail | **25** | |
| Siswa #1 — sakit tanpa wajib tautan ortu | **26** | |
| Siswa #2 — tidak presensi = Alpha | **27** | |

**Keuntungan:** 3 fitur tidak dibangun dua kali. Yang dibangun sekali,
di-*gate* per-role lewat prop `can` (pola yang sudah ada di
`IndustryController::show()` baris 165-168).

---

## 1. Peta fase

| Fase | Permintaan | Sifat | Risiko | Migrasi | Ketergantungan |
|------|------------|-------|--------|---------|-----------------|
| [Fase 18](18-FASE-18-PENGUMUMAN.md) | Pengumuman multi-role + periode tayang | Fitur baru (modul) | Sedang | ✅ 1 tabel | — |
| [Fase 19](19-FASE-19-RESET-DATA-ABSEN.md) | Reset data absen (jurusan/kelas/industri/tanggal/murid) + password | Fitur destruktif | **Tinggi** | ❌ | — |
| [Fase 20](20-FASE-20-RESET-DATA-JURNAL.md) | Reset data jurnal | Fitur destruktif | **Tinggi** | ❌ | **Fase 19** (pakai action yang sama) |
| [Fase 21](21-FASE-21-HAPUS-SISWA-TERBARU.md) | Hapus tabel "Siswa terbaru" di dashboard admin | Penghapusan | Sangat rendah | ❌ | — |
| [Fase 22](22-FASE-22-DATA-ABSEN-RATE-DAN-LAYOUT.md) | Card Rate absensi + rapikan grid kartu jurusan | UX + reuse | Rendah | ❌ | — |
| [Fase 23](23-FASE-23-TABEL-SUDAH-BELUM-PRESENSI.md) | Tabel murid sudah/belum presensi | Fitur (read) | Sedang | ❌ | — |
| [Fase 24](24-FASE-24-PRESENSI-DIWAKILKAN.md) | Presensi diwakilkan guru/admin (tanpa geo & foto) | Fitur (write) | Sedang | ❌ | Fase 23 (UI menempel di sana) |
| [Fase 25](25-FASE-25-GURU-EDIT-INDUSTRI.md) | Guru pembimbing bisa edit info industri bimbingannya | Perluasan wewenang | Sedang | ❌ | — |
| [Fase 26](26-FASE-26-SAKIT-TANPA-ORTU.md) | Sakit & izin jadi **satu tahap** approval (Guru Pembimbing) | Perubahan aturan bisnis | **Tinggi** | ❌ | — |
| [Fase 27](27-FASE-27-ALPHA-TANPA-PRESENSI.md) | Tidak presensi = Alpha | Semantik data | Sedang | ❌ | Fase 23 (definisi "belum presensi" dipakai ulang) |

### Urutan kerja yang disarankan

```
21 → 22 → 23 → 24 → 27      (rantai halaman Data Absen, satu file berulang)
19 → 20                     (rantai reset, action bersama)
18                          (mandiri, tabel baru)
25                          (mandiri)
26                          (mandiri; aturan sudah dikonfirmasi user)
```

### Keputusan user yang sudah masuk (2026-08-20)

| Pertanyaan | Jawaban | Dampak |
|---|---|---|
| Sakit/izin: berapa tahap approval? | **"satu tahap saja"** — berlaku untuk **keduanya** | Fase 26 menyusut drastis: tahap Ortu dihapus total, tanpa penanda tahap. **Efek samping:** Inbox Persetujuan orang tua jadi kosong permanen → menunya ikut dicabut (Fase 26 §3.4) |
| Reset jurnal: badge ikut dicabut? | dijawab dengan pertanyaan balik; **keputusan bawaan: tidak dicabut** | Fase 20 §3.4 — `BadgeAwarder` hanya bisa menambah, tidak ada jalur pencabutan. Jalur upgrade = `badge:recalculate`, bukan menyisipkan pencabutan ke alur reset |
| Kartu jurusan: `gap` dihapus atau sekadar diringkas? | **"ikutin instruksinya saja"** — `gap` dihapus | Fase 22 §3.4 — `gap-3` → `gap-0`, satu kelas. Jumlah kolom & padding **tidak** diubah (tidak diminta). Konsekuensi wajib: tarik border kartu agar tidak dobel 2px |

Alasan: **Fase 21-24 dan 27 semuanya menyentuh rantai halaman Data Absen.**
Mengerjakannya berurutan berarti satu kali baca-paham per file, bukan lima.
Fase 23 harus mendahului 24 dan 27 karena keduanya memakai definisi
"siswa aktif hari ini" yang dibuat di Fase 23.

Fase 19 & 20 boleh paralel dengan rantai di atas (file berbeda), tapi **19
harus selesai lebih dulu dari 20** — Fase 20 hanya memanggil ulang action yang
lahir di Fase 19.

---

## 2. Keputusan lintas-fase (dibaca sekali, berlaku di semua fase)

### 2.1 Tidak ada abstraksi baru kecuali dipakai ≥2 tempat **hari ini**

Diwarisi dari `docs/v2.2/README.md`. Konsekuensi konkret di batch ini:

- `ResetStudentRecords` (Fase 19) **dibuat sebagai action class** karena dipakai
  2 tempat hari ini (absen + jurnal). Ini memenuhi syarat.
- Tabel "sudah/belum presensi" (Fase 23) **tidak** dijadikan komponen generik
  `TableSudahBelum` — dipakai satu tempat. Kalau nanti Data Jurnal minta hal
  serupa, baru diangkat.
- Pengumuman (Fase 18) **tidak** dibuat sebagai sistem notifikasi generik
  (tabel `notifications`, channel, dsb). Satu tabel, satu modul.

### 2.2 Semua pembatasan role lewat `ScopesStudentsByRole`, bukan `if` baru

`app/Http/Controllers/Concerns/ScopesStudentsByRole.php` sudah dipakai 7
controller dan sudah benar untuk ketujuh role (termasuk override
`students.teacher_id` hasil Fase 13). **Setiap query siswa baru di batch ini
wajib berangkat dari `$this->scopedStudents($user)`** — bukan dari
`Student::query()` polos. Ini yang mencegah guru melihat / menghapus /
mempresensikan siswa di luar bimbingannya, tanpa menulis satu pun cek role baru.

Konsekuensi keamanan yang penting: pada Fase 19 (reset), Fase 23 (tabel), dan
Fase 24 (presensi diwakilkan),
**`whereIn('user_id', $this->scopedStudents($user)->select('user_id'))` adalah
baris yang menahan seluruh beban keamanan.** Kalau baris itu hilang, seorang
guru bisa menghapus absen satu sekolah. Setiap fase tersebut punya test khusus
untuk baris itu.

### 2.3 Aksi destruktif: `current_password` bawaan Laravel, bukan `Hash::check` manual

Permintaan user: *"minta masukin password, untuk passwordnya pake password login
admin aja"*.

Laravel sudah punya aturan validasi `current_password` (memverifikasi terhadap
password user yang sedang login, timing-safe, pesan error terlokalisasi).
**Tidak menulis `Hash::check()` manual di controller.**

```php
'password' => ['required', 'current_password'],
```

Ditolak: middleware `password.confirm` bawaan Laravel. Ia memakai session
(`auth.password_timeout`, default 3 jam) — artinya reset kedua dalam 3 jam
**tidak akan meminta password lagi.** Untuk aksi yang menghapus ribuan baris,
"sudah dikonfirmasi 2 jam lalu" bukan konfirmasi.

### 2.4 Aksi destruktif: hitung dulu, hapus kemudian, laporkan angkanya

Tiga lapis, semuanya wajib di Fase 19 & 20:

1. **Pratinjau** — modal menampilkan `N baris akan dihapus` sebelum tombol
   aktif (dihitung server-side lewat endpoint `preview`, bukan ditebak di React).
2. **Password** — §2.3.
3. **Laporan** — flash message menyebut angka nyata yang terhapus, bukan
   "berhasil". Operator harus bisa membedakan "terhapus 240" dari "terhapus 0
   karena filternya salah".

### 2.5 Yang **tidak** dibangun di batch ini (YAGNI, dicatat eksplisit)

| Tidak dibangun | Alasan | Bangun kalau |
|---|---|---|
| Soft-delete / undo untuk reset | Menambah kolom + filter global ke 2 tabel terpanas (absen & jurnal) demi fitur yang dipakai < 1×/semester | Ada laporan salah-reset nyata |
| Tabel audit log reset | Flash + `description` pada baris yang dibuat ulang sudah jadi jejaknya; tabel audit baru = modul baru tanpa pembaca | Ada ≥2 admin yang saling tidak percaya |
| Notifikasi push / email pengumuman | Pengumuman muncul di dashboard — itu yang diminta | User minta eksplisit |
| Lampiran berkas di pengumuman | `RichTextEditor` sudah ada dan dipakai ulang (Fase 18); lampiran tidak diminta | User minta eksplisit |
| Cron nightly penanda Alpha | Fase 27 memilih Alpha **turunan** (dihitung saat dibaca) — nol baris baru, nol job, nol backfill | Alpha perlu bisa dikoreksi manual per-siswa |
| Reset per-industri di modul Jurnal | Jurnal tidak punya relasi industri langsung; ikut lewat siswa — hasilnya identik | — |

---

## 3. Aturan main (diwarisi `docs/v2.2/README.md` & `docs/v2.3/README.md`)

1. **Migrasi forward-only.** Hanya Fase 18 yang butuh migrasi baru (1 tabel
   `announcements`). Fase lain **tidak menyentuh skema sama sekali** — ini
   disengaja: batch ini tidak boleh mengubah bentuk data absen/jurnal yang sudah
   stabil.
2. **Tidak ada abstraksi baru** kecuali dipakai ≥2 tempat hari ini (§2.1).
3. **Setiap fase minimal 1 test PHPUnit** yang gagal kalau logikanya rusak.
   Fase destruktif (19, 20) dan fase yang menulis data (24) minimal **3 test**:
   happy path, penolakan password salah, dan **kebocoran lintas-cakupan**.
4. **Gate rilis:** `composer ci:check` hijau sebelum merge.
5. **Modul USP** (absensi/jurnal/penilaian/sertifikat/approval) **disentuh** di
   batch ini — berbeda dari v2.3. Karena itu Fase 19, 20, 24, 26, 27
   masing-masing punya bagian "Risiko regresi" yang menyebut test lama yang
   harus tetap hijau.

## 4. Definition of Done per fase

- [ ] Test PHPUnit fase tersebut hijau.
- [ ] Test lama yang disebut di bagian "Risiko regresi" fase tersebut tetap hijau.
- [ ] `composer ci:check` hijau.
- [ ] Diverifikasi manual di browser dengan data nyata, **untuk minimal 2 role**
      (admin + guru pembimbing) pada Fase 19, 22, 23, 24.
- [ ] `docs/PROGRESS.md` diperbarui pada commit yang sama.
- [ ] `docs/ROADMAP.md` diperbarui bila fase mengubah keputusan (Fase 26 pasti).

## 5. Catatan deploy untuk batch ini

- **Wajib `npm run build`** (semua fase menyentuh `resources/js/`).
- **Fase 18 membawa migrasi.** Deploy Dokploy auto-migrate saat `git push` tanpa
  backup otomatis → **backup manual DB MySQL sebelum push.**
- **Fase 19 & 20 menghapus data produksi secara permanen.** Jangan aktifkan
  menunya di produksi sebelum backup terjadwal ada, atau minimal sebelum
  operator diberi tahu bahwa reset tidak bisa dibatalkan.
