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
| **Pembimbing Industri** | `Pembimbing` | `pembimbing` | Pembimbing dari pihak industri. Terikat ke **PT** & siswanya. Menilai **teknis**. Verifikasi. |
| **Industri (PT)** | `Industry` | `mitra` (akun PT) | Tempat PKL. Punya guru pembimbing, pembimbing industri, dan siswa. |
| **Orang Tua** | `Parents` | `orangtua` | Wali; terhubung ke siswa (anak). Pantau (read-only). |
| Admin / Kaprog | `User`+role | `admin` / `kaprog` | Pengelola sistem & master data. |
| Kepala Sekolah | `User`+role | `kepala_sekolah` | Oversight/laporan (belum diwujudkan). |

> Catatan role `industri` vs `mitra`: akun PT yang dibuat modul Industri = **`mitra`**. Role `industri` saat ini hanya akun demo → kandidat dirapikan.

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

### Delta vs skema sekarang (perlu disesuaikan saat implementasi)
- ✅ Ada: `students.industri_id`, `students.teacher_id`, `students.parent_id`, `students.class_id`, `students.departemen_id`, `students.p_k_l_period_id`, `industries.pembimbing_id`.
- ⚠️ **Belum ada relasi `Industri → Guru Pembimbing`** (saat ini guru↔siswa langsung via `students.teacher_id`). Desain baru ingin guru dipegang **per PT** (1 guru → banyak PT). Keputusan implementasi: tambah `industries.teacher_id` (atau pivot) lalu turunkan guru siswa dari industrinya — **atau** pertahankan `students.teacher_id` & tambahkan tampilan "count murid per PT". → diputuskan saat mulai modul.
- ⚠️ `students` **tidak punya** `pembimbing_id` → relasi siswa↔pembimbing industri **diturunkan via industri** (`student → industri → pembimbing`).

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

> Dashboard role lain (guru/pembimbing/siswa/orangtua) = versi ringkas sesuai cakupannya (menyusul).

---

## 5. Peta sidebar (target, sudut pandang admin)

✅ selesai · 🔄 ada tapi perlu rework · ⏳ Soon

| Menu | Status | Catatan |
|---|---|---|
| **Dashboard** | 🔄 | Perluas jadi analytical (§4). |
| **Data User** (dropdown) | 🔄 | Submenu: Data Siswa ✅, Data Guru Pembimbing ✅, Data Industri ✅, Data Pembimbing Industri ✅, Orang Tua ⏳. Perlu nav **submenu/dropdown** + penguatan relasi (§3). |
| **Data Jurusan** | ✅ | Referensi relasi murid & industri. |
| **Data Kelas** | ✅ | Referensi relasi murid. |
| **Forum PKL** | ⏳ | Prioritas rendah. |
| **Panduan PKL** | ⏳ | CRUD upload PDF/dokumen → tampil ke siswa. |
| **Data Absen** | 🔄 | Monitoring **drill-down 4 layer** (§6). Rework dari `AttendanceMonitorController` (sekarang flat). |
| **Data Jurnal** | 🔄 | Monitoring **drill-down 4 layer** (§6). Rework dari `ActivityMonitorController` (sekarang flat). |
| **Kalender** | ⏳ | Prioritas rendah (menggantikan rencana "Jadwal"). |
| **Rekap Penilaian** | ⏳ | CRUD aspek penilaian + alur skor (§7). |
| **Sertifikat** | ⏳ | CRUD template + anchor teks (§8). |
| **Periode PKL** | ⏳ | CRUD gelombang + date range (§9). |

**Menu sisi siswa** (tetap, di luar sudut pandang admin): **Absen Foto + Geo** (input) ⏳, **Jurnal Saya** (input) ✅, Panduan PKL (baca), Rekap Penilaian (lihat nilai sendiri), Sertifikat (unduh), Profil ✅.

> Item lama yang **di-drop dari rencana** desain ini: Kunjungan, Sidang, "Jadwal" (→ jadi Kalender), Pengaturan app-level (bisa dipertimbangkan lagi nanti).

---

## 6. Monitoring drill-down (Data Absen & Data Jurnal)

Agar rapi, monitoring dipecah berjenjang (bukan tabel flat):

- **Layer 1** — pilih **Jurusan**
- **Layer 2** — pilih **Kelas** dalam jurusan itu
- **Layer 3** — pilih **Murid** dalam kelas itu
- **Layer 4** — tampil **seluruh data absen** (atau **jurnal**) murid tersebut

Scope per role tetap berlaku (guru = PT yang dipegang, pembimbing = PT-nya, orangtua = anaknya, admin/kaprog = semua). Verifikasi (pembimbing/industri) tetap pada layer detail.

---

## 7. Rekap Penilaian

- **Master aspek penilaian** (di-CRUD admin): kategori **Teknis** & **Non-Teknis**.
  - Field master: **No**, **Kemampuan** (← yang di-CRUD admin di sini).
  - Tampilan penilaian: No, Kemampuan, **Nilai**, **Grade**, **Kualifikasi/Keterangan**.
- **Pengisian nilai** (refer ke master aspek):
  - **Non-teknis** → diisi **Guru Pembimbing** (`guru`).
  - **Teknis** → diisi **Pembimbing Industri** (`pembimbing`).
- **Skala grade**:
  - **A** 80–100 — Sangat baik
  - **B** 70–79 — Baik
  - **C** 60–69 — Cukup
  - **D** 0–59 — Kurang
- **Lihat hasil**: siswa (nilai sendiri), orang tua (anaknya), admin/kaprog (semua).
- Model kandidat: `AspekProduktif` (master aspek), `Evaluation` (skor per siswa). Perlu cek/flag teknis vs non-teknis.

---

## 8. Sertifikat

- CRUD **template sertifikat**: upload **gambar/PDF** latar.
- **Mapping anchor teks**: posisi **x, y** + perataan (mis. rata tengah) untuk menaruh nama/teks di atas template.
- Output: sertifikat per siswa (unduh). Model kandidat: `Certificate`, `SignatureSetting`.

---

## 9. Periode PKL (gelombang)

- CRUD **gelombang PKL** dengan **rentang tanggal custom** per gelombang. Model: `PKLPeriod` (`name_period`, `start_period`, `end_period`). Jadi referensi siswa (`students.p_k_l_period_id`).

---

## 10. Matriks hak akses (acuan semua role)

C=CRUD/kelola · I=input · V=lihat/monitor · ✓=akses · — =tidak

| Fitur | admin / kaprog | guru | pembimbing | mitra/industri | siswa | orangtua |
|---|---|---|---|---|---|---|
| Dashboard analytical | ✓ penuh | ringkas | ringkas | ringkas | ringkas | ringkas |
| Data User (CRUD) | C | — | — | — | — | — |
| Jurusan / Kelas (CRUD) | C | — | — | — | — | — |
| Periode PKL (CRUD) | C | — | — | — | — | — |
| Panduan PKL | C | V | V | V | V | V |
| Data Absen (monitor) | V semua | V (PT-nya) | V (PT-nya) | V (PT-nya) | — | V (anak) |
| Data Jurnal (monitor) | V semua | V (PT-nya) | V (PT-nya) | V (PT-nya) | — | V (anak) |
| Absen Foto + Geo (input) | — | — | — | — | I | — |
| Jurnal harian (input) | — | — | — | — | I | — |
| Verifikasi absen/jurnal | — | — | ✓ | ✓ | — | — |
| Rekap Penilaian — master aspek | C | — | — | — | — | — |
| Rekap Penilaian — isi nilai | — | I (non-teknis) | I (teknis) | — | — | — |
| Rekap Penilaian — lihat | ✓ semua | ✓ (PT-nya) | ✓ (PT-nya) | — | ✓ (sendiri) | ✓ (anak) |
| Sertifikat | C template | — | — | — | unduh | — |
| Forum PKL (⏳) | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Kalender (⏳) | ✓ | ✓ | ✓ | — | — | — |
| Profil & ganti sandi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 11. Status implementasi & urutan rekomendasi

**Sudah jadi**: Auth/login, Profil+sandi, Landing, Dashboard (ringkas), CRUD Siswa/Industri/Guru/Pembimbing/Jurusan/Kelas, Jurnal Saya (siswa input), monitoring Kegiatan & Absensi (flat + verifikasi).

**Urutan rekomendasi berikutnya:**
1. **Absen Foto + Geolokasi (siswa)** — krusial (web-only); hasil masuk ke monitoring Absen.
2. **Periode PKL (CRUD)** — pondasi gelombang untuk siswa & laporan.
3. **Rekap Penilaian** — master aspek (admin) + input nilai (guru non-teknis, pembimbing teknis) + lihat (siswa/ortu).
4. **Data Absen & Data Jurnal drill-down** — rework monitoring jadi 4 layer (Jurusan→Kelas→Murid→detail).
5. **Dashboard analytical** — metrik + filter (hari/minggu/bulan/keseluruhan).
6. **Panduan PKL** — upload dokumen.
7. **Orang Tua (CRUD + view anak)**, lalu **Sertifikat**.
8. **Forum PKL** & **Kalender** — prioritas rendah.

**Penguatan relasi** (kapan saja sebelum fitur terkait): putuskan relasi **Industri ↔ Guru Pembimbing** (1 guru → banyak PT) dan tampilan **count murid per PT** (§3).
