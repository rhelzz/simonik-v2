# Traceability Request Spreadsheet → Fase → Bukti Selesai

Status di bawah adalah hasil audit kode sebelum pekerjaan v2.6 dimulai.

| ID | Status awal | Fase | Bukti selesai yang wajib |
|---|---|---|---|
| PKL-001 | Existing | Operasional | Role pembimbing industri dapat membuka Panduan PKL; teks final diisi pemilik produk melalui modul yang sudah ada. |
| PKL-002 | Parsial | 29 | Login menampilkan placeholder `nama@simonik.local`; tidak ada placeholder domain lama pada surface akun. |
| PKL-003 | Parsial | 31 | Tabel harian punya Jam Masuk dan Jam Pulang; satu hari dihitung hadir hanya jika keduanya terisi. |
| PKL-004 | Parsial | 32 | Menit terlambat terlihat dan terakumulasi; checkout sebelum jam pulang ditolak server. |
| PKL-005 | Parsial | 33 | Admin, guru pembimbing, dan pembimbing industri dapat mempresensikan siswa dalam scope masing-masing. |
| PKL-006 | Belum | 33 | Modal memilih Masuk/Pulang, murid, waktu, lalu menyimpan field yang tepat tanpa menimpa bukti presensi lain. |
| PKL-007 | Belum | 34 | Setiap jurnal memiliki status Belum/Sudah Dilihat; hanya pemeriksa berwenang yang dapat mengubahnya; persentase murid tampil hanya jika seluruh jurnal sudah dilihat. |
| PKL-008 | Parsial | 35 | Pembimbing industri dapat mengisi lima teks aspek teknis custom dan nilai teknis/non-teknis untuk siswa industrinya. |
| PKL-009 | Belum | 36 | Tombol informasi grade membuka modal, bisa ditutup dengan X dan klik backdrop, serta menampilkan kategori dari rumus yang sama dengan backend. |
| PKL-010 | Belum | 36 | Urutan: Aspek Penilaian, Penilaian PKL, Rekap Penilaian, Sertifikat PKL, Template Sertifikat PKL; istilah Rapor Digital hilang dari UI. |
| PKL-011 | Belum | 37 | Bagian D tidak memuat Libur/Jurnal; semua blok rata-rata hilang dan backend tidak lagi menghitung prop yatim. |
| PKL-012 | Existing | Regression | Satu siswa dapat mengoleksi sertifikat sekolah/global dan industri sekaligus. |
| PKL-013 | Existing | Regression | Pembimbing hanya dapat mengelola template/sertifikat industri miliknya. |
| PKL-014 | Parsial | 30 | Impor minimum Nama Anak + Nama Orang Tua + No HP berhasil dan menautkan orang tua ke siswa yang tepat. |

## Bukti gambar yang dijaga

1. Login: placeholder lama terlihat pada screenshot → PKL-002.
2. Data Jurnal: slot tombol di sebelah `Detail` → PKL-007.
3. Dashboard murid: lokasi card performa → PKL-004/PKL-007.
4. Rekap Penilaian: lima baris teknis dan nilai → PKL-008/PKL-009.
5. Data Absen industri: lokasi tombol Presensikan → PKL-005/PKL-006.
6. Data Absen admin: tabel memiliki satu kolom Jam → PKL-003.

## Status eksekusi

Gunakan nilai `Belum`, `Dikerjakan`, `Selesai`, atau `Ditunda`. Jangan menulis
`Selesai` sebelum seluruh bukti selesai di atas lolos.

| Fase | Status | Commit/catatan |
|---|---|---|
| 29 | Selesai | Placeholder login dan profil memakai `nama@simonik.local`; type-check dan test autentikasi hijau. |
| 30 | Selesai | Impor minimum menautkan siswa secara exact case-insensitive; data opsional, nama ambigu, dan tautan existing terlindungi. |
| 31 | Selesai | Roster menampilkan Jam Masuk/Pulang; sejak 2026-08-29 hanya record lengkap dihitung hadir, sementara histori tetap kompatibel. |
| 32 | Belum | |
| 33 | Belum | |
| 34 | Belum | |
| 35 | Belum | |
| 36 | Belum | |
| 37 | Belum | |
