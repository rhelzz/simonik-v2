# ROADMAP — Konteks & Rencana SIMONIK

Dokumen ini menyimpan **konteks proyek** dan **rencana ke depan** (visi/fitur yang belum dibangun). Bedakan dengan [`PROGRESS.md`](PROGRESS.md) yang merekam **apa yang sudah selesai** per commit.

> Diperbarui saat **scope/rencana berubah** (bukan tiap commit). Detail teknis stack ada di [`../CLAUDE.md`](../CLAUDE.md).

---

## 1. Konteks proyek

- **Apa**: SIMONIK = sistem **monitoring PKL** (Praktik Kerja Lapangan) untuk SMK. Sedang dimigrasi dari aplikasi lama (`backend/` Laravel API + `frontend/` React, deprecated) ke **monolith Inertia** (`simonik-v2`: Laravel 13 + Inertia v2 + React 19 + Tailwind v4).
- **Platform: WEB SAJA — tidak ada aplikasi mobile.** Konsekuensi penting: **siswa melakukan absensi lewat web** (browser `navigator.geolocation` + kamera/upload foto), bukan via app mobile.
- **Auth**: session guard `web` + `spatie/laravel-permission`. 9 role: `admin`, `kaprog`, `guru`, `pembimbing`, `siswa`, `orangtua`, `industri`, `mitra`, `kepala_sekolah`.
- **Catatan role**: akun login **entitas Industri = role `mitra`**. Verifikasi (absensi/jurnal) oleh `pembimbing` + `industri`/`mitra`.

## 2. Keputusan kunci

- **Web-only** → siswa absen via web (lihat fitur "Absen Foto + Geolokasi").
- **Tidak ada sistem "Bimbingan" terstruktur** → diganti **Forum PKL** (tanya-jawab).
- **Panduan PKL** = satu berkas **PDF** yang diunggah dari sisi admin, dibaca semua role.
- **Rekap Penilaian** = halaman **melihat** nilai PKL: komponen **non-teknikal dinilai pembimbing**, **teknikal dinilai mitra/industri**.
- **Profil** dijadikan **menu sidebar** (sebelumnya hanya lewat kartu user).
- **Pola yang sudah mapan** (dipakai ulang untuk modul baru):
  - CRUD **page-based** (entitas besar: Siswa, Industri) & **modal-based** (entitas kecil: Jurusan, Kelas, Guru, Pembimbing).
  - Buat **akun User + profil dalam 1 transaksi** (Siswa/Industri/Guru/Pembimbing).
  - **Monitoring role-scoped + verifikasi** (Kegiatan, Absensi) — `scopedQuery` per role via `users.students`.
  - **Rich-text** Tiptap + render aman DOMPurify (Kegiatan).

## 3. Peta sidebar (status)

✅ = selesai · ⏳ = "Soon" (placeholder, belum ada route)

| Seksi | Menu | Status | Audiens |
|---|---|---|---|
| Utama | Dashboard | ✅ | semua |
| Utama | Panduan PKL | ⏳ | semua (admin upload) |
| Manajemen | Siswa, Guru, Pembimbing, Industri, Jurusan, Kelas | ✅ | admin/kaprog (+guru/pembimbing utk Siswa/Industri) |
| Monitoring | Absensi (rekap staf) | ✅ | staf |
| Monitoring | Absen Foto + Geo | ⏳ | siswa |
| Monitoring | Jurnal Saya | ✅ | siswa |
| Monitoring | Kegiatan (monitoring) | ✅ | staf |
| Monitoring | Jadwal | ⏳ | staf |
| Monitoring | Kunjungan | ⏳ | staf |
| Monitoring | Forum PKL | ⏳ | semua |
| Penilaian | Rekap Penilaian | ⏳ | semua (siswa lihat sendiri) |
| Penilaian | Sidang | ⏳ | admin/kaprog/guru |
| Penilaian | Sertifikat | ⏳ | admin/kaprog/siswa |
| Akun | Profil | ✅ | semua |
| Akun | Pengaturan | ⏳ | admin |

## 4. Rencana fitur (spec ringkas)

Model domain sudah tersedia di `app/Models/` (diport dari skema lama) — fitur tinggal bangun controller + UI di atasnya.

1. **Absen Foto + Geolokasi (siswa)** — *prioritas, karena web-only.* Siswa absen masuk/pulang lewat web: ambil **foto** (kamera/upload) + **geolokasi** (`navigator.geolocation`), simpan ke `attendances` (`user_id = auth`), status `Masuk`/`Pulang` (juga `Izin`/`Sakit` dengan alasan). Hasilnya tampil di **Absensi** (monitoring staf, sudah jadi) untuk diverifikasi. Model: `Attendance`.
2. **Rekap Penilaian** — lihat nilai PKL. Non-teknikal oleh `pembimbing`, teknikal oleh `mitra`/`industri`. Siswa lihat nilai sendiri; staf lihat siswa bimbingannya (pola role-scoped). Butuh juga sisi **input nilai**. Model: `Evaluation`, `AspekProduktif`.
3. **Forum PKL** — tanya-jawab seputar PKL (pengganti "bimbingan"). Siswa membuat thread/pertanyaan; guru/pembimbing/industri/admin menjawab. Model: `Post`, `Comment`.
4. **Panduan PKL** — admin mengunggah **satu PDF** panduan; semua role melihat/mengunduh. Model: `Setting`/`Link`/`Guide` (pilih yang paling pas saat implementasi).
5. **Kunjungan (Visits)** — catatan kunjungan industri oleh guru/pembimbing (monitoring role-scoped). Model: `Visits`.
6. **Jadwal** — jadwal kunjungan/monitoring. Model: `Schedule`.
7. **Sidang** — penilaian sidang akhir PKL. Model: `SidangAspect`, `SidangScore`, `SidangResult`.
8. **Sertifikat** — sertifikat PKL siswa. Model: `Certificate`.
9. **Pengaturan (app-level)** — pengaturan aplikasi & tanda tangan (admin). Model: `Setting`, `SignatureSetting`.

## 5. Urutan rekomendasi pengerjaan

1. **Absen Foto + Geolokasi (siswa)** — paling krusial: tanpa ini siswa tidak bisa absen sama sekali (web-only).
2. **Rekap Penilaian (+ input nilai)** — lengkapi alur penilaian pembimbing/industri & tampilan nilai siswa.
3. **Forum PKL** — kanal komunikasi pengganti bimbingan.
4. **Panduan PKL** — cepat, melengkapi onboarding siswa.
5. **Kunjungan → Jadwal → Sidang → Sertifikat → Pengaturan** — sisanya, reuse pola yang ada.
