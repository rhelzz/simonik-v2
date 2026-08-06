import { store } from '@/actions/App/Http/Controllers/KaprogController';
import type { AccountCandidate } from '@/components/account-picker';
import { KaprogForm } from '@/components/kaprogs/kaprog-form';
import type { DepartemenOption } from '@/components/kaprogs/kaprog-form';
import { AppLayout } from '@/layouts/app-layout';

export default function KaprogCreate({
    departemens,
    candidates,
}: {
    departemens: DepartemenOption[];
    candidates: AccountCandidate[];
}) {
    return (
        <AppLayout title="Tambah Kepala Program">
            <KaprogForm
                action={store.url()}
                method="post"
                candidates={candidates}
                departemens={departemens}
                submitLabel="Simpan kepala program"
            />
        </AppLayout>
    );
}
