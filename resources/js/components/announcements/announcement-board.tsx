import { usePage } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import { RichText } from '@/components/ui/rich-text';
import type { SharedData } from '@/types';

export type DashboardAnnouncement = {
    id: number;
    title: string;
    body: string;
    author: string | null;
    until: string;
};

/**
 * Pengumuman yang sedang tayang untuk role pemakai.
 *
 * Datanya datang dari satu tempat (HandleInertiaRequests::share) tapi
 * penempatannya tetap eksplisit di tiap dashboard — kalau dipasang di
 * app-layout, pengumuman akan muncul di SEMUA halaman, sedangkan yang diminta
 * adalah "muncul di dashboard".
 */
export function AnnouncementBoard() {
    const { dashboardAnnouncements: announcements } = usePage<
        SharedData & { dashboardAnnouncements?: DashboardAnnouncement[] }
    >().props;

    // Dashboard tidak boleh menampilkan kotak kosong "belum ada pengumuman".
    if (!announcements || announcements.length === 0) {
        return null;
    }

    return (
        <section className="mt-5 space-y-3">
            {announcements.map((announcement) => (
                <article
                    key={announcement.id}
                    className="rounded-3xl border border-primary/20 bg-primary-soft/40 p-5 sm:p-6"
                >
                    <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                            <Megaphone className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-ink">
                                {announcement.title}
                            </h3>
                            <p className="text-xs text-muted">
                                {announcement.author
                                    ? `${announcement.author} · `
                                    : ''}
                                Berlaku sampai {announcement.until}
                            </p>

                            {/* RichText menyaring HTML dengan DOMPurify —
                                jangan ganti dengan dangerouslySetInnerHTML
                                mentah: isi pengumuman dibaca semua role. */}
                            <RichText
                                html={announcement.body}
                                className="mt-2"
                            />
                        </div>
                    </div>
                </article>
            ))}
        </section>
    );
}
