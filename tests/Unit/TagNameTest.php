<?php

namespace Tests\Unit;

use App\Support\TagName;
use PHPUnit\Framework\TestCase;

/**
 * v2.5 Fase 28 — normalisasi tag forum.
 *
 * Fungsi kecil ini yang menentukan apakah "pengelompokan agar tidak bercampur"
 * benar-benar bekerja: tanpa normalisasi, #Absen dan #absen jadi dua kelompok.
 */
class TagNameTest extends TestCase
{
    public function test_hash_and_case_are_normalised(): void
    {
        foreach (['#Absen', 'absen', '#ABSEN', '##absen', 'Absen '] as $input) {
            $this->assertSame(
                'absen',
                TagName::normalise($input),
                "Masukan [{$input}] seharusnya jadi 'absen'.",
            );
        }
    }

    public function test_spaces_become_hyphens(): void
    {
        $this->assertSame('kendala-absen', TagName::normalise('#kendala absen'));
        $this->assertSame('kendala-absen', TagName::normalise('kendala   absen'));
    }

    public function test_symbols_and_emoji_are_stripped(): void
    {
        $this->assertSame('aben', TagName::normalise('#ab$en!'));
        $this->assertSame('absen', TagName::normalise('#absen🔥'));
    }

    public function test_hyphens_and_underscores_are_kept(): void
    {
        $this->assertSame('tanya-jawab', TagName::normalise('#tanya-jawab'));
        $this->assertSame('tanya_jawab', TagName::normalise('#tanya_jawab'));
    }

    public function test_repeated_and_edge_hyphens_are_tidied(): void
    {
        $this->assertSame('tanya-jawab', TagName::normalise('#tanya---jawab'));
        $this->assertSame('absen', TagName::normalise('#-absen-'));
    }

    /**
     * Kosong setelah normalisasi = salah ketik, bukan kesalahan yang perlu
     * dijelaskan lewat pesan galat. Pemanggil membuangnya diam-diam.
     */
    public function test_empty_after_normalisation_returns_empty_string(): void
    {
        foreach (['###', '   ', '!!!', '#'] as $input) {
            $this->assertSame('', TagName::normalise($input));
        }
    }

    public function test_length_is_capped(): void
    {
        $tag = TagName::normalise('#'.str_repeat('a', 100));

        $this->assertSame(TagName::MAX_LENGTH, mb_strlen($tag));
    }

    public function test_digits_are_allowed(): void
    {
        $this->assertSame('rpl2024', TagName::normalise('#RPL2024'));
    }
}
