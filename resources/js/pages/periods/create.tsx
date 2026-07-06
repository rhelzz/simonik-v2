import { store } from '@/actions/App/Http/Controllers/PeriodController';
import { PeriodForm } from '@/components/periods/period-form';
import { AppLayout } from '@/layouts/app-layout';

export default function PeriodCreate() {
    return (
        <AppLayout title="Tambah Periode PKL">
            <PeriodForm
                action={store.url()}
                method="post"
                submitLabel="Simpan periode"
            />
        </AppLayout>
    );
}
