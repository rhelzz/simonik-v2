# UI Patterns — SIMONIK

Panduan pola tampilan yang **dipakai ulang** di seluruh halaman admin. Sumber kebenaran ada di komponen React; dokumen ini menjelaskan cara memakainya agar setiap halaman baru / improvisasi tetap **konsisten**.

Referensi implementasi:

- Dropdown: [`resources/js/components/ui/select.tsx`](../resources/js/components/ui/select.tsx)
- Tabel + filter: [`resources/js/pages/students/index.tsx`](../resources/js/pages/students/index.tsx)
- Form: [`resources/js/components/students/student-form.tsx`](../resources/js/components/students/student-form.tsx)

> Prinsip: **jangan** pakai elemen `<select>` bawaan browser. Selalu gunakan komponen `Select`. Warna selalu lewat token tema (bukan hex mentah).

---

## 1. Token warna & radius

Tema didefinisikan di [`resources/css/app.css`](../resources/css/app.css) (`@theme`). Pakai kelas Tailwind yang memetakannya — jangan hardcode hex.

| Token          | Kelas contoh                        | Kegunaan                          |
| -------------- | ----------------------------------- | --------------------------------- |
| `canvas`       | `bg-canvas`                         | Latar halaman / input lembut      |
| `surface`      | `bg-surface`                        | Latar kartu                       |
| `ink`          | `text-ink`                          | Teks utama                        |
| `muted`        | `text-muted`                        | Teks sekunder / placeholder       |
| `line`         | `border-line`, `divide-line`        | Garis & pembatas                  |
| `primary`      | `bg-primary`, `text-primary`        | Aksi utama, state aktif           |
| `primary-soft` | `bg-primary-soft`                   | Badge/ikon lembut, hover halus    |
| `positive`     | `text-positive`, `bg-positive/15`   | Status sukses / selesai           |
| `warning`      | `text-warning`, `bg-warning/15`     | Status berjalan / peringatan      |

**Radius:** kartu `rounded-3xl`, input/tombol `rounded-xl`, pill/badge `rounded-full`.

---

## 2. Dropdown — komponen `Select`

Pengganti `<select>` native. Styling konsisten lintas browser (tidak memakai dropdown OS), aksesibel (`role="listbox"`, navigasi keyboard ↑/↓/Enter/Esc, klik-luar menutup), tinggi terkunci ~3 baris lalu scroll, dan selalu membuka ke bawah.

### API

```ts
type SelectOption = {
    value: string;
    label: string;
    hint?: ReactNode; // ikon / titik warna di kiri label
};

<Select
    value={value}                 // string; '' = belum dipilih
    options={options}             // SelectOption[]
    onChange={(v) => setValue(v)}
    placeholder="Pilih…"
    icon={<Icon className="size-4" />}   // opsional, ikon di trigger
    name="field_name"             // opsional: kirim nilai via hidden input di dalam <Form>
    disabled={false}              // opsional
    ariaLabel="…"
    className="…"                 // opsional wrapper
/>
```

### Dua mode pemakaian

**a. Filter (tanpa form).** State lokal + `router.get`:

```tsx
const options: SelectOption[] = [
    { value: '', label: 'Semua kelas' },
    ...classes.map((c) => ({ value: String(c.id), label: c.name })),
];

<Select
    value={String(filters.class_id ?? '')}
    options={options}
    onChange={(v) => applyFilters({ class_id: v })}
    icon={<GraduationCap className="size-4" />}
/>;
```

**b. Di dalam `<Form>` Inertia.** Pakai state terkontrol + `name` (merender `<input type="hidden">` sehingga ikut ter-submit):

```tsx
const [genderId, setGenderId] = useState(student?.gender ?? '');

<Select name="gender" value={genderId} onChange={setGenderId} options={...} />;
```

> Validasi `required` tidak dienforce browser pada `Select` — andalkan validasi server (Form Request) dan tampilkan `errors` lewat komponen `Field`.

### Opsi dengan indikator warna (mis. status)

```tsx
{ value: 'proses', label: 'Berjalan', hint: <Dot className="bg-warning" /> }
```

---

## 3. Halaman daftar (tabel + filter)

Pola dari [`students/index.tsx`](../resources/js/pages/students/index.tsx). Struktur satu kartu:

```tsx
<section className="rounded-3xl bg-surface p-5 sm:p-6">
  {/* Header: judul + subjudul kiri, tombol aksi utama kanan */}
  {/* Filter bar */}
  {/* Tabel atau empty state */}
  {/* Pagination */}
</section>
```

### Filter bar

- Search di kiri (flex-1) dalam kotak `rounded-xl border border-line bg-canvas/40` dengan ikon `Search` dan `focus-within:ring-2 focus-within:ring-primary/15`.
- Dropdown filter memakai komponen `Select`, disusun grid responsif.
- Ringkasan **"N hasil · M filter aktif"** + tombol **Reset filter** (pill) muncul hanya saat ada filter aktif.

### Tabel

- `overflow-x-auto` + `min-w-160` agar aman di layar kecil.
- Header: `text-xs font-semibold uppercase tracking-wide text-muted` dengan `border-b border-line`.
- Body: `divide-y divide-line`; baris `group hover:bg-canvas/50`.
- **Avatar**: foto bila ada, jika tidak → inisial di `bg-primary-soft text-primary`.
- **Badge status**: pill `rounded-full px-2.5 py-1 text-xs font-semibold` + titik warna, warna dari peta status (`bg-*/15 text-*`).
- **Kolom aksi**: ikon-ikon (`Eye`/`Pencil`/`Trash2`) rata kanan, `opacity-60 group-hover:opacity-100`; hover destruktif `hover:bg-red-50 hover:text-red-500`.

### Empty state

Kotak `border border-dashed border-line` + ikon, pesan, dan tombol **Reset filter** bila sedang memfilter.

### Pagination

Pakai helper `PageLink` (aktif = `bg-primary text-white`, nonaktif = `hover:bg-canvas`, disabled = `opacity-40 pointer-events-none`).

---

## 4. Halaman form (create/edit)

Pola dari [`student-form.tsx`](../resources/js/components/students/student-form.tsx). Satu form dipakai bersama untuk **create & edit** (bedakan lewat prop `student`).

### Struktur

```tsx
<Form action={action} method={method} className="space-y-6">
  {({ processing, errors }) => (
    <>
      <Section icon={…} title="…" description="…"> … </Section>
      {/* action bar sticky */}
      {/* spacer bawah */}
    </>
  )}
</Form>
```

### `Section` — kartu bergrup

Badge ikon `size-10 rounded-xl bg-primary-soft text-primary` + judul + deskripsi, lalu grid field `grid gap-4 sm:grid-cols-2`.

### `Field` — pembungkus input

- Label `text-sm font-medium text-ink`; wajib → tambahkan `*` merah (prop `required`).
- Prop `full` → membentang dua kolom (`sm:col-span-2`).
- Prop `hint` → teks bantuan `text-xs text-muted`.
- `error` → pesan merah dengan ikon `AlertCircle`.

### Input dasar

Kelas seragam (`inputClass`):

```
w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink
placeholder:text-muted transition-colors
focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
```

### Aturan penting

- Semua pilihan (jurusan, kelas, status, dll.) memakai `Select` dengan `name`, **bukan** `<select>`.
- **Field bergantung**: saat "jurusan" berubah, reset "kelas" dan `disable` kelas sampai jurusan dipilih.
- Password: toggle mata (`Eye`/`EyeOff`) + indikator "cocok/tidak cocok" real-time.
- **Action bar** sticky di bawah: `sticky bottom-4 … bg-surface/80 backdrop-blur` berisi tombol Batal + Simpan (`bg-primary`, spinner `LoaderCircle` saat `processing`).
- **Spacer bawah** `h-20` setelah action bar agar dropdown pada baris terakhir punya ruang membuka ke bawah tanpa terpotong.

---

## 5. Checklist saat membuat halaman baru

- [ ] Kartu `rounded-3xl bg-surface p-5 sm:p-6`, warna via token tema.
- [ ] Tidak ada `<select>` native — pakai `Select`.
- [ ] Tabel: avatar/inisial, badge status berwarna, aksi hover, empty state, pagination `PageLink`.
- [ ] Filter: search + `Select`, ringkasan hasil + reset.
- [ ] Form: `Section` + `Field`, `inputClass` seragam, action bar sticky, spacer `h-20`.
- [ ] Andalkan validasi server; tampilkan `errors` via `Field`.
