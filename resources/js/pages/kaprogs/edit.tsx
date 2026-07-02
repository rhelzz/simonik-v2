import { update } from '@/actions/App/Http/Controllers/KaprogController';
import { KaprogForm } from '@/components/kaprogs/kaprog-form';
import type {
    DepartemenOption,
    KaprogDefaults,
} from '@/components/kaprogs/kaprog-form';
import { AppLayout } from '@/layouts/app-layout';

export default function KaprogEdit({
    kaprog,
    departemens,
}: {
    kaprog: KaprogDefaults & { id: number };
    departemens: DepartemenOption[];
}) {
    return (
        <AppLayout title="Edit Kepala Program">
            <KaprogForm
                action={update.url(kaprog.id)}
                method="put"
                kaprog={kaprog}
                departemens={departemens}
                submitLabel="Perbarui kepala program"
            />
        </AppLayout>
    );
}
