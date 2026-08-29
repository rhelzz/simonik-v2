# Fase 31 — Jam Pulang dan Semantik Kehadiran

**Status:** Selesai · **Request:** PKL-003 · **Risiko:** tinggi · **Migrasi:** tidak.

## Keputusan wajib sebelum eksekusi

Tentukan tanggal efektif aturan baru. Default aman: aturan “masuk + pulang”
berlaku mulai tanggal rilis agar data historis tanpa checkout tidak berubah
massal. Jika aturan harus retroaktif, dokumentasikan dampak angka sebelum deploy.

**Keputusan implementasi:** tanggal efektif `2026-08-29`; data sebelumnya tetap
mengikuti semantik lama.

## Definisi tunggal

`hadir lengkap = status hadir/masuk AND arrivalTime terisi AND departureTime terisi`.

Definisi ini harus dipakai bersama oleh rate dashboard, rekap performa,
monitoring, rapor, dan badge/streak yang bergantung pada hari hadir. Jangan
mengubah label record sakit/izin/libur.

## Pengerjaan

1. Temukan seluruh penghitung status `hadir/masuk` dan pusatkan kondisi lengkap
   pada query/helper terkecil yang dapat dipakai bersama.
2. Tambahkan `departureTime` ke roster harian dan kolom Jam Pulang di UI.
3. Ubah count/rate agar mengikuti keputusan tanggal efektif.
4. Pastikan absen yang baru masuk tetap tampil di tab Sudah, tetapi belum
   menambah jumlah hadir lengkap.

## File perkiraan

- `app/Http/Controllers/AttendanceMonitorController.php`
- `app/Http/Controllers/Concerns/SummarizesParticipation.php`
- `app/Http/Controllers/Concerns/SummarizesStudentPerformance.php`
- `resources/js/components/attendance-monitor/daily-roster.tsx`
- dashboard/rapor hanya bila memakai hitungan terpisah
- test attendance, dashboard, statistik, rapor, streak

## Test wajib

- Masuk tanpa pulang: tampil di roster, count hadir tidak bertambah.
- Masuk dan pulang pada tanggal sama: count bertambah tepat satu.
- Izin/sakit/libur tidak berubah menjadi hadir.
- Scope guru/pembimbing tidak bocor.
- Perilaku data sebelum tanggal efektif sesuai keputusan.
