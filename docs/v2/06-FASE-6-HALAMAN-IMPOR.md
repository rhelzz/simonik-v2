# Fase 6 — Halaman Impor dengan Pratinjau ("Excel di web")

**Status:** ✅ **SELESAI (untuk siswa)** · **Prioritas:** P2 (UX, bukan bug) ·
**Risiko regresi:** rendah · **Perkiraan:** ~12 jam
(8 jam halaman + pratinjau, 4 jam lapisan gestur ala Excel di [§4.4](#44-tabel-praktik-ux--gestur-mana-yang-dibangun))
**Prasyarat mutlak:** [Fase 1](01-FASE-1-IMPOR-EXCEL.md) sudah selesai.

> **Hasil implementasi** — lihat [§10](#10-hasil-implementasi).

---

## 1. Permintaan

> "Bisakah gini saja, kita buat dia tuh kaya Excel di web, dan ada
> placeholder/cara isinya, jadi ada page barunya untuk impor gitu."

## 2. Membedah permintaannya

Ada dua kebutuhan berbeda di dalam satu kalimat, dan keduanya butuh jawaban
yang berbeda:

| Yang dirasakan | Kebutuhan sebenarnya | Jawaban |
|---|---|---|
| "Impornya gagal terus" | Bug parser multi-sheet | **Fase 1**, bukan fase ini. Grid di web memakai parser & validator yang sama — kalau itu rusak, grid pun gagal |
| "Nggak tahu cara isinya" | Petunjuk terkubur di dalam file yang harus diunduh dulu; galat baru ketahuan setelah upload | **Fase ini** |
| "Bolak-balik unduh–isi–unggah–gagal–ulangi" | Tidak ada umpan balik sebelum menyimpan | **Fase ini: pratinjau + validasi kering** |

Poin pentingnya: **rasa "Excel di web" itu datang dari pratinjau dan koreksi
inline, bukan dari sel yang bisa diketik.** Operator sudah punya Excel asli
yang jauh lebih enak dipakai untuk mengetik 300 baris. Yang tidak dimilikinya
adalah: "apa yang akan terjadi kalau saya simpan ini?"

## 3. Opsi

### Opsi A — Halaman impor dengan **pratinjau + koreksi baris bermasalah** ✅ **DIPILIH**

Halaman `/students/import` (dan setara untuk master data lain) berisi:

1. **Petunjuk terbaca langsung di halaman** — tabel `Kolom · Wajib · Cara mengisi`
   yang isinya sama persis dengan sheet `Petunjuk` (sumber data yang sama:
   `ImportTemplates`, jadi tidak ada dua versi petunjuk yang bisa menyimpang).
2. **Daftar nilai referensi** (kelas, jurusan, industri, orang tua) yang bisa
   disalin — dari sumber yang sama dengan sheet `Referensi`.
3. **Dua cara memasukkan data:** unggah `.xlsx/.csv`, **atau tempel langsung
   dari Excel** (Ctrl+C di Excel → Ctrl+V di halaman; clipboard-nya TSV).
4. **Tabel pratinjau** hasil parsing: baris valid hijau, baris bermasalah
   merah dengan pesan galatnya di kolom paling kanan.
5. **Semua sel bisa disunting**, dengan segelintir gestur ala Excel yang
   memang sepadan biayanya — lihat [§4.4 Tabel praktik UX](#44-tabel-praktik-ux--gestur-mana-yang-dibangun).
6. Tombol simpan menyebut jumlah: `Simpan 148 baris (3 dilewati)`.

| Pro | Kontra |
|-----|--------|
| Tidak ada dependensi baru sama sekali | Butuh mode "validasi tanpa simpan" di importer |
| Galat ketahuan **sebelum** menyimpan → siklus coba-gagal hilang | Halaman baru per entitas (dimitigasi: satu halaman generik) |
| Petunjuk & referensi terlihat tanpa mengunduh apa pun | — |
| Tempel-dari-Excel = "Excel di web" tanpa menulis satu pun grid | — |
| Gestur Excel dibatasi pada daftar tertutup (§4.4) → permukaan bug tetap kecil | Tiap gestur menambah state yang harus diuji |

### Opsi B — Grid spreadsheet penuh (Handsontable / AG Grid / RevoGrid)

| Pro | Kontra |
|-----|--------|
| Terasa persis seperti Excel | Dependensi besar; Handsontable **tidak gratis untuk komersial**, AG Grid fitur grid-nya berbayar di tier enterprise |
| — | Menambah ratusan KB ke bundle untuk satu halaman admin yang dipakai beberapa kali setahun |
| — | Operator **sudah punya Excel asli** yang lebih baik untuk mengetik massal — kita akan membangun tiruan yang lebih buruk |
| — | Isi/salin/tarik-isi/undo/paste multi-sel adalah permukaan bug yang luas, di jalur yang menulis data master |

❌ Ditolak. Ini menukar bug yang sudah kita pahami dengan kelas bug baru yang
belum kita pahami, di modul yang menyentuh seluruh data sekolah.

### Opsi C — Grid buatan sendiri (tabel `<input>` yang bisa ditambah barisnya)

| Pro | Kontra |
|-----|--------|
| Tanpa dependensi | Kalau dikejar sampai setara Excel (deret otomatis, undo bertingkat, multi-rentang, rumus), biayanya melampaui library yang ditolak di Opsi B |
| — | Mengetik 300 siswa satu sel demi satu sel di browser lebih lambat daripada Excel — ini kemunduran, bukan kemajuan |
| — | Tetap butuh semua kerjaan Opsi A (validasi, pratinjau, simpan) |

❌ Ditolak **sebagai cara utama memasukkan data** — jalur massal tetap
tempel-dari-Excel atau unggah file. Yang diambil dari opsi ini hanyalah
lapisan penyuntingannya, dengan daftar gestur tertutup di §4.4.

## 4. Rencana implementasi

### 4.1 Backend: mode validasi kering di `ImportsRows`

Ini satu-satunya perubahan backend yang berarti. Importer sudah mengakumulasi
`created` / `skipped` / `failed`; yang belum ada adalah cara menjalankannya
**tanpa menulis**.

```php
// ImportsRows
public bool $dryRun = false;

/** @var array<int, array{line: int, data: array<string, mixed>, error: string|null}> */
public array $preview = [];
```

Setiap importer, di titik ia sudah selesai memvalidasi satu baris:

```php
if ($this->dryRun) {
    $this->preview[] = ['line' => $line, 'data' => $row->all(), 'error' => null];
    continue;   // jangan buat user/profil
}
```

Karena semua importer sudah memakai trait ini setelah Fase 1 (termasuk
`StudentsImport`), perubahannya **satu tempat**, bukan sembilan.

> Konsistensi validasi adalah inti fase ini: pratinjau **wajib** memakai
> importer yang sama dengan penyimpanan. Menulis validator kedua khusus
> pratinjau akan menghasilkan "pratinjau bilang aman, simpan tetap gagal" —
> yaitu bug yang lebih menyebalkan daripada yang sedang kita perbaiki.

### 4.2 Dua endpoint per entitas

```php
Route::get('students/import',  [StudentController::class, 'importPage'])->name('students.import-page');
Route::post('students/import/preview', [StudentController::class, 'importPreview'])->name('students.import-preview');
// students.import (POST) yang sudah ada tetap dipakai untuk menyimpan
```

- `importPage()` → `Inertia::render('import/index', [...])` dengan petunjuk,
  referensi, dan judul kolom — **semuanya diambil dari `ImportTemplates`**,
  sumber yang sama dengan file template.
- `importPreview()` → menjalankan importer dengan `dryRun = true`, mengembalikan
  baris + galat. Tidak ada yang tersimpan.
- Penyimpanan menerima **baris yang sudah dikoreksi** sebagai JSON, bukan
  file ulang. Validasinya tetap importer yang sama (lihat §4.6).

Regenerasi Wayfinder setelah menambah rute.

### 4.3 Satu halaman React generik, bukan sembilan

```
resources/js/pages/import/index.tsx
```

Prop-nya cukup: `title`, `headings`, `instructions`, `references`,
`templateUrl`, `previewUrl`, `storeUrl`. Sembilan entitas memakai halaman yang
sama — hanya prop-nya berbeda. Ini justru alasan Opsi A lebih murah daripada
kelihatannya.

Tempel-dari-Excel, inti fiturnya, kira-kira sebesar ini:

```tsx
function parsePaste(text: string): string[][] {
    return text
        .trim()
        .split(/\r?\n/)
        .map((line) => line.split('\t'));
}
```

Clipboard Excel memang TSV. Tidak butuh library. Kasus tepi yang **tidak**
kita tangani: sel berisi tab atau baris baru di dalam tanda kutip (alamat
multi-baris). Kalau itu muncul, operator memakai jalur unggah file —
sebutkan di petunjuk halaman, jangan menulis parser CSV lengkap untuk kasus
yang mungkin tidak pernah terjadi.

### 4.4 Tabel praktik UX — gestur mana yang dibangun

Daftar ini **tertutup**. Apa pun yang tidak ada di kolom "Bangun" tidak
dikerjakan di fase ini, betapapun menggodanya. Setiap baris dinilai dari:
seberapa sering operator sekolah benar-benar memakainya saat menyiapkan data
PKL, dan berapa besar state yang harus dipelihara untuk mendukungnya.

| # | Gestur | Perilaku | Bangun? | Biaya | Alasan |
|---|--------|----------|:-------:|-------|--------|
| 1 | **Tempel banyak baris** (`Ctrl+V` dari Excel) | Clipboard TSV diurai jadi baris & kolom, mengisi tabel mulai dari sel aktif | ✅ | ~15 baris | Jalur utama pengisian massal. Ini yang membuat halaman terasa "Excel di web" |
| 2 | **Isi ke bawah / copas 1 baris ke bawah** (`Ctrl+D`, atau tarik gagang di sudut sel) | Nilai baris/sel aktif disalin ke seluruh baris terpilih di bawahnya | ✅ | ~25 baris | **Permintaan eksplisit.** Kasus nyatanya kuat: Kelas, Jurusan, Industri, Status PKL, PKL Mulai/Selesai hampir selalu sama untuk satu rombongan siswa |
| 3 | **Salin sel/rentang** (`Ctrl+C`) | Rentang terpilih ditulis ke clipboard sebagai TSV | ✅ | ~10 baris | Pasangan wajib dari #1 & #2; tanpanya operator tidak bisa memindah data antar bagian tabel |
| 4 | **Undo satu tingkat** (`Ctrl+Z`) | Mengembalikan tabel ke keadaan sebelum aksi massal terakhir | ✅ | ~10 baris | **Bukan opsional.** #1 dan #2 menimpa banyak sel sekaligus; tanpa undo, satu salah tekan berarti menempel ulang dari awal. Cukup simpan **satu** snapshot sebelumnya — bukan tumpukan riwayat |
| 5 | **Navigasi keyboard** (`Tab` / `Shift+Tab` / `Enter` / panah) | Pindah antar sel tanpa mouse | ✅ | ~20 baris | Mengetik data tabular tanpa ini menyiksa; juga syarat aksesibilitas dasar |
| 6 | **Pilih rentang** (klik lalu geser, `Shift+klik`, `Shift+panah`) | Menandai blok sel sebagai target #2/#3 | ✅ | ~25 baris | Prasyarat teknis #2 dan #3. Cukup rentang persegi tunggal |
| 7 | **Pilih baris** (klik nomor baris) | Memilih satu baris penuh | ✅ | ~5 baris | Bentuk tersering dari "copas 1 baris ke bawah" — gratis begitu #6 ada |
| 8 | **Tambah / hapus baris** | Tombol `+ Baris` dan ikon hapus per baris | ✅ | ~10 baris | Operator pasti menemukan 1–2 baris keliru setelah menempel; tanpa ini ia harus menempel ulang semuanya |
| 9 | **Sel bermasalah ditandai + pesan galat inline** | Border merah, pesan di kolom kanan, tooltip per sel | ✅ | ~15 baris | Ini justru nilai utama halaman ini — bukan gestur Excel, tapi yang membuat pratinjau berguna |
| 10 | **Isi otomatis nilai relasi** (`datalist` pada kolom Kelas/Jurusan/Industri/Orang Tua) | Saran dari daftar referensi saat mengetik | ✅ | ~5 baris | `<input list="…">` bawaan browser. Menghilangkan penyebab galat impor nomor satu (salah ketik nama relasi) dengan biaya nyaris nol |
| 11 | Deret otomatis saat tarik-isi (1, 2, 3 → 4, 5) | Excel menebak pola | ❌ | tinggi | Menebak maksud pengguna. Tidak ada kolom impor kita yang berupa deret; NIS **tidak** boleh ditebak-tebak |
| 12 | Undo bertingkat / redo | Riwayat penuh | ❌ | tinggi | Butuh command stack. Satu tingkat (#4) sudah menutup risiko nyatanya |
| 13 | Rumus (`=A1+B1`) | Parser ekspresi | ❌ | sangat tinggi | Ini berkas impor, bukan lembar kerja |
| 14 | Ubah lebar/urutan kolom, sembunyikan kolom | Manipulasi tata letak | ❌ | sedang | Kolomnya ditentukan importer dan jumlahnya tetap. Nol manfaat |
| 15 | Urutkan / saring pratinjau | Klik judul kolom | ❌ | sedang | Mengurutkan baris yang bernomor baris akan mengacaukan pemetaan galat ke baris. Rawan bug, manfaat kecil |
| 16 | Pilihan tidak bersebelahan (`Ctrl+klik` banyak rentang) | Multi-rentang | ❌ | tinggi | Melipatgandakan kerumitan #2/#3. Rentang tunggal sudah cukup |
| 17 | Salin-tempel dengan format (warna, tebal) | HTML clipboard | ❌ | sedang | Kita hanya butuh teks |
| 18 | Sel gabungan, baris beku, kolom beku | Tata letak Excel | ❌ | sedang | Judul kolom `sticky top-0` (CSS satu baris) sudah menutup satu-satunya kebutuhan nyata di sini |

**Total yang dibangun: ~140 baris kode interaksi**, tanpa dependensi apa pun.
Bandingkan dengan menarik masuk grid library demi 18 fitur yang 8 di antaranya
justru kita larang.

#### Bentuk implementasinya

Satu state, satu sumber kebenaran:

```tsx
type Cell = { r: number; c: number };

const [rows, setRows] = useState<string[][]>([]);
const [anchor, setAnchor] = useState<Cell | null>(null);   // ujung awal rentang
const [focus, setFocus] = useState<Cell | null>(null);     // ujung akhir rentang
const [undo, setUndo] = useState<string[][] | null>(null); // satu snapshot saja
```

Rentang terpilih adalah persegi antara `anchor` dan `focus` — tidak perlu
menyimpan daftar sel, cukup hitung saat render. Setiap aksi massal menyimpan
`rows` saat ini ke `undo` sebelum mengubah.

Isi-ke-bawah (#2) — inti permintaannya, sekitar sebesar ini:

```tsx
/** Salin baris paling atas dari rentang terpilih ke seluruh baris di bawahnya. */
function fillDown() {
    if (!anchor || !focus) return;
    const [r1, r2] = [anchor.r, focus.r].sort((a, b) => a - b);
    const [c1, c2] = [anchor.c, focus.c].sort((a, b) => a - b);

    setUndo(rows);
    setRows(
        rows.map((row, r) =>
            r <= r1 || r > r2
                ? row
                : row.map((cell, c) => (c >= c1 && c <= c2 ? rows[r1][c] : cell)),
        ),
    );
}
```

Tempel (#1) memakai `parsePaste()` dari §4.3, ditulis mulai dari sel aktif dan
**menambah baris baru bila datanya lebih panjang** dari tabel yang ada — kasus
tersering: menempel 200 siswa ke tabel yang baru berisi 1 baris kosong.

#### Aksesibilitas (tidak boleh disederhanakan)

- Setiap sel adalah `<input>` sungguhan dengan `aria-label` berisi
  `"<Judul kolom>, baris <n>"` — bukan `<div contenteditable>`.
- Semua gestur mouse punya padanan keyboard: `Ctrl+D` untuk isi-ke-bawah,
  `Shift+panah` untuk memilih rentang. Gagang-tarik hanyalah pintasan visual,
  bukan satu-satunya jalan.
- Jumlah sel terpilih dan hasil aksi diumumkan lewat elemen `role="status"`
  (`"12 sel terisi"`, `"Dibatalkan"`).
- Baris bermasalah tidak boleh ditandai **hanya** dengan warna — ada ikon dan
  teks galat.

#### Batas performa

Render 500 baris × 16 kolom = 8.000 `<input>`. Itu berat, tapi masih bisa
ditangani browser modern tanpa virtualisasi — dan `max:500` di validasi (§4.6)
memang membatasinya di situ.

```
// ponytail: render seluruh baris tanpa virtualisasi; batas 500 baris menjaganya
// tetap wajar. Kalau batasnya dinaikkan, pasang windowing sebelum menaikkannya.
```

Yang **tidak** boleh dilakukan: menjalankan validasi ke server pada setiap
ketikan. Pratinjau divalidasi saat data masuk (tempel/unggah) dan saat menekan
tombol validasi ulang — bukan per karakter.

### 4.5 Panel referensi data relasi

Ini yang paling sering jadi penyebab galat impor: kolom relasi diisi dengan
**nama**, lalu di-*resolve* ke id. Salah satu huruf → tidak ketemu. Di
`StudentsImport` relasi yang tidak dikenal hanya dikosongkan disertai
peringatan (`noteRef()`), jadi operator bisa mengira impornya sukses padahal
kolom Kelas/Industri seluruhnya kosong.

Di file template, informasi ini ada di sheet `Referensi` — yang berarti
operator harus berpindah sheet bolak-balik sambil mengetik. Di halaman web
kita bisa lebih baik, dengan **tiga lapis**, dari yang paling pasif ke paling
aktif:

**Lapis 1 — panel referensi yang selalu terlihat.**
Panel di sisi kanan halaman (atau accordion di atas tabel pada layar sempit),
satu bagian per relasi:

```
▸ Kelas (24)          ▸ Jurusan (6)
▸ Industri (78)       ▸ Orang Tua (312)
```

Tiap bagian: kotak pencarian + daftar nama + tombol salin per baris. Sumber
datanya **sama persis** dengan sheet `Referensi`
(`StudentReferenceSheet` / `GenericReferenceSheet`) — jangan buat query kedua
yang bisa menyimpang. Ekstrak query-nya ke `ImportTemplates` agar sheet dan
halaman memakai satu sumber.

Untuk relasi bervolume besar (Orang Tua bisa ratusan), kirim sebagai
[deferred prop](https://inertiajs.com) Inertia v2 dengan skeleton saat
`undefined` — panel referensi tidak boleh memperlambat halaman muncul.

**Lapis 2 — saran otomatis di dalam sel** (gestur #10 di §4.4).
Kolom relasi memakai `<input list="ref-kelas">` + `<datalist>` berisi nama
yang valid. Fitur bawaan browser, ~5 baris, tanpa komponen dropdown:

```tsx
<input list={`ref-${col.key}`} … />
<datalist id="ref-kelas">
    {references.kelas.map((n) => <option key={n} value={n} />)}
</datalist>
```

Operator mengetik "XI RP" → muncul "XI RPL 1", "XI RPL 2" → pilih → dijamin
persis. **Ini yang paling besar dampaknya per baris kode di seluruh fase ini.**

> Kenapa `<datalist>` dan bukan komponen `Select` proyek? Karena kolom ini
> harus tetap menerima ketikan bebas — nilai yang tidak ada di daftar bukan
> kesalahan fatal, hanya peringatan (perilaku `noteRef()` yang sudah ada).
> `Select` memaksa memilih dari daftar tertutup; itu perilaku yang salah di
> sini. Tetap pakai `Select` untuk kolom berenum tertutup seperti
> Jenis Kelamin dan Status PKL.

**Lapis 3 — penandaan setelah validasi.**
Sel relasi yang tidak cocok ditandai **kuning** (peringatan), bukan merah
(galat) — sesuai perilaku importer yang membiarkan barisnya lolos dengan
kolom dikosongkan. Tooltipnya menyebut kandidat terdekat:

```
"Kelas 'XI RPL 4' tidak ditemukan — kolom akan dikosongkan.
 Maksud Anda: XI RPL 1? XI RPL 2?"
```

Kandidat dihitung dengan `levenshtein()` bawaan PHP di sisi server saat
pratinjau (ambil 2 terdekat dengan jarak ≤ 3). Fungsi stdlib, tanpa library
pencocokan fuzzy.

Ringkasan di atas tabel harus menyebut ini secara eksplisit, karena inilah
kegagalan senyap yang paling mahal:

```
⚠ 14 nilai relasi tidak dikenali dan akan dikosongkan. [Tinjau]
```

### 4.6 Menyimpan hasil koreksi

Baris yang sudah disunting dikirim sebagai array asosiatif (judul kolom → nilai),
lalu dijalankan lewat importer yang sama dengan `dryRun = false`. Cara
termurah: buat importer menerima `Collection` langsung sehingga
`collection(collect($rows))` bisa dipanggil tanpa lewat file — tanda tangan
`collection()` memang sudah menerima `Collection`, jadi tidak ada yang perlu
diubah selain memanggilnya.

Batas keamanan yang tidak boleh disederhanakan:

- `'rows' => ['required','array','max:500']` — pratinjau bukan alasan untuk
  menerima payload tak terbatas.
- Otorisasi rute sama persis dengan rute impor yang ada sekarang
  (`role:admin` / `role:admin|kaprog`).
- **Jangan percaya baris yang dikirim balik dari browser.** Ia melewati
  validator yang sama seperti baris dari file — pratinjau adalah kenyamanan,
  bukan bukti kebenaran.

### 4.7 Modal impor lama

Modal di `students/index.tsx` diganti menjadi tautan ke halaman baru. Jangan
pelihara dua jalur impor.

## 5. Berkas yang disentuh

```
app/Imports/Concerns/ImportsRows.php     + dryRun, preview[]
app/Imports/*.php                   (9)  + cabang dryRun (beberapa baris)
app/Http/Controllers/Concerns/HandlesImportExport.php  + importPage(), importPreview()
app/Http/Controllers/*Controller.php     + 2 method tipis per entitas
app/Support/ImportTemplates.php          + accessor petunjuk/referensi sebagai array
                                           (dipakai bersama sheet Referensi — satu sumber)
routes/web.php                           + 2 rute per entitas
resources/js/pages/import/index.tsx      BARU (satu halaman untuk semua entitas)
resources/js/components/import-grid.tsx  BARU (tabel + gestur §4.4)
resources/js/components/import-reference-panel.tsx  BARU (§4.5)
resources/js/pages/*/index.tsx           modal impor → tautan
```

**Nol migrasi. Nol dependensi baru.**

## 6. Test

`tests/Feature/ImportPreviewTest.php`:

```
test_pratinjau_tidak_menyimpan_apa_pun()
    → POST preview dengan 3 baris valid → assertDatabaseCount('students', 0)

test_pratinjau_menandai_baris_bermasalah()
    → 1 baris tanpa email → response memuat galat pada baris tsb

test_pratinjau_dan_penyimpanan_memberi_putusan_yang_sama()
    → baris yang lolos pratinjau pasti tersimpan; yang ditolak pratinjau
      juga ditolak saat simpan     ← test terpenting di fase ini

test_baris_dari_browser_tetap_divalidasi()
    → POST store langsung dengan baris invalid (melewati pratinjau) → 422

test_relasi_tak_dikenal_ditandai_peringatan_bukan_galat()
    → baris dengan Kelas "XI RPL 9" → pratinjau menandainya sebagai warning,
      barisnya tetap boleh disimpan, kolom kelas kosong (sama dgn noteRef())

test_saran_kandidat_relasi_terdekat()
    → "XI RPL 9" → kandidat memuat "XI RPL 1" (levenshtein ≤ 3)
```

Untuk lapisan gestur (§4.4) cukup **satu** test frontend pada fungsi murninya,
tanpa kerangka pengujian komponen — yang dites adalah logika, bukan DOM:

```
parsePaste() dan fillDown() diuji sebagai fungsi murni:
  - tempel 3 baris × 2 kolom → matriks 3×2
  - fillDown pada rentang baris 0–4 kolom 1 → baris 1–4 kolom 1 == baris 0
  - fillDown tidak menyentuh kolom di luar rentang
  - undo mengembalikan matriks sebelumnya
```

Pisahkan kedua fungsi itu ke modul sendiri (`resources/js/lib/grid.ts`) supaya
bisa diuji tanpa merender apa pun.

## 7. Ekspektasi output

**Sebelum:** buka Data Siswa → modal → "unggah berkas Excel sesuai template"
→ unduh template → buka Excel → tebak-tebak isian → unggah → banner merah →
ulangi. Petunjuk hanya terlihat kalau file-nya dibuka.

**Sesudah:**

- Menu **Impor Data** membuka halaman utuh: petunjuk per kolom terbaca
  langsung, panel referensi relasi di samping, dan contoh pengisian.
- Salin 150 baris dari Excel → `Ctrl+V` → tabel pratinjau muncul seketika.
- Kolom Kelas kosong semua? Ketik di baris pertama (muncul saran dari daftar
  kelas yang valid) → pilih baris 1–150 → **`Ctrl+D`** → seluruh kolom terisi
  nilai yang dijamin cocok. Salah tekan → `Ctrl+Z`.
- 3 baris merah dengan pesannya sendiri, 14 sel kuning
  (`"Kelas 'XI RPL 4' tidak ditemukan — maksud Anda XI RPL 1?"`)
  → perbaiki di tempat → hijau.
- `Simpan 148 baris` → selesai. Tanpa satu pun siklus unduh-unggah gagal, dan
  tanpa relasi yang diam-diam kosong.
- Halaman yang sama melayani sembilan entitas master data.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| **Pratinjau dan penyimpanan berbeda putusan** — bug terburuk yang mungkin di fase ini | Wajib satu importer, satu validator, dua mode; dikunci test `test_pratinjau_dan_penyimpanan_memberi_putusan_yang_sama` |
| Validasi dilewati karena data datang dari JSON, bukan file | Baris dari browser melewati validator yang sama; ada test khusus |
| **Fase ini berubah jadi proyek grid** — risiko terbesar kedua setelah divergensi validasi | Batas tegasnya adalah [tabel §4.4](#44-tabel-praktik-ux--gestur-mana-yang-dibangun): 10 gestur dibangun, 8 ditolak dengan alasan tertulis. Permintaan gestur baru **wajib** ditambahkan ke tabel itu beserta biayanya sebelum dikerjakan — bukan disisipkan diam-diam saat implementasi |
| Undo satu tingkat tidak cukup saat operator melakukan dua aksi massal berturut-turut | Diterima sadar. Snapshot tunggal menutup kasus "salah tekan lalu langsung sadar", yang merupakan mayoritas. Tumpukan riwayat baru dibangun kalau keluhannya benar-benar muncul |
| Tempel gagal untuk sel berisi baris baru (alamat multi-baris) | Didokumentasikan di halaman; jalur unggah file tetap tersedia |
| Payload besar dari tempel ribuan baris | `max:500` di validasi + pesan yang menyarankan unggah file |
| Dua jalur impor dipelihara berbarengan | Modal lama dihapus pada commit yang sama, bukan "nanti" |

## 9. Urutan yang disarankan

1. **Fase 1 dulu, dan pastikan impor benar-benar jalan.** Kalau ternyata
   sesudah Fase 1 operator sudah tidak mengeluh lagi, fase ini boleh
   ditunda — ia UX, bukan bug.
2. Kalau tetap dibutuhkan, kerjakan **hanya untuk siswa dulu** (entitas dengan
   volume terbesar dan kolom terbanyak). Halamannya sudah generik sejak awal,
   jadi menambah delapan entitas sisanya tinggal mengirim prop berbeda —
   lakukan itu setelah halaman siswa terbukti dipakai.


---

## 10. Hasil implementasi

`composer ci:check` hijau: Pint, PHPStan 0 error, **399/399 test lulus**
(+8 dari `ImportPreviewTest`), eslint + prettier + `tsc` lolos. Nol migrasi,
**nol dependensi baru**. Dikerjakan **untuk siswa dulu**, sesuai §9.

### Penyimpangan besar dari rencana — dan ini yang menghemat paling banyak

**Tidak ada mode `dryRun` di sembilan importer.** Rencana §4.1 meminta cabang
`if ($this->dryRun)` di setiap importer. Yang dikerjakan justru:

```php
DB::beginTransaction();
try { $this->runRows($import, $headings, $rows); }
finally { DB::rollBack(); }
```

Pratinjau **menjalankan impor sungguhan lalu membatalkan transaksinya**.
Konsekuensinya persis yang diminta §4.1 tapi tanpa menyentuh satu pun importer:
mustahil pratinjau dan penyimpanan berbeda putusan, karena keduanya benar-benar
kode yang sama — bukan "importer yang sama dengan dua cabang".

Yang ditambahkan ke trait hanya pencatatan terstruktur di `skip()`/`fail()`/
`warn()` — ketiganya sudah terpusat, jadi 9 importer ikut dapat gratis.

**Baris dari halaman tidak lewat berkas.** `runRows()` men-slug judul kolom
persis seperti `WithHeadingRow` (`Str::slug($h, '_')`), lalu memanggil
`collection()` langsung. Importer tidak bisa membedakan asal datanya.

### Bug desain yang tertangkap saat mengetes

Endpoint pratinjau diambil lewat `fetch()` dan dibaca sebagai JSON, tapi
`bootstrap/app.php` hanya merender galat sebagai JSON untuk `api/*`. Validasi
yang gagal membalas **redirect 302**, sehingga `response.json()` di klien akan
pecah. Ditambal dengan menangkap `ValidationException` dan mengembalikan 422
JSON secara eksplisit, plus penanganan `!response.ok` di halaman.

### Satu sumber untuk petunjuk & referensi

`App\Support\ImportSpecs` kini memegang judul kolom, petunjuk, contoh, catatan,
dan daftar nilai relasi. Ketiga sheet template (`StudentTemplateSheet`,
`StudentInstructionSheet`, `StudentReferenceSheet`) **dan** halaman web
membacanya dari sana — petunjuk tidak bisa lagi menyimpang antara berkas dan
layar.

### Pemeriksa untuk logika grid, tanpa menambah test runner

Proyek belum punya runner JS, dan menambah satu demi satu berkas tidak sepadan.
Logika grid dipisah ke `resources/js/lib/grid.ts` (fungsi murni) dengan
pemeriksa mandiri `grid.check.ts` — **11 pemeriksaan**, dijalankan langsung oleh
Node 24 yang memahami TypeScript:

```
node resources/js/lib/grid.check.ts
```

`allowImportingTsExtensions` diaktifkan di `tsconfig.json` supaya impor
`./grid.ts` sah bagi Node maupun `tsc`.

### Gestur yang dibangun

Sesuai daftar tertutup §4.4: tempel banyak baris, **isi-ke-bawah (`Ctrl+D`)**,
salin rentang (`Ctrl+C`), undo satu tingkat (`Ctrl+Z`), navigasi keyboard,
pilih rentang (`Shift`+klik / `Shift`+panah), pilih baris, tambah/hapus baris,
penandaan galat inline, dan saran nilai relasi lewat `<datalist>`.

Yang ditolak tetap ditolak: deret otomatis, rumus, undo bertingkat,
urutkan/saring pratinjau, multi-rentang.

### Belum dikerjakan

- **Delapan entitas master data lain** masih memakai modal impor lama.
  Halamannya sudah generik (prop `title`/`headings`/`instructions`/`references`),
  jadi menambah satu entitas ≈ satu `ImportSpecs::x()` + 2 method tipis di
  controller + 2 rute. Kerjakan saat memang dibutuhkan.
- **Kandidat "maksud Anda: XI RPL 1?"** (§4.5 lapis 3) belum ada. Penandaan
  kuning + pesan "dikosongkan" sudah jalan; saran `levenshtein()` menyusul bila
  ternyata masih sering salah ketik.
- **Verifikasi manual di browser.**
