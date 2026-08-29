# Fase 33 — Presensi Diwakilkan Masuk dan Pulang

**Request:** PKL-005 + PKL-006 · **Risiko:** tinggi · **Migrasi:** tidak.
**Dependency:** Fase 31–32 selesai.

**Status:** Selesai — modal dan endpoint mendukung presensi masuk/pulang,
batch campuran, serta pembatasan scope server-side untuk admin, guru, dan
pembimbing industri.

## Role dan scope

- Admin: siswa dalam scope admin.
- Guru pembimbing (`guru`): siswa bimbingannya.
- Pembimbing industri (`pembimbing`): siswa pada industrinya.
- ID di luar scope menghasilkan 403 atau nol perubahan; tidak cukup disembunyikan di UI.

## Alur modal

Pilih tipe `Masuk` atau `Pulang` → pilih murid → pilih tanggal dan waktu → submit.
Gunakan input native `date`, `time`, radio/select, dan checkbox yang sudah ada.

## Aturan write

- Masuk hanya untuk siswa yang belum memiliki record pada tanggal tersebut.
- Pulang hanya melengkapi record hadir yang sudah punya `arrivalTime` dan belum
  punya `departureTime`.
- Jangan menimpa foto, GPS, status sakit/izin/libur, atau jam yang sudah ada.
- Pulang tidak boleh lebih awal dari jam masuk record atau jam pulang industri.
- Simpan penanda `mode = proxy`; audit tambahan tidak dibuat kecuali diminta.

## File perkiraan

- `routes/web.php`
- `app/Http/Requests/StoreProxyAttendanceRequest.php`
- `app/Http/Controllers/AttendanceMonitorController.php`
- `resources/js/components/attendance-monitor/proxy-attendance-modal.tsx`
- `resources/js/components/attendance-monitor/daily-roster.tsx`
- `tests/Feature/ProxyAttendanceTest.php`

## Test wajib

- Ketiga role dapat melakukan masuk/pulang dalam scope.
- Pembimbing industri tidak dapat mengakses siswa industri lain.
- Pulang tanpa masuk, pulang terlalu awal, dan overwrite record ditolak.
- Batch campuran melaporkan jumlah berhasil dan dilewati.
- Absen mandiri dengan foto/GPS tetap utuh.
