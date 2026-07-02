# Deploy SIMONIK V2 ke Dokploy

Panduan deploy project ini (Laravel 13 + Inertia + React + Vite, DB **MySQL**) ke
[Dokploy](https://dokploy.com) memakai **Dockerfile** + auto-deploy dari Git.

Setiap `git push` ke branch produksi → Dokploy build image dari `Dockerfile` →
container baru jalan otomatis.

---

## Apa yang sudah disiapkan di repo

| File | Fungsi |
| --- | --- |
| `Dockerfile` | Build 3-stage: composer deps → build Vite (dengan PHP untuk Wayfinder) → runtime nginx+php-fpm (`serversideup/php:8.4-fpm-nginx`), port **8080**. |
| `.dockerignore` | Menghindari `node_modules`, `vendor`, `.env`, sqlite, dll ikut ter-copy. |
| `.env.production.example` | Template env produksi (MySQL) — di-paste ke tab Environment Dokploy. |

> Container **otomatis** menjalankan `migrate --force`, `storage:link`, dan
> `config/route/view/event:cache` saat boot (via env `AUTORUN_*` di Dockerfile).
> Jadi tidak perlu jalanin migrate manual tiap deploy.

---

## Prasyarat

1. VPS sudah ter-install Dokploy (`curl -sSL https://dokploy.com/install.sh | sh`).
2. Repo ini sudah ada di GitHub/GitLab/Gitea.
3. Punya `APP_KEY`. Kalau belum, jalanin di lokal:
   ```bash
   php artisan key:generate --show
   ```
   Salin hasilnya (format `base64:...`) untuk dipakai di env Dokploy.

---

## Langkah setting di Dokploy

### 1. Buat Project
Dashboard Dokploy → **Create Project** → beri nama, mis. `simonik`.

### 2. Buat Database MySQL (dulu, sebelum app)
Di dalam project → **Create Service → Database → MySQL**.

- **Service name**: `simonik-db`  *(ini yang jadi `DB_HOST` nanti)*
- **Database**: `simonik_v2`
- **User**: `simonik`
- **Password**: buat password kuat, simpan.
- Klik **Create/Deploy**, tunggu status database hijau.

### 3. Buat Application
Project yang sama → **Create Service → Application** → beri nama `simonik-app`.

### 4. Hubungkan ke Git (tab **Source / Provider**)
- **GitHub App** (paling mulus — webhook auto-deploy langsung terpasang), atau
  **Git URL + Deploy Key** kalau repo private tanpa GitHub App.
- Pilih repository dan **branch** (mis. `main`).

### 5. Build Type (tab **Build**)
- Pilih **Dockerfile**.
- **Dockerfile path**: `Dockerfile`
- **Build context / path**: `.`

> Catatan: repo juga masih punya `nixpacks.toml` (bekas percobaan lama).
> Pastikan build type dipilih **Dockerfile**, bukan Nixpacks, agar file ini yang dipakai.

### 6. Environment Variables (tab **Environment**)
Paste isi `.env.production.example`, lalu sesuaikan:

- `APP_KEY` → key asli dari langkah prasyarat.
- `APP_URL` → domain produksi (mis. `https://simonik.domain-anda.com`).
- `DB_HOST=simonik-db` (nama service DB di langkah 2, **bukan** `127.0.0.1`).
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` → samakan dengan langkah 2.

### 7. Port & Domain (tab **Domains**)
- **Container Port**: `8080`  *(image serversideup meng-expose 8080)*.
- Tambah domain, arahkan **A record** DNS domain ke IP VPS.
- Aktifkan **HTTPS / Let's Encrypt** untuk SSL otomatis.

### 8. Persistent Storage (opsional tapi disarankan)
Agar file upload (mis. foto face-recognition, dokumen PKL) tidak hilang saat
re-deploy → tab **Advanced / Volumes**:

- **Mount path (container)**: `/var/www/html/storage/app/public`
- Buat volume dan mount ke path di atas.

### 9. Deploy
Klik **Deploy**. Dokploy akan build image lalu jalankan container.
Boot pertama otomatis menjalankan migrasi + cache config.

### 10. Auto-deploy
Kalau pakai GitHub App (langkah 4), webhook sudah otomatis → tiap `git push`
ke branch terpilih memicu deploy baru. Kalau tidak, salin **Webhook URL** di
tab Deployments dan pasang di *Settings → Webhooks* repo.

---

## Verifikasi & operasional

- **Buka domain** → harus muncul halaman login SIMONIK.
- **Cek log**: tab **Logs** di service `simonik-app`.
- **Terminal** (tab Terminal service) untuk perintah manual bila perlu:
  ```bash
  php artisan migrate:status
  php artisan tinker
  php artisan db:seed --force          # kalau perlu seed data awal (role/permission)
  ```

### Seeder pertama kali
Aplikasi ini pakai `spatie/laravel-permission` (role & permission). Setelah deploy
pertama, kemungkinan perlu jalankan seeder role/admin lewat Terminal Dokploy:
```bash
php artisan db:seed --force
```

---

## Troubleshooting

| Gejala | Penyebab / solusi |
| --- | --- |
| Build gagal di `npm run build` (error `php: command not found`) | Wayfinder butuh PHP saat build. Sudah ditangani di Dockerfile stage `assets`. Pastikan pakai Dockerfile ini utuh. |
| `500` + layar putih, log `No application encryption key` | `APP_KEY` belum di-set di Environment. |
| `SQLSTATE... Connection refused` | `DB_HOST` salah. Harus nama service DB (`simonik-db`), bukan `127.0.0.1`/`localhost`. |
| CSS/JS tidak muncul (asset 404) | `APP_URL` salah atau tidak `https`. Set `APP_URL` sesuai domain, re-deploy. |
| Redirect http↔https loop | Pastikan `APP_URL` https dan `SESSION_SECURE_COOKIE=true`. Dokploy sudah handle TLS di proxy. |
| Upload hilang setelah re-deploy | Belum mount volume ke `storage/app/public` (langkah 8). |

---

## Ringkasan alur update harian

```bash
# di lokal
git add .
git commit -m "feat: ..."
git push            # → Dokploy auto build & deploy
```

Migrasi baru jalan otomatis saat container boot. Selesai. ✅
