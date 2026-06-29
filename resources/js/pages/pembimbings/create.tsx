import { store } from '@/actions/App/Http/Controllers/PembimbingController';
import { PembimbingForm } from '@/components/pembimbings/pembimbing-form';
import { AppLayout } from '@/layouts/app-layout';

export default function PembimbingCreate() {
    return (
        <AppLayout title="Tambah Pembimbing Industri">
            <PembimbingForm
                action={store.url()}
                method="post"
                submitLabel="Simpan pembimbing"
            />
        </AppLayout>
    );
}
