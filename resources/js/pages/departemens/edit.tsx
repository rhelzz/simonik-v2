import { update } from '@/actions/App/Http/Controllers/DepartemenController';
import { DepartemenForm } from '@/components/departemens/departemen-form';
import type { DepartemenDefaults } from '@/components/departemens/departemen-form';
import { AppLayout } from '@/layouts/app-layout';

export default function DepartemenEdit({
    departemen,
}: {
    departemen: DepartemenDefaults;
}) {
    return (
        <AppLayout title="Edit Jurusan">
            <DepartemenForm
                action={update.url(departemen.id)}
                method="put"
                departemen={departemen}
                submitLabel="Perbarui jurusan"
            />
        </AppLayout>
    );
}
