import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import {
    index,
    store,
} from '@/actions/App/Http/Controllers/AnnouncementController';
import { AnnouncementForm } from '@/components/announcements/announcement-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AppLayout } from '@/layouts/app-layout';

export default function AnnouncementCreate({
    roleLabels,
}: {
    roleLabels: Record<string, string>;
}) {
    const today = new Date().toISOString().slice(0, 10);

    return (
        <AppLayout title="Buat Pengumuman">
            <Breadcrumb
                items={[
                    { label: 'Pengumuman', href: index.url() },
                    { label: 'Buat' },
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
                    submitLabel="Terbitkan pengumuman"
                    initial={{
                        title: '',
                        body: '',
                        roles: ['*'],
                        starts_at: today,
                        ends_at: today,
                    }}
                    onSubmit={(form) => form.post(store.url())}
                />
            </section>
        </AppLayout>
    );
}
