import { store } from '@/actions/App/Http/Controllers/IndustryController';
import { IndustryForm } from '@/components/industries/industry-form';
import type { IndustryOptions } from '@/components/industries/industry-form';
import { AppLayout } from '@/layouts/app-layout';

export default function IndustryCreate({
    options,
}: {
    options: IndustryOptions;
}) {
    return (
        <AppLayout title="Tambah Industri">
            <IndustryForm
                action={store.url()}
                method="post"
                options={options}
                submitLabel="Simpan industri"
            />
        </AppLayout>
    );
}
