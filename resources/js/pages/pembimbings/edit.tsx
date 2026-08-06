import { update } from '@/actions/App/Http/Controllers/PembimbingController';
import { PembimbingForm } from '@/components/pembimbings/pembimbing-form';
import type {
    IndustryOption,
    PembimbingDefaults,
} from '@/components/pembimbings/pembimbing-form';
import { AppLayout } from '@/layouts/app-layout';

export default function PembimbingEdit({
    pembimbing,
    industries,
}: {
    pembimbing: PembimbingDefaults & { id: number };
    industries: IndustryOption[];
}) {
    return (
        <AppLayout title="Edit Pembimbing Industri">
            <PembimbingForm
                action={update.url(pembimbing.id)}
                method="put"
                pembimbing={pembimbing}
                industries={industries}
                submitLabel="Perbarui pembimbing"
            />
        </AppLayout>
    );
}
