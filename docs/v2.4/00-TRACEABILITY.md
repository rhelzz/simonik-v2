# Penelusuran Permintaan → Fase → Kriteria Terima

Dokumen pemeriksa. Setiap butir permintaan ditelusuri ke fase yang
mengerjakannya, lengkap dengan **kriteria terima** — kalimat yang bisa dicoba
langsung di browser untuk membuktikan butir itu selesai.

**Cara pakai:** saat sebuah fase selesai, buka baris-baris di bawah yang
menunjuk ke fase itu dan coba kriterianya satu per satu. Kalau ada yang tidak
bisa dibuktikan, fase itu belum selesai — terlepas dari test yang hijau.

Kutipan permintaan ditulis **verbatim** supaya tidak ada tafsir yang menyelinap
di antara permintaan dan rencana.

---

## A. Fitur Pengumuman

### A1 — Target multi-role + periode tayang

> "Membuat pengumuman yang bisa dilihat (muncul di dashboard) oleh role tertentu
> seperti : All User, Murid, Guru Pembimbing, Pembimbing Industri, Orangtua
> (Bisa multichoice). dan ada periode waktu berapa lama pengumuman ini dapat
> terlihat di dashboard."

**Fase:** [18](18-FASE-18-PENGUMUMAN.md) · **§3.1-3.5, §4.1-4.7**

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| Muncul **di dashboard** | §3.4 — dibagikan lewat `share()`, dipasang eksplisit di 6 file dashboard | Login sebagai murid → pengumuman ber-target Murid terlihat di dashboard-nya |
| Target **5 opsi persis** (All User, Murid, Guru Pembimbing, Pembimbing Industri, Orangtua) | §4.3 `ROLE_LABELS` — lima entri, label memakai kata user sendiri | Form pengumuman menampilkan tepat 5 pilihan dengan nama itu |
| **Multichoice** | §4.7 — checkbox, bukan `Select` (komponen `Select` repo ini nilai-tunggal) | Centang Murid + Orangtua → keduanya melihat, Guru tidak |
| **All User** | §3.2 — disimpan `['*']`, bukan daftar semua role | Centang All User → checkbox lain non-aktif; semua role melihat |
| **Periode waktu** | §3.5 — `starts_at` + `ends_at`, `date`, inklusif dua ujung | Pengumuman ber-`ends_at` = hari ini **masih** terlihat hari ini; besok hilang sendiri |

### A2 — Yang boleh membuat

> "Fitur ini dibuatkan untuk role admin & guru pembimbing"

**Fase:** [18](18-FASE-18-PENGUMUMAN.md) · **§3.6, §4.5**

| Kriteria terima |
|---|
| Menu **Pengumuman** muncul di sidebar admin & guru; **tidak** muncul di role lain |
| Guru hanya melihat & mengubah pengumuman buatannya sendiri (§3.6) |
| Guru mencoba membuka `/pengumuman/{id}/edit` milik guru lain → **403** |
| Siswa membuka `/pengumuman` → **403** |

---

## B. Fitur Reset

### B1 — Reset Data Absen

> "Fitur Reset Data Absen … Pas di bagian page https://simonik.pro/monitoring/absen"
> "Admin bisa reset data absen … agar dapat direset dari awal … reset berdasarkan:
> 1. Jurusan 2. Kelas 3. Industri. Setelah memilih kategori di atas baru minta
> masukin password, untuk passwordnya pake password login admin aja"

**Fase:** [19](19-FASE-19-RESET-DATA-ABSEN.md)

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| Ada di **`/monitoring/absen`** | §4.5 — tombol di header seksi halaman itu | Tombol Reset terlihat admin di halaman Data Absen |
| Reset by **Jurusan** | §3.3 sumbu `departemen_id` | Pilih jurusan RPL → hanya absen siswa RPL hilang; jurusan lain **utuh** |
| Reset by **Kelas** | sumbu `class_id` | idem |
| Reset by **Industri** | sumbu `industri_id` | idem |
| **Password login admin** | §2.3 README — aturan `current_password` bawaan Laravel | Password salah → galat di field password, **nol baris terhapus** |
| "direset dari awal" | §3.1 — hard delete | Data benar-benar hilang, bukan disembunyikan |

### B2 — Reset presensi via modal (tanggal / semua murid / beberapa murid)

> "buatkan fitur untuk reset (button) data presensi, kemudian menampilkan modal
> yang isi modalnya bisa diatur berdasarkan tanggal, bisa di atur berdasarkan
> semua murid, bisa diatur berdasarkan beberapa murid"

**Fase:** [19](19-FASE-19-RESET-DATA-ABSEN.md) — **digabung dengan B1**

> **Kenapa digabung, bukan tombol kedua:** B1 dan B2 sama-sama "tombol reset di
> `/monitoring/absen`", hanya sumbu filternya berbeda. Dua tombol reset di satu
> halaman adalah cara tercepat operator menghapus hal yang salah. Hasil gabungan
> tetap memenuhi **kedua** butir — lihat kriteria di bawah.

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| **Button** reset | §4.5 | ✅ satu tombol |
| **Modal** | §4.5 — komponen `Modal` yang sudah ada | ✅ |
| Diatur **berdasarkan tanggal** | §3.7 — `from` + `to` (rentang mencakup tanggal tunggal) | Isi Dari=Sampai=17 Agt → hanya absen 17 Agt hilang |
| **Semua murid** | §3.3 — `student_ids` kosong = semua yang lolos filter | Kosongkan pilihan murid → semua murid dalam cakupan ikut |
| **Beberapa murid** | §3.3 — `student_ids` terisi | Pilih 3 murid → hanya absen 3 murid itu hilang |

### B3 — Reset Data Jurnal

> "Fitur Reset Data Jurnal … Pas di bagian page https://simonik.pro/monitoring/jurnal"
> (kriteria jurusan/kelas/industri + password sama dengan B1)

**Fase:** [20](20-FASE-20-RESET-DATA-JURNAL.md)

| Kriteria terima |
|---|
| Tombol Reset terlihat admin di **`/monitoring/jurnal`** |
| Reset by jurusan / kelas / industri bekerja (industri lewat `students.industri_id`, §2) |
| Password salah → nol baris terhapus |
| **Reset jurnal tidak menyentuh data absen sama sekali** (§6 — test khusus, ini kesalahan salin-tempel yang paling mungkin terjadi) |
| Streak siswa kembali 0; **badge tetap** (§3.4 — keputusan user) |

---

## C. Page role admin

### C1 — Hapus tabel "Siswa terbaru"

> "Pada page admin dashboard Hapus fitur tabel 'Siswa terbaru'"

**Fase:** [21](21-FASE-21-HAPUS-SISWA-TERBARU.md)

| Kriteria terima |
|---|
| Dashboard **admin** tidak lagi menampilkan tabel itu |
| Dashboard **guru/pembimbing** dan **kaprog** masih menampilkan tabelnya (§3.1 — komponen & method dipakai 2 dashboard lain, jangan ikut dihapus) |
| Kueri `recentStudents` tidak lagi jalan di dashboard admin (dihapus di backend juga, bukan cuma disembunyikan di React) |

### C2 — Card Rate absensi di Data Absen

> "Pada page admin modul Data Absen, buatkan fitur card Rate absensi (bisa
> diambil dari dashboard)"

**Fase:** [22](22-FASE-22-DATA-ABSEN-RATE-DAN-LAYOUT.md) · **§3.1-3.3**

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| Card Rate absensi | §2.1 — komponen `RateCard` yang **sudah ada** dipakai ulang | Kartu muncul di atas halaman Data Absen, dengan tab Hari ini/Minggu/Bulan/Semua |
| "bisa diambil dari dashboard" | §3.1 — rumusnya diekstrak ke trait `SummarizesParticipation`, dipakai bersama | Angka untuk admin **sama persis** dengan angka di dashboard admin |

### C3 — Hapus grid gap kartu jurusan

> "hapus grid gap agar pada komponen card data jurusan tidak memakan space ke
> bawah"

**Fase:** [22](22-FASE-22-DATA-ABSEN-RATE-DAN-LAYOUT.md) · **§3.4**

| Kriteria terima |
|---|
| `gap-3` → `gap-0` — gap benar-benar hilang (dikonfirmasi user: *"ikutin instruksinya saja"*) |
| Jumlah kolom & padding kartu **tidak** diubah (tidak diminta) |
| Tidak ada garis border dobel 2px di sambungan antar-kartu (§3.4 — konsekuensi langsung dari gap-0, wajib diperiksa di browser) |

### C4 — Tabel murid sudah & belum presensi

> "buatkan fitur tabel murid yang sudah melakukan presensi dan yang belum
> melakukan presensi"

**Fase:** [23](23-FASE-23-TABEL-SUDAH-BELUM-PRESENSI.md)

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| Tabel **sudah** presensi | §3.1 | Tab "Sudah" berisi murid yang punya data absen hari itu, dengan kolom status & jam |
| Tabel **belum** presensi | §3.1 | Tab "Belum" berisi sisanya |
| — | §3.4 — satu tabel + **tab**, bukan dua tabel bersanding | Kedua angka terlihat sekaligus di label tab: `Belum (12)` / `Sudah (48)` |

> **Catatan tafsir:** permintaan terbaca seperti *dua* tabel. Rencana memakai
> satu tabel dengan dua tab karena dua paginasi independen di satu layar
> membingungkan, dan di HP keduanya menumpuk jadi layar sangat panjang — persis
> keluhan yang mendasari C3. Jumlah kedua kelompok tetap terlihat bersamaan.
> **Kalau guru Anda memang ingin dua tabel terpisah**, ubah §3.4: dua komponen
> tabel, masing-masing paginasi sendiri. Biayanya ~40 baris JSX, nol perubahan
> backend.

### C5 — Button presensi (diwakilkan)

> "buatkan button presensi. Tujuannya button fitur presensi yang dilakukan oleh
> guru pembimbing ini untuk presensi yang diwakilkan oleh guru pembimbing.
> Proses ini hanya memilih murid yang akan dipresensikan kemudian input waktu
> secara custom. Tidak perlu ada fitur geolokasi dan foto."

**Fase:** [24](24-FASE-24-PRESENSI-DIWAKILKAN.md)

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| **Button** presensi | §3.7 — di header panel C4 | Tombol "Presensikan" aktif saat ada murid tercentang |
| **Hanya memilih murid** | §3.5 — massal, `student_ids` | Centang 5 murid → satu klik, kelimanya terpresensi |
| **Input waktu custom** | §3.4 — satu `<input type="time">` → `arrivalTime` | Isi 08:15 → jam tersimpan 08:15, bukan jam server |
| **Tanpa geolokasi** | §4.2 — `latitude`/`longitude`/`gps_accuracy` dibiarkan `null` | Baris tersimpan tanpa koordinat; **tidak** diisi koordinat industri sebagai "perkiraan" |
| **Tanpa foto** | §4.2 — `image` `null` | Tidak ada langkah unggah foto di modal |
| — | §3.3 — **tidak menimpa** absen yang sudah ada | Murid yang sudah absen sendiri → dilewati, foto & GPS-nya utuh, dan flash menyebut *"N dilewati"* |

### C6 — Button reset data presensi

Sama dengan **B2** (digabung ke Fase 19). Lihat penjelasan penggabungan di sana.

---

## D. Page role guru pembimbing

### D1 — Hapus grid gap · D2 — Tabel sudah/belum · D3 — Button presensi

> Tiga butir yang **kata per kata identik** dengan C3, C4, dan C5, hanya
> berganti "role admin" → "role guru pembimbing".

**Fase:** [22](22-FASE-22-DATA-ABSEN-RATE-DAN-LAYOUT.md) §3.5,
[23](23-FASE-23-TABEL-SUDAH-BELUM-PRESENSI.md), [24](24-FASE-24-PRESENSI-DIWAKILKAN.md)

**Selesai tanpa satu baris kode tambahan.** `/monitoring/absen` adalah **satu
halaman yang sama** untuk admin dan guru ([`routes/web.php:279-282`](../../routes/web.php#L279-L282)
— satu grup `role:admin|kaprog|wakasek|guru|pembimbing|orangtua`), dan datanya
otomatis dibatasi per-role oleh `ScopesStudentsByRole`.

| Kriteria terima |
|---|
| Login sebagai **guru pembimbing** → ketiga fitur (gap, tabel sudah/belum, button presensi) ada di halaman yang sama |
| Guru hanya melihat **murid bimbingannya** di tabel — bukan seluruh sekolah |
| Guru hanya bisa mempresensikan murid bimbingannya; kirim ID murid guru lain → **nol baris dibuat** (Fase 24 §6, test keamanan) |
| Angka Rate absensi untuk guru = rate **murid-nya**, bukan rate sekolah (Fase 22 §3.2) |

### D4 — Edit & simpan info industri di halaman detail

> "buatkan fitur button edit dan simpan, agar guru pembimbing dapat melakukan
> CRUD data pada bagian ;
> `document.querySelector("#app > div > … > section:nth-child(2)")`"

**Fase:** [25](25-FASE-25-GURU-EDIT-INDUSTRI.md)

Selektor itu ditelusuri di §1 → **seksi "Informasi Industri"** (baris 198
`industries/show.tsx`): nama, bidang, alamat, jam masuk/pulang, durasi.

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| **Button edit** di seksi itu | §3.3 — inline, bukan halaman terpisah | Guru melihat "Edit informasi" di pojok seksi 2 |
| **Button simpan** | §3.3 | Simpan → field kembali jadi teks, flash sukses, **halaman tidak melompat ke atas** (`preserveScroll`) |
| Guru bisa mengubah datanya | §3.1 — kemampuan `updateProfile` di policy yang sudah ada | Guru ubah alamat industri bimbingannya → tersimpan |
| — | §3.2 — relasi (`teacher_id`, `pembimbing_id`) **dikunci** | Guru **tidak** bisa memindahkan industri ke guru lain, walau payload ditulis tangan |
| — | §3.1 — bukan `can.manage` | Guru tetap **tidak** dapat halaman edit penuh milik admin |

---

## E. Page role siswa

### E1 — Sakit tanpa tautan orang tua

> "Siswa yang sakit mengajukan keterangan sakit agar tidak perlu menautkan orang
> tua. (Setelah murid mengajukan, approval ada di guru pembimbing)"

**Fase:** [26](26-FASE-26-SAKIT-TANPA-ORTU.md)

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| Sakit **tanpa** tautan ortu | §2.1 — blokade dihapus | Siswa tanpa akun ortu berhasil mengajukan sakit |
| Approval **di guru pembimbing** | §4.2 — `canAct` index 0 → `ELIGIBLE_ROLES` | Pengajuan langsung muncul di Inbox guru; guru setujui → baris absen `status = sakit` terbentuk |

> ⚠️ **Satu-satunya butir di seluruh v2.4 yang tidak 1:1 dengan permintaan.**
> Permintaan hanya menyebut **sakit**; soal **izin** ia diam. Atas jawaban user
> *"satu tahap saja"*, rencana memberlakukannya untuk **keduanya** — superset
> dari yang diminta, tapi mengubah perilaku `izin` yang tidak diminta siapa pun,
> dan menyebabkan Inbox Persetujuan orang tua jadi kosong permanen (§3.4).
> **Konfirmasi ke guru Anda sebelum fase ini dikerjakan.** Cara mengembalikan
> izin ke dua tahap ada di §1 (±15 baris).

### E2 — Tidak presensi = Alpha

> "Siswa yang tidak melakukan presensi dianggap Alpha"

**Fase:** [27](27-FASE-27-ALPHA-TANPA-PRESENSI.md)

| Yang diminta | Di rencana | Kriteria terima |
|---|---|---|
| Tidak presensi → **Alpha** | §3.1 — turunan saat dibaca, bukan baris data | Buka Data Absen dengan tanggal kemarin → murid tanpa data absen berlabel **Alpha** (merah) |
| — | §3.3 — hari **berjalan** tidak pernah Alpha | Tanggal hari ini → labelnya "Belum presensi", bukan Alpha (kalau tidak, seluruh sekolah "Alpha" tiap pagi jam 7) |
| — | §3.2 — akhir pekan & di luar periode PKL tidak dihitung | Sabtu/Minggu tidak muncul sebagai Alpha |
| — | §3.1 — koreksi terlambat menghapus Alpha sendiri | Presensikan murid itu lewat C5 → label Alpha hilang tanpa ada yang membersihkan |

> **Batasan yang diakui terbuka:** libur nasional **tidak** dikenali (tidak ada
> kalender hari libur di sistem), jadi 17 Agustus akan tampil sebagai Alpha
> massal. Jalan keluar yang sudah tersedia hari ini: ajukan **Libur** lewat
> `LeaveRequest` — approval-nya membuat baris `status = 'libur'` yang langsung
> mematikan Alpha. Fase 27 §3.2.

---

## F. Rekapitulasi

| # | Butir | Fase | Status rencana |
|---|---|---|---|
| A1 | Pengumuman: target multi-role + periode | 18 | ✅ 1:1 |
| A2 | Pengumuman: untuk admin & guru | 18 | ✅ 1:1 |
| B1 | Reset absen (jurusan/kelas/industri + password) | 19 | ✅ 1:1 |
| B2 | Reset presensi modal (tanggal/semua/beberapa murid) | 19 | ✅ 1:1 (digabung ke satu modal) |
| B3 | Reset jurnal | 20 | ✅ 1:1 |
| C1 | Hapus tabel "Siswa terbaru" | 21 | ✅ 1:1 |
| C2 | Card Rate absensi di Data Absen | 22 | ✅ 1:1 |
| C3 | Hapus grid gap | 22 | ✅ 1:1 |
| C4 | Tabel sudah/belum presensi | 23 | ✅ 1:1 *(satu tabel + tab — lihat catatan tafsir)* |
| C5 | Button presensi diwakilkan | 24 | ✅ 1:1 |
| C6 | Button reset presensi | 19 | = B2 |
| D1 | Hapus grid gap (guru) | 22 | ✅ = C3, halaman sama |
| D2 | Tabel sudah/belum (guru) | 23 | ✅ = C4, halaman sama |
| D3 | Button presensi (guru) | 24 | ✅ = C5, halaman sama |
| D4 | Guru edit info industri | 25 | ✅ 1:1 |
| E1 | Sakit tanpa ortu | 26 | ⚠️ superset — **butuh konfirmasi soal `izin`** |
| E2 | Tidak presensi = Alpha | 27 | ✅ 1:1 |

**16 butir terpetakan, 15 di antaranya 1:1 dengan permintaan.** Satu butir
(E1) sengaja melampaui permintaan atas keputusan user, dan ditandai agar bisa
dikembalikan sebelum dikerjakan.

Dua tempat di mana rencana mengambil **tafsir**, keduanya ditandai di atas
beserta cara membatalkannya: C4 (satu tabel + tab, bukan dua tabel) dan
B2 (satu tombol reset, bukan dua).
