import { store } from '@/actions/App/Http/Controllers/DepartemenController';
import { DepartemenForm } from '@/components/departemens/departemen-form';
import { AppLayout } from '@/layouts/app-layout';

export default function DepartemenCreate() {
    return (
        <AppLayout title="Tambah Jurusan">
            <DepartemenForm
                action={store.url()}
                method="post"
                submitLabel="Simpan jurusan"
            />
        </AppLayout>
    );
}
