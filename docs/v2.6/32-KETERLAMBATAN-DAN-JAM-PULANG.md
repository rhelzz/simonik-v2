# Fase 32 — Menit Keterlambatan dan Batas Checkout

**Request:** PKL-004 · **Risiko:** tinggi · **Migrasi:** tidak.
**Dependency:** Fase 31 selesai.

## Definisi

- Menit terlambat = `max(0, arrivalTime - industry.jam_masuk)` pada tanggal absen.
- Akumulasi = jumlah menit terlambat selama periode PKL siswa.
- Siswa tidak dapat checkout sebelum `industry.jam_pulang` menurut waktu server.
- Jika jam kerja industri belum lengkap, tampilkan status konfigurasi belum
  lengkap; jangan mengarang jam default.

Menit dihitung, bukan disimpan, agar tidak ada data turunan yang basi. Konsekuensi:
perubahan jam masuk industri juga mengubah perhitungan historis. Jika itu tidak
diinginkan, hentikan fase dan sepakati snapshot jam kerja per attendance.

## Pengerjaan

1. Tambahkan helper perhitungan menit yang dipakai semua surface.
2. Kirim menit per record ke riwayat/monitoring.
3. Tambahkan total menit ke dashboard siswa dan summary role lain.
4. Tambahkan guard checkout server-side; disabled button di UI hanya bantuan UX.
5. Ganti badge boolean “Terlambat” dengan jumlah menit tanpa menghilangkan status.

## File perkiraan

- `app/Http/Controllers/AttendanceController.php`
- helper/concern performa yang sudah ada bila cocok untuk ≥2 pemakai
- `app/Http/Controllers/DashboardController.php`
- `resources/js/pages/attendance/index.tsx`
- `resources/js/pages/dashboard-student.tsx`
- komponen summary yang sudah ada
- test attendance dan dashboard

## Test wajib

- Tepat pada jam masuk = 0 menit; lewat 17 menit = 17.
- Sebelum jam pulang ditolak di backend; tepat/sesudah jam pulang diterima.
- Akumulasi hanya menghitung siswa dan periode yang benar.
- Industri tanpa jam kerja tidak menghasilkan angka palsu.

## Tidak termasuk

Aturan spreadsheet tentang keterlambatan “terus bertambah sampai 18.00” tidak
diterapkan karena bertentangan dengan definisi keterlambatan kedatangan. Itu
memerlukan keputusan produk terpisah tentang penalti lupa checkout.

