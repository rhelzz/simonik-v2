# Fase 30 — Impor Orang Tua Minimal + Tautan Anak

**Request:** PKL-014 · **Risiko:** sedang · **Migrasi:** tidak.

## Kontrak data

Kolom minimum: `Nama Anak`, `Nama Orang Tua`, `No HP`. Email, gender, alamat,
dan pekerjaan opsional. Orang tua tanpa email dibuat tanpa akun (`user_id = null`),
sesuai kemampuan model/CRUD yang sudah ada.

Nama anak dicocokkan case-insensitive setelah trim. Nama yang tidak ditemukan
atau tidak unik harus gagal pada baris tersebut; jangan menebak siswa.

## Pengerjaan

1. Ubah spesifikasi dan template impor orang tua.
2. Longgarkan validasi `ParentImport` sesuai kontrak minimum.
3. Buat profil orang tua, lalu isi `students.parent_id` dalam transaksi per baris.
4. Email yang diisi tetap dinormalisasi ke `@simonik.local` dan unik.
5. Preview dan hasil impor harus melaporkan baris gagal beserta alasannya.

## File perkiraan

- `app/Support/ImportSpecs.php`
- `app/Support/ImportTemplates.php`
- `app/Imports/ParentImport.php`
- test impor terkait

## Test wajib

- Tiga kolom minimum berhasil dan menautkan siswa.
- Data opsional kosong tidak menggagalkan impor.
- Nama anak tidak ditemukan dan nama duplikat tidak membuat tautan salah.
- Siswa di baris gagal tidak berubah.
- Template hasil download dapat diimpor kembali.

## Tidak termasuk

Fuzzy matching nama, membuat siswa baru, atau menautkan satu orang tua ke
beberapa anak dari satu sel. Tambahkan hanya jika spreadsheet nyata membutuhkannya.

