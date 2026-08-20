# Fase 26 — Sakit & Izin: satu tahap approval (Guru Pembimbing)

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** **TINGGI** ·
**Migrasi:** tidak · **Perkiraan:** ~2-3 jam

## 1. Permintaan

> "Siswa yang sakit mengajukan keterangan sakit agar tidak perlu menautkan orang
> tua. (Setelah murid mengajukan, approval ada di guru pembimbing)"

**Keputusan user (dikonfirmasi):** *"satu tahap saja"* — berlaku untuk **sakit
maupun izin**. Tahap Orang Tua dihapus sepenuhnya dari alur `SakitIzin`.

> ⚠️ **Satu titik di mana rencana ini melampaui permintaan asli — disengaja,
> atas keputusan user.** Permintaan guru hanya menyebut **sakit**; soal **izin**
> ia diam. Menjawab "satu tahap saja", user memilih memberlakukannya untuk
> keduanya. Ini **superset** dari permintaan (yang diminta tetap terpenuhi:
> sakit tidak butuh ortu, approval di guru), tapi ia mengubah perilaku `izin`
> yang tidak diminta siapa pun.
>
> Kalau guru Anda ternyata ingin **izin tetap lewat Orang Tua**, itu masih bisa:
> kembalikan cabang dua tahap **hanya** untuk `type === 'izin'` lewat satu
> method `SakitIzin::requiresParentApproval()` (`return $this->type === 'izin';`)
> yang dipanggil dari tiga titik di §4.2/§4.3/§4.4. Biayanya ~15 baris dan
> Inbox Orang Tua tidak jadi dicabut (§3.4 batal). **Tanyakan dulu ke guru Anda
> sebelum fase ini dikerjakan** — ini satu-satunya butir di seluruh v2.4 yang
> tidak 1:1 dengan permintaannya.

Konsekuensi baik yang langsung didapat: tidak ada dua alur berbeda untuk dua
jenis pengajuan, tidak ada logika "tahap ke berapa ini", dan tidak ada kolom
penanda tahap. Rencana ini **jauh lebih kecil** daripada versi dua-alur yang
sempat dipertimbangkan.

Satu kalimat aturan barunya:

> **Pengajuan sakit dan izin disetujui oleh Guru Pembimbing / Pembimbing Industri
> (fallback Kaprog). Orang Tua tidak lagi ikut menyetujui.**

---

## 2. Kondisi sekarang

### 2.1 Blokade di controller

`app/Http/Controllers/SakitIzinController.php:56-59`:

```php
$student = $request->user()->students;
if (! $student || ! $student->parent_id || ! $student->parents?->users?->hasRole('orangtua')) {
    return back()->withErrors(['date' => 'Anda harus menautkan akun Orang Tua terlebih dahulu sebelum mengajukan sakit/izin.']);
}
```

Blokade ini **dihapus seluruhnya** (bukan dipersempit — tidak ada lagi jenis
pengajuan yang butuh ortu).

### 2.2 Alur dua tahap ditentukan oleh **urutan baris**, bukan kolom

Tiga berkas menyusun satu mekanisme. Menghapus blokade §2.1 tanpa menyentuh
ketiganya menghasilkan pengajuan yang **menggantung selamanya tanpa pesan
galat** — itulah yang fase ini cegah.

**a. `SakitIzinController::store()` baris 74** — `Approval::initiate($sakitIzin)`
membuat satu baris pending. Baris itu bermakna "tahap 1 = Orang Tua" **hanya
karena ia yang pertama**.

**b. `ApproveRequest::canAct()` baris ~90-108** — siapa yang boleh bertindak
ditentukan dari **posisi**:

```php
$index = $approvals->pluck('id')->search($approval->id);

if ($index === 0) {                       // Tahap 1: Ortu
    if (! $approver->hasRole('orangtua')) { return false; }
    $student = $sakitIzin->user->students;
    return $student && $student->parent_id === $approver->parents?->id;
} elseif ($index === 1) {                 // Tahap 2: Industri / Guru / Kaprog
    …
}
```

**c. `ApproveRequest::handle()` baris ~47-72** — tahap 1 disetujui → tahap 2
dibuat; tahap 2 disetujui → baris `attendances` dibuat.

**d. `Approval::scopeForUserQueue()` baris ~118-145** — inbox. Orang tua melihat
approval SakitIzin yang **tidak punya pendahulu**; role lain hanya yang **punya
pendahulu ber-status `approved`**.

### 2.3 Data yang sudah ada di produksi — tiga bentuk

Perubahan ini **tidak** boleh mematikan pengajuan yang sedang berjalan:

| Bentuk | Arti sekarang | Harus tetap bisa diselesaikan? |
|---|---|---|
| 1 approval pending (index 0) | menunggu Ortu | ✅ — setelah fase ini, **Guru** yang menyelesaikannya |
| 2 approval, index 0 `approved` + index 1 pending | Ortu sudah setuju, menunggu Guru | ✅ — cabang index 1 **dipertahankan apa adanya** |
| index 0 `rejected` | ditolak Ortu | selesai, tidak berubah |

Inilah alasan cabang `$index === 1` **tidak dihapus** meski alur baru tidak
pernah membuatnya lagi (§3.3).

---

## 3. Keputusan implementasi

### 3.1 Hapus tahap Ortu, jangan buat penanda tahap apa pun

Karena sakit **dan** izin sama-sama satu tahap, tidak ada lagi yang perlu
dibedakan: tidak ada kolom `intended_role`, tidak ada `requiresParentApproval()`,
tidak ada cabang per-`type`. Approval `SakitIzin` yang pending selalu berarti
satu hal — **menunggu Guru/Industri/Kaprog**.

Ini menghapus kompleksitas, bukan menambah. Alur `SakitIzin` jadi setara dengan
alur `LeaveRequest` yang sudah ada dan sudah terbukti (satu approval, eligible
roles, langsung buat `attendances`).

```php
// ponytail: SakitIzin satu tahap — approval pending selalu berarti "menunggu
// Guru/Industri/Kaprog". Tidak ada penanda tahap karena tidak ada tahap kedua.
// Cabang index 1 dipertahankan hanya untuk menuntaskan data lama (§3.3).
```

### 3.2 Bukti (foto surat) **tetap wajib**

`StoreSakitIzinRequest` sudah mewajibkannya — `SakitIzinController::store()`
memanggil `$request->file('bukti')->store(...)` tanpa cek null, yang hanya aman
kalau aturannya `required`. **Biarkan.**

Setelah tahap Ortu hilang, bukti + penilaian guru adalah satu-satunya pengaman
yang tersisa. Melonggarkan approval **dan** bukti dalam satu fase membuat
"sakit" bisa diklaim siapa saja tanpa jejak apa pun.

> Ini asumsi yang saya ambil karena Anda tidak menyebutkannya. Kalau bukti juga
> ingin dilonggarkan, itu perubahan satu baris di `StoreSakitIzinRequest` —
> tapi **jangan** disatukan ke fase ini.

### 3.3 Cabang `$index === 1` dipertahankan, tidak dihapus

Alur baru tidak pernah membuat approval kedua. Tapi ada data lama bentuk ke-2
(§2.3) di produksi, dan menghapus cabang itu membuat pengajuan yang sudah
disetujui Ortu **tidak bisa diselesaikan siapa pun** — dan tidak ada gejalanya
sampai ada guru yang mencoba.

```php
// ponytail: cabang index 1 hanya melayani pengajuan lama yang terlanjur
// dua tahap. Hapus setelah dipastikan tidak ada approvals SakitIzin pending
// dengan index 1 di produksi:
//   select count(*) from approvals a
//   where a.approvable_type = 'App\Models\SakitIzin' and a.status = 'pending'
//     and exists (select 1 from approvals p
//                 where p.approvable_id = a.approvable_id
//                   and p.approvable_type = a.approvable_type and p.id < a.id);
```

Kueri pembersih itu ditulis di komentar supaya orang berikutnya punya cara
membuktikan bahwa cabang tersebut aman dihapus — bukan menebak.

### 3.4 Inbox Orang Tua akan kosong permanen — dan itu harus ditangani, bukan didiamkan

Konsekuensi yang tidak terlihat dari permintaan, tapi nyata. Baca
`scopeForUserQueue()`:

- Cabang `SakitIzin` adalah **satu-satunya** yang melayani role `orangtua`.
- Cabang `LeaveRequest` dan `Attendance` (WFA) dibungkus
  `if ($user->hasAnyRole(self::ELIGIBLE_ROLES))` — dan `ELIGIBLE_ROLES` =
  `['pembimbing','guru','kaprog']`, **tanpa** `orangtua`.

Jadi setelah fase ini, **Inbox Persetujuan untuk orang tua selalu kosong.**
Membiarkan menunya ada berarti orang tua membuka halaman kosong selamanya dan
mengira aplikasinya rusak.

Yang dilakukan:

1. `resources/js/lib/nav.ts` — item **"Inbox Persetujuan"**: buang `orangtua`
   dari daftar `roles`.
2. `routes/web.php:261` — grup `role:pembimbing|guru|kaprog|orangtua` →
   `role:pembimbing|guru|kaprog`.
3. `ApprovalController::index()` baris ~33 — daftar role yang diizinkan: buang
   `orangtua`.
4. `HandleInertiaRequests.php:48` —
   `hasAnyRole(['pembimbing','guru','kaprog','orangtua'])` untuk
   `pendingApprovalsCount`: buang `orangtua`, supaya lencana hitungan tidak lagi
   dihitung untuk role yang tidak punya antrean.

Keempatnya adalah **satu perubahan yang sama** yang tersebar di empat berkas —
persis pola yang `CLAUDE.md` maksud dengan "fix it once, where all callers route
through", kecuali di sini memang tidak ada satu tempat bersama. Kerjakan
berempat sekaligus, atau tidak sama sekali.

> **Yang orang tua kehilangan:** visibilitas atas pengajuan sakit/izin anaknya.
> Dashboard orang tua (`dashboard-parent.tsx`) tetap menampilkan rekap absen
> anak, jadi ia tetap melihat **hasilnya** (status sakit/izin di rekap) —
> hanya tidak lagi ikut **memutuskan**. Kalau nanti orang tua perlu melihat
> daftar pengajuan tanpa menyetujui, itu halaman baca-saja yang terpisah,
> bukan bagian dari fase ini.

### 3.5 Penolakan tetap berarti tidak ada baris absen

Kalau guru menolak, tidak ada `attendances` yang dibuat — perilaku yang sudah
ada (`handle()` hanya membuat absen pada `STATUS_APPROVED`), tidak diubah.

Siswa itu lalu jatuh ke definisi "belum presensi" (Fase 23) dan, setelah
Fase 27, ditampilkan sebagai **Alpha**. Rantainya konsisten dengan sendirinya —
nol kode penghubung.

---

## 4. Rencana implementasi

Urutan disengaja: perbaiki alurnya dulu, inbox terakhir.

### 4.1 `SakitIzinController::store()`

Hapus blokade §2.1 seluruhnya. Sesuaikan flash sukses:

```php
return redirect()->route('sakit-izin.index')
    ->with('success', 'Pengajuan Sakit/Izin berhasil dikirim dan menunggu persetujuan Guru Pembimbing.');
```

Teks lama menyebut "Orang Tua" — kalau tidak diubah, siswa akan menunggu
persetujuan dari pihak yang tidak lagi terlibat.

### 4.2 `ApproveRequest::canAct()`

Cabang `$index === 0` untuk `SakitIzin` disederhanakan jadi sama dengan
approvable lain:

```php
if ($index === 0) {
    // Satu tahap: Guru Pembimbing / Pembimbing Industri / Kaprog (fallback).
    return $approver->hasAnyRole(Approval::ELIGIBLE_ROLES);
}
```

Cabang `$index === 1` **tidak disentuh** (§3.3).

Efek sampingan yang benar: pengajuan lama yang menunggu Ortu (bentuk 1 di §2.3)
otomatis bisa diselesaikan guru. Tidak perlu migrasi data.

### 4.3 `ApproveRequest::handle()`

Cabang `$index === 0 && $approvalsCount === 1`: **jangan** buat tahap 2 —
langsung buat baris `attendances`.

Kode pembuatan `Attendance` yang sekarang ada di cabang `$index === 1` dipakai
oleh keduanya. **Ekstrak jadi satu method privat** (mis. `recordSakitIzin()`)
supaya tidak ada dua salinan yang bisa berbeda diam-diam:

```php
private function recordSakitIzin(SakitIzin $sakitIzin, User $approver): void
{
    Attendance::updateOrCreate(
        ['user_id' => $sakitIzin->user_id, 'date' => $sakitIzin->date->format('Y-m-d')],
        [
            'status' => $sakitIzin->type,                       // sakit / izin
            'absenceReason' => $sakitIzin->reason,
            'image' => $sakitIzin->getRawOriginal('bukti'),     // path mentah, bukan URL
            'description' => 'Disetujui oleh '.$approver->name.' ('.$approver->getRoleNames()->first().')',
        ]
    );
}
```

`getRawOriginal('bukti')` wajib dipertahankan — `SakitIzin::bukti()` punya
accessor yang mengubah nilainya jadi URL `asset()`. Menyimpan URL ke kolom
`image` akan merusak tampilan foto di rekap absen. Ini sudah benar di kode
sekarang; jangan "dirapikan".

Teks `description` lama berbunyi *"Disetujui oleh Ortu & Industri/Guru"* — harus
ikut berubah, kalau tidak setiap baris absen baru mengklaim persetujuan yang
tidak pernah terjadi.

### 4.4 `Approval::scopeForUserQueue()`

Cabang `SakitIzin` (baris ~118-145) disederhanakan: **buang seluruh blok
`if ($user->hasRole('orangtua')) { whereNotExists… } else { whereExists… }`.**

Yang tersisa: approval `SakitIzin` milik siswa dalam cakupan pemanggil, tanpa
syarat pendahulu apa pun. Lalu pindahkan cabang itu **ke dalam** blok
`if ($user->hasAnyRole(self::ELIGIBLE_ROLES))` yang sudah membungkus
`LeaveRequest` & `Attendance` — sehingga ketiga approvable diperlakukan seragam
dan role di luar `ELIGIBLE_ROLES` tidak mendapat apa-apa.

Ini **penghapusan bersih**, bukan penambahan cabang. Method paling rumit di repo
ini justru menyusut.

> **Sebelum menulis:** baca ulang `scopeForUserQueue()` dari baris 80 sampai
> akhir. Method ini punya 3 sumber kondisi yang bertumpuk (`$studentUserIdsQuery`
> per-role, cabang per-`approvable_type`, cek pendahulu). Satu `orWhere` yang
> salah letak bisa menyembunyikan approval LeaveRequest atau WFA dari semua
> orang — dan tidak ada yang menyadarinya sampai ada pengajuan nyata yang hilang.

### 4.5 Empat berkas inbox orang tua

§3.4 — `nav.ts`, `routes/web.php`, `ApprovalController::index()`,
`HandleInertiaRequests::share()`.

### 4.6 Frontend siswa

`resources/js/pages/sakit-izin/index.tsx` — hapus spanduk/keterangan "tautkan
akun Orang Tua", ganti keterangan alur jadi satu kalimat: *"Pengajuan akan
ditinjau oleh Guru Pembimbing."*

Komponen `<ApprovalStatus>` (`resources/js/components/approval-status.tsx`)
kemungkinan menampilkan dua tahap. **Periksa** — kalau ia meng-hardcode label
"Orang Tua" untuk approval pertama, ikut disesuaikan.

### 4.7 `docs/ROADMAP.md`

Aturan approval berubah — catat (README §4). Ini keputusan yang akan
ditanyakan lagi enam bulan lagi.

---

## 5. Berkas yang disentuh

**Diubah (9):**

```
app/Http/Controllers/SakitIzinController.php      (−blokade, flash)
app/Actions/ApproveRequest.php                    (canAct + handle + extract)
app/Models/Approval.php                           (scopeForUserQueue — menyusut)
app/Http/Controllers/ApprovalController.php       (daftar role)
app/Http/Middleware/HandleInertiaRequests.php     (pendingApprovalsCount)
routes/web.php                                    (grup approval)
resources/js/lib/nav.ts                           (roles Inbox Persetujuan)
resources/js/pages/sakit-izin/index.tsx
docs/ROADMAP.md
```

**Mungkin diubah (1):** `resources/js/components/approval-status.tsx` (§4.6).

**Baru (0):** test masuk ke berkas yang sudah ada — jangan buat berkas test baru
untuk perilaku yang tempatnya sudah jelas.

---

## 6. Test

**`tests/Feature/SakitIzinTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_student_without_parent_can_submit_sakit` | **inti permintaan** |
| `test_student_without_parent_can_submit_izin` | §1 — satu tahap berlaku untuk keduanya |
| `test_submission_creates_exactly_one_approval` | §3.1 — bukan dua |
| `test_bukti_is_still_required` | §3.2 |

**`tests/Feature/ApproveRequestTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_guru_can_approve_sakit_directly` | §4.2 |
| `test_orangtua_cannot_approve_sakit` | tahap ortu benar-benar hilang |
| `test_approved_sakit_creates_attendance_with_bukti_path` | §4.3 — `image` berisi **path**, bukan URL `asset()` |
| `test_approved_izin_creates_attendance_with_izin_status` | jenis izin tetap benar |
| `test_rejected_sakit_creates_no_attendance` | §3.5 |
| `test_legacy_two_stage_sakit_can_still_be_completed` | **§3.3** — data lama bentuk ke-2 (§2.3) tetap bisa dituntaskan |
| `test_leave_request_flow_is_unchanged` | regresi |

**`tests/Feature/InboxApprovalTest.php`:**

| Test | Yang dijaga |
|---|---|
| `test_sakit_appears_in_guru_inbox_immediately` | §4.4 |
| `test_sakit_does_not_appear_in_parent_inbox` | §4.4 |
| `test_orangtua_cannot_access_approval_inbox` | §3.4 — 403 setelah role dicabut dari rute |
| `test_leave_request_and_wfa_approvals_are_unaffected` | **§4.4** — cabang lain di method yang sama tidak ikut rusak |

Dua test terakhir adalah alasan `scopeForUserQueue` disebut bagian paling
berisiko di fase ini.

---

## 7. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Approval lama (2 tahap) jadi tak bisa dituntaskan | Pengajuan siswa nyata menggantung, **tanpa gejala** | Cabang index 1 dipertahankan (§3.3) + test `legacy_two_stage` |
| `scopeForUserQueue` rusak untuk approvable lain | Inbox kehilangan LeaveRequest / WFA | Test regresi; baca seluruh method sebelum menyentuh |
| Inbox orang tua kosong tapi menunya tetap ada | Terlihat seperti aplikasi rusak | §3.4 — empat berkas dikerjakan sekaligus |
| `image` diisi URL `asset()` alih-alih path | Foto bukti rusak di rekap absen | `getRawOriginal('bukti')` dipertahankan (§4.3) + test |
| Teks `description` lama tetap menyebut Ortu | Baris absen mengklaim persetujuan yang tak terjadi | §4.3 |
| Orang tua kehilangan visibilitas pengajuan anak | Keberatan dari pihak sekolah | Konsekuensi yang diminta secara sadar. Dashboard ortu tetap menampilkan hasilnya (§3.4). Kalau perlu, halaman baca-saja adalah fase terpisah. |

**Test lama yang harus tetap hijau:** `SakitIzinTest.php`,
`ApproveRequestTest.php`, `InboxApprovalTest.php`, `LeaveRequestTest.php`,
`AttendanceTest.php`, `MultiRoleAccountTest.php`.
