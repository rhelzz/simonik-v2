import { store } from '@/actions/App/Http/Controllers/KaprogController';
import { KaprogForm } from '@/components/kaprogs/kaprog-form';
import type { DepartemenOption } from '@/components/kaprogs/kaprog-form';
import { AppLayout } from '@/layouts/app-layout';

export default function KaprogCreate({
    departemens,
}: {
    departemens: DepartemenOption[];
}) {
    return (
        <AppLayout title="Tambah Kepala Program">
            <KaprogForm
                action={store.url()}
                method="post"
                departemens={departemens}
                submitLabel="Simpan kepala program"
            />
        </AppLayout>
    );
}
