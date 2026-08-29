# Fase 29 — Domain pada Login

**Status:** Selesai · **Request:** PKL-002 · **Risiko:** rendah · **Migrasi:** tidak.

## Scope

- Ganti placeholder `nama@sekolah.sch.id` menjadi `nama@simonik.local` pada login.
- Samakan placeholder akun lain yang masih memakai domain lama.
- Jangan mengubah normalisasi email; backend sudah memakai `simonik.local`.

## File

- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/profile/edit.tsx`

## Test dan verifikasi

- `rg "sekolah\\.sch\\.id" resources/js` tidak menemukan placeholder aktif.
- Login dengan akun `@simonik.local` tetap berhasil.
- Verifikasi desktop dan mobile.

## Tidak termasuk

Migrasi email akun lama. Test memang memakai domain lama untuk membuktikan
validasi penolakan; jangan menggantinya secara mekanis.
