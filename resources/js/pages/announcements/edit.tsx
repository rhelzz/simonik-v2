import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import {
    index,
    update,
} from '@/actions/App/Http/Controllers/AnnouncementController';
import { AnnouncementForm } from '@/components/announcements/announcement-form';
import type { AnnouncementInput } from '@/components/announcements/announcement-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AppLayout } from '@/layouts/app-layout';

export default function AnnouncementEdit({
    announcement,
    roleLabels,
}: {
    announcement: AnnouncementInput & { id: number };
    roleLabels: Record<string, string>;
}) {
    return (
        <AppLayout title="Ubah Pengumuman">
            <Breadcrumb
                items={[
                    { label: 'Pengumuman', href: index.url() },
                    { label: 'Ubah' },
                ]}
            />

            <section className="mt-4 rounded-3xl bg-surface p-5 sm:p-6">
                <Link
                    href={index.url()}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                    <ArrowLeft className="size-4" />
                    Kembali
                </Link>

                <AnnouncementForm
                    roleLabels={roleLabels}
                    submitLabel="Simpan perubahan"
                    initial={{
                        title: announcement.title,
                        body: announcement.body,
                        roles: announcement.roles,
                        starts_at: announcement.starts_at,
                        ends_at: announcement.ends_at,
                    }}
                    onSubmit={(form) => form.put(update.url(announcement.id))}
                />
            </section>
        </AppLayout>
    );
}
