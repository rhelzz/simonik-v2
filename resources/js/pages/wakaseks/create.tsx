import { store } from '@/actions/App/Http/Controllers/WakasekController';
import { WakasekForm } from '@/components/wakaseks/wakasek-form';
import { AppLayout } from '@/layouts/app-layout';

export default function WakasekCreate() {
    return (
        <AppLayout title="Tambah Wakasek">
            <WakasekForm
                action={store.url()}
                method="post"
                submitLabel="Simpan wakasek"
            />
        </AppLayout>
    );
}
