import { store } from '@/actions/App/Http/Controllers/WakasekController';
import type { AccountCandidate } from '@/components/account-picker';
import { WakasekForm } from '@/components/wakaseks/wakasek-form';
import { AppLayout } from '@/layouts/app-layout';

export default function WakasekCreate({
    candidates,
}: {
    candidates: AccountCandidate[];
}) {
    return (
        <AppLayout title="Tambah Wakasek">
            <WakasekForm
                action={store.url()}
                method="post"
                candidates={candidates}
                submitLabel="Simpan wakasek"
            />
        </AppLayout>
    );
}
