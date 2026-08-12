# Fase 15 — Data Industri: Rapikan Tabel (Alamat Terlalu Panjang)

**Status:** 📝 Rencana · **Prioritas:** P2 · **Risiko regresi:** sangat rendah ·
**Perkiraan:** ~30-45 menit

## 1. Permintaan

> "Pada modul Data industri dirapihkan kembali tabelnya karena sekarang
> alamat perusahaan terlalu panjang."

## 2. Kondisi sekarang

`resources/js/pages/industries/index.tsx:188-202` — kolom pertama tabel
("Industri") menampilkan nama + alamat sebagai subtitle di dalam satu `<td>`:

```tsx
<td className="py-3 pr-3 pl-2">
    <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Building2 className="size-4" />
        </span>
        <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{industry.name}</p>
            <p className="truncate text-xs text-muted">{industry.alamat}</p>
        </div>
    </div>
</td>
```

Masalahnya: `truncate` (Tailwind: `overflow-hidden text-ellipsis
whitespace-nowrap`) hanya efektif kalau elemen punya lebar terbatas.
`min-w-0` di sini cuma mencegah flex item memaksa parent melebar dari sisi
flexbox — tapi `<td>` maupun `<table>` sendiri tidak punya `max-width` atau
lebar kolom yang dipatok. Tabel juga `w-full` (baris 159) tanpa
`table-layout: fixed`. Hasilnya: kolom "Industri" tumbuh mengikuti alamat
terpanjang di halaman itu, mendorong kolom lain (Bidang, Guru, Pembimbing,
Siswa, Aksi) jadi sempit — persis keluhan user.

Tabel sudah dibungkus `overflow-x-auto` (baris 158, `min-w-160` di baris
159), jadi solusi tidak perlu mengubah pola scroll horizontal yang sudah ada
— cukup mematok lebar kolom.

## 3. Keputusan implementasi

### 3.1 `table-layout: fixed` + lebar eksplisit per kolom

Cara paling murah dan tanpa dependency: tambah `table-fixed` di `<table>`,
lalu beri lebar tetap ke kolom "Industri" (yang memuat alamat) via
class Tailwind pada `<th>`/`<td>` pertama, sisanya biarkan mengikuti isi
alami (kolom Bidang/Guru/Pembimbing pendek, Siswa berupa angka, Aksi berupa
ikon).

`table-fixed` mengharuskan lebar kolom lain juga dipatok (browser membagi
rata sisa lebar berdasarkan definisi `<col>`/lebar kolom pertama yang
eksplisit) — supaya tidak ada efek samping, gunakan `<colgroup>` eksplisit
alih-alih menebak lebar tiap `<th>` satu per satu.

### 3.2 `title` attribute untuk teks penuh saat truncated

`truncate` menyembunyikan sisa teks tanpa cara melihatnya. Tambah
`title={industry.alamat}` di elemen alamat supaya alamat penuh tetap bisa
dibaca lewat native browser tooltip (hover) — pola murah, tidak butuh
komponen Tooltip baru.

## 4. Rencana implementasi

### 4.1 `resources/js/pages/industries/index.tsx`

```tsx
<table className="w-full min-w-160 table-fixed border-collapse text-left text-sm">
    <colgroup>
        <col className="w-[34%]" />   {/* Industri (nama + alamat) */}
        <col className="w-[16%]" />   {/* Bidang */}
        <col className="w-[16%]" />   {/* Guru */}
        <col className="w-[16%]" />   {/* Pembimbing */}
        <col className="w-[8%]" />    {/* Siswa */}
        <col className="w-[10%]" />   {/* Aksi */}
    </colgroup>
    <thead>...</thead>
    <tbody>...</tbody>
</table>
```

Dan alamat:

```tsx
<p
    className="truncate text-xs text-muted"
    title={industry.alamat}
>
    {industry.alamat}
</p>
```

Persentase di atas indikatif — disesuaikan saat implementasi berdasarkan
tampilan nyata (breakpoint sm/md di viewport sempit tetap discroll lewat
`overflow-x-auto` yang sudah ada, jadi tidak perlu sempurna di semua lebar
layar).

## 5. Berkas yang disentuh

```
resources/js/pages/industries/index.tsx   table-fixed + colgroup + title attr pada alamat
```

## 6. Test

Perubahan murni CSS/layout, tidak ada logika baru untuk di-assert lewat
PHPUnit. Verifikasi manual di browser (lebar kolom seimbang, alamat panjang
terpotong rapi dengan tooltip, scroll horizontal tetap berfungsi di layar
sempit) — sesuai item Definition of Done "diverifikasi manual di browser".

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| `table-fixed` bikin kolom lain (mis. Bidang dengan teks panjang) ikut terpotong tak terduga | Cek isi kolom lain saat verifikasi manual; kalau ada yang butuh truncate juga, tambahkan `truncate` + `title` di situ juga (sama pola §3.2) |
