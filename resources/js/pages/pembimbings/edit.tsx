import { update } from '@/actions/App/Http/Controllers/PembimbingController';
import { PembimbingForm } from '@/components/pembimbings/pembimbing-form';
import type { PembimbingDefaults } from '@/components/pembimbings/pembimbing-form';
import { AppLayout } from '@/layouts/app-layout';

export default function PembimbingEdit({
    pembimbing,
}: {
    pembimbing: PembimbingDefaults & { id: number };
}) {
    return (
        <AppLayout title="Edit Pembimbing Industri">
            <PembimbingForm
                action={update.url(pembimbing.id)}
                method="put"
                pembimbing={pembimbing}
                submitLabel="Perbarui pembimbing"
            />
        </AppLayout>
    );
}
