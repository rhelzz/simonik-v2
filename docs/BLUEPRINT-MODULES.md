# BLUEPRINT MODULES — Peta Eksekusi Fitur Lanjutan PKL (SIMONIK v2)

> Dokumen perencanaan modul untuk **Cetak Biru Sistem Informasi Manajemen PKL**.
> Memecah cetak biru menjadi modul-modul ber-urutan-dependensi agar bisa dikerjakan satu per satu **tanpa tabrakan**.
> Pendamping: [`ROADMAP.md`](ROADMAP.md) (desain/konteks) & [`PROGRESS.md`](PROGRESS.md) (log selesai).

---

## 1. Ringkasan & Tujuan

Aplikasi **SIMONIK v2** yang ada sudah matang (±28 fitur selesai): presensi live-photo + GPS + deteksi emosi, jurnal harian, monitoring drill-down 4 lapis, penilaian multi-aspek, sertifikat template print-to-PDF, RBAC 7 peran (Spatie).

Cetak biru menambahkan **fitur lanjutan** di atas fondasi tersebut — bukan membangun dari nol. Dokumen ini memetakan tiap butir cetak biru ke modul yang jelas batas, prasyarat, dan definisi selesainya, sehingga pengguna dapat memilih urutan pengerjaan dengan aman.

**Keputusan yang sudah dikonfirmasi:**
1. **Peran:** tambah peran `wakasek` (Wakasek Humas/Hubin), **hapus** peran `kepala_sekolah` beserta user-nya (tidak terpakai).
2. **Anti-Fake GPS:** pendekatan **best-effort web heuristics** (ambang akurasi GPS, tolak fix cached/akurasi rendah, tandai lompatan mencurigakan, wajib live face photo) — bukan deteksi mock-location native.

---

## 2. Gap Analysis (Cetak Biru vs App Sekarang)

| Fitur Cetak Biru | Status Sekarang | Aksi | Modul |
|---|---|---|---|
| Live photo + GPS presensi | ✅ Ada (`photo-capture.tsx`, lat/long) | — | — |
| Geofencing (kunci radius) | ✗ GPS disimpan, tak divalidasi | Baru | M1.3 |
| Anti-Fake GPS | ✗ | Baru (heuristics) | M1.3 |
| Mode WFO / WFA | ✗ | Baru | M1.4 |
| Koordinat dinamis multi-peran + radius | Parsial (`industries.lat/long`) | Perluas | M1.1 |
| Jam kerja dinamis → toleransi presensi | ✗ | Baru | M1.2 |
| Cross-Approval (First-to-Approve) WFA & Libur | ✗ | Baru (engine) | M0.3 |
| Sakit/Izin approval (Ortu→Industri) | Parsial (alasan absen saja) | Baru | M2.2 |
| Pengajuan Libur | ✗ | Baru | M2.1 |
| Gamifikasi jurnal (streak, badge) | ✗ jurnal polos | Baru | Fase 3 |
| PWA | ✗ | Baru | M6.1 |
| Auto-gen sertifikat | ✅ Ada (template + print) | — | — |
| QR Code keaslian + verifikasi | ✗ | Baru | M4.1 |
| Rapor Digital (kompilasi PDF) | Parsial (penilaian + sidang ada) | Baru | M4.2 |
| Peran Wakasek Humas/Hubin | ✗ (`kepala_sekolah` nganggur) | Peran baru | M0.1 |
| Akuntabilitas Dana (keuangan) | ✗ | Baru | M5.1 |
| Manajemen Kemitraan + kuota | Parsial (industri ada) | Perluas | M5.2 |
| Supervisi global & statistik | Parsial (dashboard analitik) | Perluas | M5.3 |

---

## 3. Peran & Matriks Akses Fitur Baru

**Peran final (7):** `admin` (Super Admin), `wakasek` (**baru** — Humas/Hubin), `kaprog` (Kepala Program), `guru` (Guru Pembimbing), `pembimbing` (Pembimbing Industri), `orangtua`, `siswa`.
**Dihapus:** `kepala_sekolah` (role + user, tidak terpakai).

| Kapabilitas baru | admin | wakasek | kaprog | guru | pembimbing | orangtua | siswa |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Edit koordinat + radius industri | ✓(global) | – | ✓(jurusan) | ✓(bimbingan) | ✓(sendiri) | – | – |
| Set jam kerja dinamis | ✓ | – | – | – | ✓ | – | – |
| Presensi WFO/WFA (live photo) | – | – | – | – | – | – | ✓ |
| Approve WFA / Libur (First-to-Approve) | – | – | ✓(fallback) | ✓ | ✓ | – | – |
| Approve Sakit/Izin | – | – | ✓(fallback) | – | ✓(tahap 2) | ✓(tahap 1) | – |
| Streak & badge jurnal | – | – | – | – | – | (lihat) | ✓ |
| Rapor & sertifikat ber-QR | ✓ | (lihat) | ✓ | (input nilai) | (input nilai) | (lihat) | (lihat) |
| Akuntabilitas dana | – | ✓ | – | – | – | – | – |
| Kemitraan + kuota | ✓ | ✓ | – | – | – | – | – |
| Supervisi global & statistik | ✓ | ✓ | (jurusan) | – | – | – | – |

---

## 4. Prinsip Anti-Tabrakan (Collision-Avoidance)

File "panas" yang disentuh banyak modul: `resources/js/lib/nav.ts`, `resources/js/types/auth.ts`, `routes/web.php`, `app/Http/Middleware/HandleInertiaRequests.php`, dan dashboard variants.

**Strategi:**
1. **M0.1 dikerjakan paling awal & sendiri.** Ia menetapkan peran final dan **kerangka menu `nav.ts` dengan semua item modul mendatang sebagai placeholder "Soon" (tanpa `href`)**. Modul fitur berikutnya cukup **mengisi `href` + route** miliknya, tanpa merombak struktur nav.
2. **1 folder = 1 commit** (konvensi proyek yang sudah berjalan). Tiap modul memiliki area folder sendiri (`app/Http/Controllers/<X>`, `resources/js/pages/<x>/`) sehingga konflik antar modul minimal.
3. **Migrasi forward-only.** Skema bersama untuk presensi dibungkus sekali di **M0.2** agar modul Fase 1 tidak saling menambah migrasi yang berbenturan.
4. **Engine bersama dibangun sekali** (approval di M0.3) lalu dipakai ulang oleh WFA, Libur, Sakit/Izin.

---

## 5. Modul per Fase

> Legenda status: ⏳ belum • 🔄 jalan • ✅ selesai. DoD = Definition of Done.

### FASE 0 — App Readiness (WAJIB lebih dulu)

#### M0.1 — Refactor Peran & Kerangka Navigasi ✅
- **Tujuan:** peran final + skeleton nav untuk semua modul mendatang.
- **Prasyarat:** —
- **Backend:** seeder role (tambah `wakasek`, hapus `kepala_sekolah`); migrasi/command pembersih user & role `kepala_sekolah`; middleware route group untuk `wakasek`; `HandleInertiaRequests::share()` tetap kirim `roles`.
- **Frontend:** `types/auth.ts` (ubah `Role`), `lib/nav.ts` (tambah placeholder "Soon" semua item modul), routing dashboard, dashboard `dashboard-wakasek` (skeleton).
- **Peran:** semua.
- **DoD:** login tiap peran tampil menu benar; `wakasek` punya dashboard; tidak ada sisa referensi `kepala_sekolah`; `npm run types:check` + `composer test` hijau.

#### M0.2 — Fondasi Skema Presensi ✅
- **Tujuan:** satu migrasi forward-only untuk semua kebutuhan kolom presensi cerdas.
- **Prasyarat:** —
- **Backend:** migrasi: `industries` + `radius` (meter), `jam_masuk`, `jam_pulang`; `attendances` + `mode` (`wfo|wfa`), `is_late`, `distance_m`, `gps_accuracy`, `is_suspect`. Update `casts()` model `Industry` & `Attendance`; update factory.
- **Frontend:** —
- **DoD:** migrasi jalan; factory & test existing tetap hijau.

#### M0.3 — Approval Engine (Cross-Approval) Bersama ✅
- **Tujuan:** mesin First-to-Approve reusable + fallback Kaprog.
- **Prasyarat:** M0.1.
- **Backend:** model + migrasi `approvals` (polimorfik: `approvable_type/id`, `status`, `approver_role`, `approver_id`, `note`); action `ApproveRequest` (First-to-Approve: sah bila salah satu approver setuju; Kaprog sebagai safety-net). Policy/gate per peran.
- **Frontend:** komponen status approval reusable (badge + tombol approve/reject).
- **DoD:** unit test First-to-Approve & fallback Kaprog lulus.

---

### FASE 1 — Presensi Cerdas

#### M1.1 — Koordinat Dinamis & Radius ✅
- **Prasyarat:** M0.2.
- **Backend:** endpoint update `latitude/longitude/radius` industri dgn otorisasi multi-peran (admin global, kaprog jurusan, guru bimbingan, pembimbing sendiri).
- **Frontend:** map picker (Leaflet/OSM) di form industri & `my-industry/edit`; input radius.
- **DoD:** tiap peran berwenang bisa simpan koordinat & radius; tervisualisasi di peta.

#### M1.2 — Jam Kerja Dinamis ✅
- **Prasyarat:** M0.2.
- **Backend:** pembimbing set `jam_masuk`/`jam_pulang` industri (validasi); jadi sumber toleransi presensi.
- **Frontend:** form jam kerja di `my-industry/edit`.
- **DoD:** perubahan jam tercermin sebagai batas presensi siswa industri tsb.

#### M1.3 — Geofencing + Anti-Fake (WFO) ✅
- **Prasyarat:** M1.1, M1.2.
- **Backend:** validasi check-in/out: hitung jarak (haversine) vs `radius` → tolak jika luar radius (mode WFO); set `is_late` dari `jam_masuk`; **anti-fake heuristics**: tolak `gps_accuracy` di atas ambang, tandai `is_suspect` bila akurasi buruk/lompatan tak wajar; simpan `distance_m`, `gps_accuracy`.
- **Frontend:** UI presensi menampilkan status dalam/luar radius + akurasi GPS + peringatan.
- **DoD:** check-in luar radius ditolak (WFO); telat tertandai; fix akurasi rendah ditolak/ditandai.

#### M1.4 — Mode WFO/WFA + Approval WFA ✅
- **Prasyarat:** M1.3, M0.3.
- **Backend:** siswa pilih `mode`; WFA lewati geofence tapi wajib live photo + buat `approval` (First-to-Approve pembimbing/guru, fallback kaprog).
- **Frontend:** toggle mode di halaman presensi; status approval WFA.
- **DoD:** presensi WFA tercatat & menunggu approval; geofence di-skip untuk WFA.

---

### FASE 2 — Ketidakhadiran & Libur

#### M2.1 — Pengajuan Libur ✅
- **Prasyarat:** M0.3.
- **Backend:** model `LeaveRequest` (tanggal, alasan) → approval First-to-Approve Industri/Guru, fallback Kaprog.
- **Frontend:** form pengajuan libur (siswa) + status.
- **DoD:** libur disetujui satu pihak = sah; tercatat di riwayat presensi.

#### M2.2 — Sakit/Izin Multi-step ✅
- **Prasyarat:** M0.3.
- **Backend:** pengajuan Sakit/Izin + upload bukti → **tahap 1 Ortu → tahap 2 Industri**.
- **Frontend:** form + unggah bukti (siswa); panel persetujuan ortu & industri.
- **DoD:** status berubah hanya setelah kedua tahap; tercermin di monitoring.

#### M2.3 — Inbox Approval ✅
- **Prasyarat:** M1.4, M2.1, M2.2.
- **Backend:** query antrian approval per peran.
- **Frontend:** halaman "Persetujuan" (badge jumlah pending di topbar/nav) untuk pembimbing/guru/kaprog/ortu.
- **DoD:** approver lihat & proses semua permintaan WFA/Libur/Sakit-Izin di satu tempat.

---

### FASE 3 — Gamifikasi Jurnal (independen)

#### M3.1 — Streak Engine ✅
- **Prasyarat:** jurnal existing.
- **Backend:** hitung daily streak & longest streak dari `activities` (service, bukan kolom redundan bila bisa dihitung).
- **DoD:** streak akurat lintas tanggal (termasuk reset bila bolong).

#### M3.2 — Badge / Achievement ✅
- **Prasyarat:** M3.1.
- **Backend:** model `Badge` + `student_badge` + aturan award (mis. streak 7/30 hari, N jurnal).
- **Frontend:** komponen Atomic Design (atom badge, molekul kartu, organisme etalase).
- **DoD:** badge ter-award otomatis sesuai aturan.

#### M3.3 — UI Gamifikasi Siswa ⏳
- **Prasyarat:** M3.1, M3.2.
- **Frontend:** widget streak + etalase badge di `dashboard-student` & halaman jurnal.
- **DoD:** siswa melihat streak & badge; reward psikologis tampil.

---

### FASE 4 — Rapor & Sertifikat ber-QR (independen)

#### M4.1 — QR Keaslian Sertifikat ⏳
- **Prasyarat:** sertifikat existing.
- **Backend:** generate QR (PHP, mis. `simplesoftwareio/simple-qrcode`) berisi signed-URL verifikasi; route + halaman verifikasi publik (read-only data sertifikat).
- **Frontend:** QR pada output sertifikat; halaman verifikasi publik.
- **DoD:** scan QR → halaman verifikasi menampilkan keaslian; tautan ber-signature.

#### M4.2 — Rapor Digital ⏳
- **Prasyarat:** penilaian + sidang existing; idealnya M4.1 (QR).
- **Backend:** kompilasi nilai (teknis+non-teknis) + sidang + rekap absen/jurnal → dokumen rapor (print-to-PDF, konsisten dgn pola sertifikat) + QR.
- **Frontend:** halaman rapor per siswa siap cetak.
- **DoD:** rapor cetak lengkap & ber-QR setelah nilai dikunci.

---

### FASE 5 — Modul Wakasek/Hubin

#### M5.1 — Akuntabilitas Dana ⏳
- **Prasyarat:** M0.1.
- **Backend:** model `BudgetReceipt` (penerimaan komite) + `Expense` (realisasi pengeluaran); CRUD (akses `wakasek`).
- **Frontend:** halaman keuangan: rekap penerimaan + pencatatan pengeluaran + ringkasan saldo.
- **DoD:** wakasek catat penerimaan & pengeluaran; rekap akurat.

#### M5.2 — Manajemen Kemitraan + Kuota ⏳
- **Prasyarat:** M0.1.
- **Backend:** field `kuota` pada `industries`; logika sisa kuota vs siswa ditempatkan.
- **Frontend:** kelola mitra + penetapan kuota (admin/wakasek); indikator kuota terisi.
- **DoD:** kuota tampil & membatasi/menandai penempatan berlebih.

#### M5.3 — Supervisi Global & Statistik ⏳
- **Prasyarat:** M0.1.
- **Backend:** statistik: guru aktif melihat jurnal, presensi per jurusan (general), rekap dokumentasi monitoring.
- **Frontend:** dashboard `wakasek` dengan kartu/grafik statistik global.
- **DoD:** wakasek lihat statistik lintas jurusan & aktivitas guru.

---

### FASE 6 — PWA (independen, disarankan paling akhir)

#### M6.1 — PWA Setup ⏳
- **Prasyarat:** —
- **Build:** tambah `vite-plugin-pwa` (`vite.config.ts`), manifest, service worker, ikon, install prompt, offline shell; tautkan manifest di `app.blade.php`.
- **DoD:** app bisa di-install ke homescreen; lulus audit PWA dasar; tetap mobile-responsive.

---

## 6. Diagram Dependensi

```
M0.1 (peran+nav) ──┬─> FASE 5 (Wakasek: M5.1/M5.2/M5.3)
                   └─> semua menu fitur

M0.2 (skema) ──┬─> M1.1 ─> M1.3 ─┐
               ├─> M1.2 ─────────┴─> M1.4 ─┐
               └────────────────────────────┤
M0.3 (approval) ──┬─> M1.4                   ├─> M2.3 (inbox)
                  ├─> M2.1 ──────────────────┤
                  └─> M2.2 ──────────────────┘

FASE 3 (gamifikasi)  : independen (butuh jurnal existing)
FASE 4 (rapor/QR)    : independen (butuh penilaian/sertifikat existing)
FASE 6 (PWA)         : independen, paling akhir
```

**Urutan rekomendasi default:** `M0.1 → M0.2 → M0.3 → Fase 1 → Fase 2 → (Fase 3 / Fase 4 / Fase 5 bebas urut) → Fase 6`.
Pengguna menentukan modul awal; selama prasyarat terpenuhi, urutan boleh fleksibel.

---

## 7. Catatan Teknis

- **Anti-Fake GPS:** best-effort web heuristics (ambang `gps_accuracy`, tolak fix cached, tandai lompatan tak wajar, wajib live face photo). Deteksi mock-location native dapat dipertimbangkan bila kelak ada wrapper native/PWA lanjutan.
- **Peta:** Leaflet + OpenStreetMap (tanpa API key) untuk picker koordinat & radius.
- **QR:** library PHP (mis. `simplesoftwareio/simple-qrcode`) + signed URL Laravel untuk verifikasi.
- **PDF rapor/sertifikat:** lanjutkan pola **print-to-PDF browser** yang sudah dipakai (tanpa dependensi server berat).
- **PWA:** `vite-plugin-pwa`.
- **Konsistensi:** ikuti pola existing — Form Request untuk validasi, Wayfinder untuk route, `ScopesStudentsByRole` untuk scoping, komponen `photo-capture` untuk kamera.

---

## 8. Checklist Status (sinkronkan dengan PROGRESS.md saat modul rampung)

- [x] M0.1 Refactor Peran & Kerangka Navigasi
- [x] M0.2 Fondasi Skema Presensi
- [x] M0.3 Approval Engine
- [x] M1.1 Koordinat Dinamis & Radius
- [x] M1.2 Jam Kerja Dinamis
- [x] M1.3 Geofencing + Anti-Fake (WFO)
- [x] M1.4 Mode WFO/WFA + Approval WFA
- [x] M2.1 Pengajuan Libur
- [x] M2.2 Sakit/Izin Multi-step
- [x] M2.3 Inbox Approval
- [x] M3.1 Streak Engine
- [x] M3.2 Badge / Achievement
- [ ] M3.3 UI Gamifikasi Siswa
- [ ] M4.1 QR Keaslian Sertifikat
- [ ] M4.2 Rapor Digital
- [ ] M5.1 Akuntabilitas Dana
- [ ] M5.2 Manajemen Kemitraan + Kuota
- [ ] M5.3 Supervisi Global & Statistik
- [ ] M6.1 PWA Setup
