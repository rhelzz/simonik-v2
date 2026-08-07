/**
 * Pemeriksa mandiri untuk `grid.ts`.
 *
 * Proyek ini belum punya test runner JS, dan menambah satu demi satu berkas
 * tidak sepadan — sementara logika di sini (tempel, isi-ke-bawah, salin
 * rentang) adalah jenis kode yang diam-diam merusak data kalau salah.
 *
 * Jalankan (Node 24 menjalankan TypeScript langsung, tanpa dependensi baru):
 *   node resources/js/lib/grid.check.ts
 */
import {
    fillDown,
    parsePaste,
    pasteAt,
    rangeOf,
    rangeToTsv,
    withoutBlankRows,
} from './grid.ts';

let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);

    if (a === e) {
        console.log(`  ok  ${name}`);

        return;
    }

    failed++;
    console.log(`FAIL  ${name}\n      dapat   ${a}\n      harusnya ${e}`);
}

// --- parsePaste ---
check('tempel 3 baris x 2 kolom', parsePaste('a\tb\nc\td\ne\tf'), [
    ['a', 'b'],
    ['c', 'd'],
    ['e', 'f'],
]);
check('CRLF diperlakukan sama', parsePaste('a\tb\r\nc\td'), [
    ['a', 'b'],
    ['c', 'd'],
]);
check('baris baru di akhir diabaikan', parsePaste('a\tb\n'), [['a', 'b']]);

// --- pasteAt ---
check(
    'tempel menambah baris bila datanya lebih panjang',
    pasteAt(
        [['', '', '']],
        { r: 0, c: 0 },
        [
            ['a', 'b'],
            ['c', 'd'],
        ],
        3,
    ),
    [
        ['a', 'b', ''],
        ['c', 'd', ''],
    ],
);
check(
    'tempel mulai dari sel aktif, kolom di luar lebar dibuang',
    pasteAt([['x', 'y', 'z']], { r: 0, c: 2 }, [['a', 'b']], 3),
    [['x', 'y', 'a']],
);

// --- fillDown ---
const rows = [
    ['XI RPL 1', 'A', 'tetap'],
    ['', '', 'tetap'],
    ['', '', 'tetap'],
];

check(
    'isi ke bawah menyalin baris teratas rentang',
    fillDown(rows, rangeOf({ r: 0, c: 0 }, { r: 2, c: 1 })),
    [
        ['XI RPL 1', 'A', 'tetap'],
        ['XI RPL 1', 'A', 'tetap'],
        ['XI RPL 1', 'A', 'tetap'],
    ],
);

check(
    'kolom di luar rentang tidak tersentuh',
    fillDown(
        [
            ['a', 'jangan'],
            ['', 'jangan'],
        ],
        rangeOf({ r: 0, c: 0 }, { r: 1, c: 0 }),
    ),
    [
        ['a', 'jangan'],
        ['a', 'jangan'],
    ],
);

check(
    'baris di atas rentang tidak tersentuh',
    fillDown(
        [
            ['atas', ''],
            ['a', ''],
            ['', ''],
        ],
        rangeOf({ r: 1, c: 0 }, { r: 2, c: 0 }),
    ),
    [
        ['atas', ''],
        ['a', ''],
        ['a', ''],
    ],
);

check(
    'rentang satu baris tidak mengubah apa pun',
    fillDown([['a', 'b']], rangeOf({ r: 0, c: 0 }, { r: 0, c: 1 })),
    [['a', 'b']],
);

// --- rangeToTsv ---
check(
    'salin rentang sebagai TSV',
    rangeToTsv(
        [
            ['a', 'b', 'c'],
            ['d', 'e', 'f'],
        ],
        rangeOf({ r: 0, c: 1 }, { r: 1, c: 2 }),
    ),
    'b\tc\ne\tf',
);

// --- withoutBlankRows ---
check(
    'baris kosong dibuang sebelum dikirim',
    withoutBlankRows([
        ['a', ''],
        ['', ''],
        ['', 'b'],
    ]),
    [
        ['a', ''],
        ['', 'b'],
    ],
);

console.log(failed === 0 ? '\nSemua pemeriksaan lolos.' : `\n${failed} gagal.`);

if (failed > 0) {
    process.exit(1);
}
