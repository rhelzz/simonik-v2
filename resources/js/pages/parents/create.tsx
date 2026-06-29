import { store } from '@/actions/App/Http/Controllers/ParentController';
import { ParentForm } from '@/components/parents/parent-form';
import { AppLayout } from '@/layouts/app-layout';

export default function ParentCreate() {
    return (
        <AppLayout title="Tambah Orang Tua">
            <ParentForm
                action={store.url()}
                method="post"
                submitLabel="Simpan orang tua"
            />
        </AppLayout>
    );
}
