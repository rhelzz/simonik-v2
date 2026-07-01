# ROADMAP — Konteks, Master Data & Rencana SIMONIK

Dokumen ini = **acuan utama** desain SIMONIK: konteks proyek, **model data & relasi**, desain dashboard/menu, **spec tiap fitur**, dan **matriks hak akses semua role**. [`PROGRESS.md`](PROGRESS.md) hanya merekam **apa yang sudah selesai** per commit.

> Diperbarui saat **scope/desain berubah**. Stack teknis ada di [`../CLAUDE.md`](../CLAUDE.md).

---

## 1. Konteks proyek

- **Apa**: SIMONIK = sistem **monitoring PKL** SMK. Migrasi dari aplikasi lama (`backend/` API + `frontend/` React, deprecated) ke **monolith Inertia** (`simonik-v2`: Laravel 13 + Inertia v2 + React 19 + Tailwind v4).
- **Platform: WEB SAJA — tidak ada app mobile.** Konsekuensi: **siswa absen lewat web** (browser `navigator.geolocation` + kamera/upload foto).
- **Auth**: session guard `web` + `spatie/laravel-permission`.

---

## 2. Aktor / entitas inti & terminologi

| Istilah desain | Model | Role login | Peran |
|---|---|---|---|
| **Siswa** | `Student` | `siswa` | Peserta PKL. Absen + isi jurnal harian. |
| **Guru Pembimbing** | `Teacher` | `guru` | Guru sekolah. Memegang **1+ industri (PT)** → otomatis membimbing siswa di PT itu. Menilai **non-teknis**. |
| **Pembimbing Industri** | `Pembimbing` | `pembimbing` | Pembimbing dari pihak industri. Terikat ke **PT** & siswanya. Menilai **teknis**. Kelola profil industrinya + pantau performa anak magang. |
| **Industri (PT)** | `Industry` | — (bukan akun) | **Container relasi** (guru, pembimbing, siswa). Bukan User — kontrolnya ada di akun **Pembimbing Industri**. Dikelola admin/kaprog sebagai master data. |
| **Orang Tua** | `Parents` | `orangtua` | Wali; terhubung ke siswa (anak). Pantau (read-only). |
| Admin / Kaprog | `User`+role | `admin` / `kaprog` | Pengelola sistem & master data. |
| Kepala Sekolah | `User`+role | `kepala_sekolah` | Oversight/laporan (belum diwujudkan). |

> Industri **bukan lagi akun User** (role `industri` **dihapus** mengikuti penghapusan `mitra`; lihat PROGRESS §27). **7 role kanonik**: admin, kaprog, guru, pembimbing, siswa, orangtua, kepala_sekolah. Cakupan siswa untuk staf: guru lewat `industries.teacher_id`, pembimbing lewat `industries.pembimbing_id`.

---

## 3. Model data & relasi target

```
Jurusan (Departemen) ─┬─< Kelas (Classes) ─< Siswa (Student)
                      └─< Siswa
PKLPeriod ─< Siswa (gelombang)
Industri (PT) ─< Siswa                 (siswa.industri_id)        [PKL placement]
Industri (PT) ─ Pembimbing Industri    (industri.pembimbing_id)   [1 PT → 1 pembimbing industri]
Industri (PT) ─ Guru Pembimbing        (TARGET: industri.guru/teacher_id) [1 guru → banyak PT]
Orang Tua ─< Siswa                     (siswa.parent_id)
```

**Relasi turunan** (lewat industri): guru pembimbing & pembimbing industri "punya" siswa **melalui PT** tempat siswa PKL. Mis. jumlah murid yang ditangani guru = Σ murid di semua PT yang dia pegang.

### Status skema (✅ sudah diimplementasikan)
- ✅ `industries.teacher_id` ditambahkan (1 guru → banyak PT, nullOnDelete); field teks `industryMentorName/No` **dibuang** (pakai entity `Pembimbing` via `industries.pembimbing_id`).
- ✅ `students.teacher_id` **dihapus** — guru pembimbing siswa **diturunkan dari industrinya** (`student → industri → teacher`).
- ✅ Relasi siswa ↔ pembimbing industri juga **diturunkan via industri** (`student → industri → pembimbing`); `Teacher::students()` & `Pembimbing::students()` = `hasManyThrough` lewat `Industry`.
- Kolom siswa lain tetap: `industri_id`, `parent_id`, `class_id`, `departemen_id`, `p_k_l_period_id`.

---

## 4. Dashboard admin (analytical)

Kartu/metric (perluasan dari `DashboardController` + `pages/dashboard.tsx` yang sekarang masih ringkas):

1. **Jumlah murid** — `Student` (archived=false).
2. **Murid PKL berjalan** — `Student` status_pkl = `proses`.
3. **Jumlah guru pembimbing** — `Teacher`.
4. **Jumlah pembimbing industri** — `Pembimbing`.
5. **Jumlah industri (PT)** — `Industry`.
6. **Rate absensi** — % kehadiran, **filter**: hari ini / minggu ini / bulan ini / keseluruhan.
7. **Rate pengisian jurnal harian** — % murid yang konsisten mengisi jurnal, **filter** sama seperti absensi.

> ✅ Dashboard role lain sudah ada (PROGRESS §26, §27): guru/pembimbing → `dashboard-staff` (stat & rate scoped + rekap nilai/grade, tanpa verifikasi); siswa → `dashboard-student` (absen hari ini, nilai, jurnal, quick-action); orangtua → `dashboard-parent` (ringkasan per anak).

---

## 5. Peta sidebar (target, sudut pandang admin)

✅ selesai · 🔄 ada tapi perlu rework · ⏳ Soon

| Menu | Status | Catatan |
|---|---|---|
| **Dashboard** | ✅ | Analytical: 5 ringkasan kuantitatif + rate absensi & rate jurnal dengan filter waktu (§4). |
| **Data User** (dropdown) | ✅ | Dropdown jalan. Submenu: Data Siswa ✅, Guru Pembimbing ✅, Pembimbing Industri ✅, Orang Tua ✅. (Data Industri **dikeluarkan** dari dropdown ini → jadi item Data Master tersendiri, §27.) Relasi via industri sudah terpasang (§3). |
| **Data Industri** | ✅ | Item Data Master tersendiri (CRUD container relasi, tanpa akun). Untuk pembimbing tampil sebagai **Industri Saya** (§27). |
| **Data Jurusan** | ✅ | Referensi relasi murid & industri. |
| **Data Kelas** | ✅ | Referensi relasi murid. |
| **Periode PKL** | ✅ | CRUD gelombang + rentang tanggal. |
| **Forum PKL** | ⏳ | Prioritas rendah. |
| **Panduan PKL** | ✅ | CRUD upload dokumen PDF/Office (admin/kaprog) → lihat & unduh semua role (§22). |
| **Absen Foto + Geo** (siswa) | ✅ | Input absen web (foto `getUserMedia`/upload + `navigator.geolocation`): masuk/pulang/izin/sakit, sekali per hari. |
| **Data Absen** | ✅ | Monitoring **drill-down 4 layer** (§6) Jurusan→Kelas→Murid→**rekap performa**, role-scoped. Verifikasi **dihapus** (§27) → diganti rekap berbasis hitungan (count + rate). |
| **Data Jurnal** | ✅ | Monitoring **drill-down 4 layer** (§6) Jurusan→Kelas→Murid→**rekap performa**, role-scoped. Tanpa verifikasi (§27). Pola identik Data Absen (reuse `ScopesStudentsByRole` + `Breadcrumb`). |
| **Kalender** | ⏳ | Prioritas rendah (menggantikan rencana "Jadwal"). |
| **Aspek Penilaian** | ✅ | Master aspek teknis/non-teknis (CRUD admin) — sumber untuk Rekap Penilaian (§7). |
| **Rekap Penilaian** | ✅ | Input nilai (guru non-teknis, pembimbing teknis) + lihat role-scoped + grade A/B/C/D otomatis (§7). |
| **Sertifikat** | ✅ | CRUD template (latar + anchor x/y, template aktif) + output cetak per siswa via `window.print()` (§8, PROGRESS §23). |

**Menu sisi siswa** (tetap, di luar sudut pandang admin): **Absen Foto + Geo** (input) ✅, **Jurnal harian** (input) ✅, Panduan PKL (baca), Rekap Penilaian (lihat nilai sendiri) ✅, Sertifikat (unduh), Profil ✅.

> Item lama yang **di-drop dari rencana** desain ini: Kunjungan, Sidang, "Jadwal" (→ jadi Kalender), Pengaturan app-level (bisa dipertimbangkan lagi nanti).

---

## 6. Monitoring drill-down (Data Absen & Data Jurnal)

Agar rapi, monitoring dipecah berjenjang (bukan tabel flat):

- **Layer 1** — pilih **Jurusan**
- **Layer 2** — pilih **Kelas** dalam jurusan itu
- **Layer 3** — pilih **Murid** dalam kelas itu
- **Layer 4** — tampil **seluruh data absen** (atau **jurnal**) murid tersebut

Scope per role tetap berlaku (guru = PT yang dipegang, pembimbing = PT-nya, orangtua = anaknya, admin/kaprog = semua). Layer 4 menampilkan **rekap performa** (count kehadiran/jurnal + rate% + nilai/grade) menggantikan verifikasi (§27).

> **Data Absen** ✅ (§20) & **Data Jurnal** ✅ (§21) mengimplementasikan pola ini: scope dibagikan via trait `ScopesStudentsByRole`, navigasi via komponen `Breadcrumb`.

---

## 7. Rekap Penilaian ✅ (implementasi di [`PROGRESS.md`](PROGRESS.md) §18)

- **Master aspek penilaian** (di-CRUD admin, menu **Aspek Penilaian**): kategori **Teknis** & **Non-Teknis**.
  - Field master: **No**, **Kemampuan**. Model `AspekProduktif` (`category`, `no`, `kemampuan`).
  - Tampilan penilaian: No, Kemampuan, **Nilai**, **Grade**, **Kualifikasi/Keterangan**.
- **Pengisian nilai** (`Evaluation`: `student_id` + `aspek_produktif_id` + `score` 0-100, unique):
  - **Non-teknis** → diisi **Guru Pembimbing** (`guru`).
  - **Teknis** → diisi **Pembimbing Industri** (`pembimbing`).
- **Skala grade** (dihitung dari skor, tidak disimpan — `Evaluation::gradeFor()`):
  - **A** 80–100 — Sangat baik
  - **B** 70–79 — Baik
  - **C** 60–69 — Cukup
  - **D** 0–59 — Kurang
- **Lihat hasil** (role-scoped): siswa (nilai sendiri), orang tua (anaknya), admin/kaprog (semua), guru/pembimbing (PT-nya).

---

## 8. Sertifikat ✅ (implementasi di [`PROGRESS.md`](PROGRESS.md) §23)

- CRUD **template sertifikat** (`certificate_templates`): upload **gambar latar** (JPG/PNG) + tandai satu template **aktif**.
- **Mapping anchor teks**: tiap field (nama/nis/nomor/industri/tanggal) punya posisi **x, y** (persen) + ukuran (`cqw`) + perataan + warna + enable. Editor punya **live preview**.
- Output: halaman cetak per siswa (template aktif + data ter-resolve) → **unduh via cetak browser** (`window.print()`, `@page landscape`). Tanpa dependency PDF server.
- Catatan: model lama `Certificate`/`SignatureSetting` **belum dipakai** (kandidat bila perlu menyimpan berkas/tanda tangan tergenerasi).

---

## 9. Periode PKL (gelombang)

- CRUD **gelombang PKL** dengan **rentang tanggal custom** per gelombang. Model: `PKLPeriod` (`name_period`, `start_period`, `end_period`). Jadi referensi siswa (`students.p_k_l_period_id`).

---

## 10. Matriks hak akses (acuan semua role)

C=CRUD/kelola · I=input · V=lihat/monitor · ✓=akses · — =tidak

| Fitur | admin / kaprog | guru | pembimbing | siswa | orangtua |
|---|---|---|---|---|---|
| Dashboard analytical | ✓ penuh | ringkas | ringkas | ringkas | ringkas |
| Data User (CRUD) | C | — | — | — | — |
| Data Industri (CRUD) | C | — | — | — | — |
| Industri Saya (kelola sendiri) | — | — | C (industrinya) | — | — |
| Jurusan / Kelas (CRUD) | C | — | — | — | — |
| Periode PKL (CRUD) | C | — | — | — | — |
| Panduan PKL | C | V | V | V | V |
| Data Absen (monitor + rekap) | V semua | V (PT-nya) | V (PT-nya) | — | V (anak) |
| Data Jurnal (monitor + rekap) | V semua | V (PT-nya) | V (PT-nya) | — | V (anak) |
| Absen Foto + Geo (input) | — | — | — | I | — |
| Jurnal harian (input) | — | — | — | I | — |
| Rekap Penilaian — master aspek | C | — | — | — | — |
| Rekap Penilaian — isi nilai | — | I (non-teknis) | I (teknis) | — | — |
| Rekap Penilaian — lihat | ✓ semua | ✓ (PT-nya) | ✓ (PT-nya) | ✓ (sendiri) | ✓ (anak) |
| Sertifikat | C template | — | — | unduh | — |
| Forum PKL (⏳) | ✓ | ✓ | ✓ | ✓ | — |
| Kalender (⏳) | ✓ | ✓ | ✓ | — | — |
| Profil & ganti sandi | ✓ | ✓ | ✓ | ✓ | ✓ |

> Verifikasi absen/jurnal **dihapus** (§27) — diganti rekap performa berbasis hitungan.

---

## 11. Status implementasi & urutan rekomendasi

**Sudah jadi**: Auth/login, Profil+sandi, Landing, **Dashboard analytical** (5 ringkasan + rate absensi/jurnal filter waktu). **Master data admin penuh**: CRUD Siswa, Guru Pembimbing, Industri, Pembimbing Industri, **Orang Tua** (akun `orangtua`), Jurusan, Kelas, **Periode PKL** — semua gate `admin|kaprog`, relasi via industri terpasang (§3), sidebar dropdown Data User. **Rekap Penilaian** (§7): master Aspek Penilaian (admin) + input nilai guru/pembimbing + lihat role-scoped + grade A/B/C/D otomatis. **Absen Foto + Geo (siswa)**: input kehadiran web (foto + geolokasi, masuk/pulang/izin/sakit), **Pengajuan Libur (M2.1)**, dan **Sakit & Izin (M2.2)**.

Juga sudah jadi: **Absen Foto + Geo (siswa)** + **Jurnal harian (siswa)** input web; **Data Absen** & **Data Jurnal** monitoring drill-down 4 layer + **rekap performa** (count + rate + nilai/grade, tanpa verifikasi §27; scope via trait `ScopesStudentsByRole`, navigasi via `Breadcrumb`); **Industri Saya** (pembimbing kelola industrinya + pantau anak magang, §27); **Panduan PKL** (CRUD dokumen admin + unduh semua role); **Sertifikat** (CRUD template anchor + cetak per siswa, §8). **Kedua rate dashboard** (absensi & jurnal) kini terisi riil.

**Urutan rekomendasi berikutnya:**
1. **Forum PKL** — tanya-jawab antar role (model `Post`/`Comment` sudah ada); CRUD thread + balasan.
2. **Kalender** — agenda/jadwal; prioritas rendah.
3. ~~**Polish**: dashboard ringkas per-role; rapikan role `industri` vs `mitra`~~ ✅ **selesai** (dashboard per-role §26; role `mitra` dihapus §25).
