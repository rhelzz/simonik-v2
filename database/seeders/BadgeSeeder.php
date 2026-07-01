<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    /** @var array<int, array<string, mixed>> */
    private const BADGES = [
        [
            'key' => 'streak_7',
            'name' => 'Rajin Seminggu',
            'description' => 'Mengisi jurnal 7 hari berturut-turut.',
            'icon' => '🔥',
            'color' => 'bg-orange-500/10 text-orange-600',
            'rule_type' => Badge::RULE_STREAK_JOURNAL,
            'rule_value' => 7,
        ],
        [
            'key' => 'streak_30',
            'name' => 'Setia Sebulan',
            'description' => 'Mengisi jurnal 30 hari berturut-turut tanpa jeda.',
            'icon' => '💎',
            'color' => 'bg-violet-500/10 text-violet-600',
            'rule_type' => Badge::RULE_STREAK_JOURNAL,
            'rule_value' => 30,
        ],
        [
            'key' => 'journal_10',
            'name' => 'Penulis Aktif',
            'description' => 'Menulis total 10 jurnal kegiatan.',
            'icon' => '📝',
            'color' => 'bg-blue-500/10 text-blue-600',
            'rule_type' => Badge::RULE_TOTAL_JOURNAL,
            'rule_value' => 10,
        ],
        [
            'key' => 'journal_50',
            'name' => 'Penulis Produktif',
            'description' => 'Menulis total 50 jurnal kegiatan.',
            'icon' => '✍️',
            'color' => 'bg-indigo-500/10 text-indigo-600',
            'rule_type' => Badge::RULE_TOTAL_JOURNAL,
            'rule_value' => 50,
        ],
        [
            'key' => 'journal_100',
            'name' => 'Master Jurnal',
            'description' => 'Mencapai 100 jurnal kegiatan — prestasi luar biasa!',
            'icon' => '🏆',
            'color' => 'bg-amber-500/10 text-amber-600',
            'rule_type' => Badge::RULE_TOTAL_JOURNAL,
            'rule_value' => 100,
        ],
        [
            'key' => 'attendance_5',
            'name' => 'Hadir Seminggu',
            'description' => 'Hadir 5 kali di tempat PKL.',
            'icon' => '✅',
            'color' => 'bg-green-500/10 text-green-600',
            'rule_type' => Badge::RULE_TOTAL_ATTENDANCE,
            'rule_value' => 5,
        ],
        [
            'key' => 'attendance_20',
            'name' => 'Rajin Hadir',
            'description' => 'Hadir 20 kali di tempat PKL.',
            'icon' => '⭐',
            'color' => 'bg-cyan-500/10 text-cyan-600',
            'rule_type' => Badge::RULE_TOTAL_ATTENDANCE,
            'rule_value' => 20,
        ],
    ];

    public function run(): void
    {
        foreach (self::BADGES as $badge) {
            Badge::firstOrCreate(['key' => $badge['key']], $badge);
        }
    }
}
