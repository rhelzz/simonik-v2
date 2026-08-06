import { store } from '@/actions/App/Http/Controllers/PembimbingController';
import type { AccountCandidate } from '@/components/account-picker';
import { PembimbingForm } from '@/components/pembimbings/pembimbing-form';
import type { IndustryOption } from '@/components/pembimbings/pembimbing-form';
import { AppLayout } from '@/layouts/app-layout';

export default function PembimbingCreate({
    candidates,
    industries,
}: {
    candidates: AccountCandidate[];
    industries: IndustryOption[];
}) {
    return (
        <AppLayout title="Tambah Pembimbing Industri">
            <PembimbingForm
                action={store.url()}
                method="post"
                candidates={candidates}
                industries={industries}
                submitLabel="Simpan pembimbing"
            />
        </AppLayout>
    );
}
