import { update } from '@/actions/App/Http/Controllers/WakasekController';
import { WakasekForm } from '@/components/wakaseks/wakasek-form';
import type { WakasekDefaults } from '@/components/wakaseks/wakasek-form';
import { AppLayout } from '@/layouts/app-layout';

export default function WakasekEdit({
    wakasek,
}: {
    wakasek: WakasekDefaults & { id: number };
}) {
    return (
        <AppLayout title="Edit Wakasek">
            <WakasekForm
                action={update.url(wakasek.id)}
                method="put"
                wakasek={wakasek}
                submitLabel="Perbarui wakasek"
            />
        </AppLayout>
    );
}
