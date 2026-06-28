import { store } from '@/actions/App/Http/Controllers/ActivityController';
import { ActivityForm } from '@/components/activities/activity-form';
import { AppLayout } from '@/layouts/app-layout';

export default function ActivityCreate() {
    return (
        <AppLayout title="Tambah Jurnal">
            <ActivityForm
                submitUrl={store.url()}
                method="post"
                submitLabel="Simpan jurnal"
            />
        </AppLayout>
    );
}
