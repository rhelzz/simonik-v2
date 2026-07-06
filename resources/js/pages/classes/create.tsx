import { store } from '@/actions/App/Http/Controllers/ClassController';
import { ClassForm } from '@/components/classes/class-form';
import type { DepartemenOption } from '@/components/classes/class-form';
import { AppLayout } from '@/layouts/app-layout';

export default function ClassCreate({
    departemens,
}: {
    departemens: DepartemenOption[];
}) {
    return (
        <AppLayout title="Tambah Kelas">
            <ClassForm
                action={store.url()}
                method="post"
                departemens={departemens}
                submitLabel="Simpan kelas"
            />
        </AppLayout>
    );
}
