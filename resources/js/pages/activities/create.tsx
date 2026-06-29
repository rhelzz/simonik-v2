import { store } from '@/actions/App/Http/Controllers/ActivityController';
import { ActivityForm } from '@/components/activities/activity-form';
import { AppLayout } from '@/layouts/app-layout';

export default function ActivityCreate() {
    return (
        <AppLayout title="Tulis Jurnal">
            <ActivityForm
                action={store.url()}
                method="post"
                submitLabel="Simpan jurnal"
            />
        </AppLayout>
    );
}
