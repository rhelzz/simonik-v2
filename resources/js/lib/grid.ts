/**
 * Logika tabel isian pada halaman impor, dipisah dari komponennya supaya bisa
 * diuji tanpa merender apa pun.
 */

export type Cell = { r: number; c: number };

/** Rentang persegi antara dua sel, sudah dinormalkan. */
export type Range = { r1: number; r2: number; c1: number; c2: number };

export function rangeOf(anchor: Cell, focus: Cell): Range {
    return {
        r1: Math.min(anchor.r, focus.r),
        r2: Math.max(anchor.r, focus.r),
        c1: Math.min(anchor.c, focus.c),
        c2: Math.max(anchor.c, focus.c),
    };
}

export function inRange(range: Range, r: number, c: number): boolean {
    return r >= range.r1 && r <= range.r2 && c >= range.c1 && c <= range.c2;
}

/**
 * Clipboard Excel berupa TSV, jadi tidak perlu pustaka apa pun.
 *
 * Kasus tepi yang **tidak** ditangani: sel yang isinya memuat tab atau baris
 * baru di dalam tanda kutip (mis. alamat multi-baris). Untuk itu operator
 * memakai jalur unggah berkas — menulis parser CSV lengkap demi kasus yang
 * mungkin tidak pernah muncul tidak sepadan.
 */
export function parsePaste(text: string): string[][] {
    return text
        .replace(/\r\n?/g, '\n')
        .replace(/\n$/, '')
        .split('\n')
        .map((line) => line.split('\t'));
}

/** Baris kosong sepanjang jumlah kolom. */
export function emptyRow(width: number): string[] {
    return Array.from({ length: width }, () => '');
}

/**
 * Tempel data mulai dari sel `at`, menambah baris bila datanya lebih panjang
 * daripada tabel — kasus tersering: menempel 200 siswa ke tabel yang baru
 * berisi satu baris kosong.
 */
export function pasteAt(
    rows: string[][],
    at: Cell,
    data: string[][],
    width: number,
): string[][] {
    const next = rows.map((row) => [...row]);

    data.forEach((dataRow, i) => {
        const r = at.r + i;

        while (next.length <= r) {
            next.push(emptyRow(width));
        }

        dataRow.forEach((value, j) => {
            const c = at.c + j;

            if (c < width) {
                next[r][c] = value;
            }
        });
    });

    return next;
}

/**
 * Salin baris teratas rentang ke seluruh baris di bawahnya — gestur `Ctrl+D`.
 *
 * Kasus nyatanya kuat: Kelas, Jurusan, Industri, dan Status PKL hampir selalu
 * sama untuk satu rombongan siswa.
 */
export function fillDown(rows: string[][], range: Range): string[][] {
    return rows.map((row, r) => {
        if (r <= range.r1 || r > range.r2) {
            return row;
        }

        return row.map((cell, c) =>
            c >= range.c1 && c <= range.c2 ? (rows[range.r1][c] ?? '') : cell,
        );
    });
}

/** Rentang terpilih sebagai TSV, untuk disalin ke clipboard. */
export function rangeToTsv(rows: string[][], range: Range): string {
    const lines: string[] = [];

    for (let r = range.r1; r <= range.r2; r++) {
        const cells: string[] = [];

        for (let c = range.c1; c <= range.c2; c++) {
            cells.push(rows[r]?.[c] ?? '');
        }

        lines.push(cells.join('\t'));
    }

    return lines.join('\n');
}

/** Buang baris yang seluruh selnya kosong (mis. sisa baris isian). */
export function withoutBlankRows(rows: string[][]): string[][] {
    return rows.filter((row) => row.some((cell) => cell.trim() !== ''));
}
