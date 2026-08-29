# Fase 35 — Penilaian Penuh oleh Industri

**Request:** PKL-008 · **Risiko:** tinggi · **Migrasi:** ya.

**Status:** Selesai — migration forward-only menambah label teknis custom dan
mengizinkan skor kosong, dengan write tetap dibatasi scope pembimbing industri.

## Keputusan wajib sebelum eksekusi

- “Industri” dipetakan ke akun `pembimbing`, karena itulah role perwakilan
  industri pada kode dan screenshot.
- Lima teks aspek teknis bersifat custom per siswa. Jangan mengubah master
  `aspek_produktifs`, karena perubahan master akan mengganti kompetensi semua siswa.
- Pembimbing industri menjadi pengisi nilai teknis dan non-teknis. Hak guru
  terhadap non-teknis dicabut hanya setelah keputusan ini dikonfirmasi.

## Model minimal

Tambahkan penyimpanan label kompetensi teknis per evaluasi/siswa melalui
migration forward-only. Pilih perubahan terkecil setelah memeriksa constraint
`evaluations`; jangan membuat sistem template baru.

## Pengerjaan

1. Tetapkan tepat lima slot teknis per siswa pada UI.
2. Pembimbing dapat mengubah teks slot teknis dan nilai 0–100.
3. Pembimbing dapat mengisi nilai aspek non-teknis yang sudah didefinisikan admin.
4. Admin/kaprog tetap mengelola master non-teknis; siswa hanya melihat.
5. Semua write dibatasi ke siswa pada industri pembimbing.
6. Rekap, rapor, grade, dan sertifikat membaca nilai baru tanpa duplikasi.

## File perkiraan

- migration baru
- model/request penilaian yang sudah ada
- `app/Http/Controllers/AssessmentController.php`
- `resources/js/pages/assessments/show.tsx`
- rapor bila bentuk data berubah
- test assessment dan rapor

## Test wajib

- Pembimbing menyimpan lima label teknis dan seluruh nilai siswa industrinya.
- Pembimbing industri lain, guru, dan payload aspek keenam ditolak.
- Update satu siswa tidak mengubah label siswa lain atau master sekolah.
- Nilai kosong menghapus nilai sesuai perilaku lama tanpa menghapus label tanpa sengaja.
- Grade dan rapor memakai nilai terbaru.

## Risiko deploy

Backup DB sebelum migrate. Data evaluasi lama harus tetap terbaca; migration
tidak boleh drop/recreate tabel berisi nilai produksi.
