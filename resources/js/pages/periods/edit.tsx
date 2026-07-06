import { update } from '@/actions/App/Http/Controllers/PeriodController';
import { PeriodForm } from '@/components/periods/period-form';
import type { PeriodDefaults } from '@/components/periods/period-form';
import { AppLayout } from '@/layouts/app-layout';

export default function PeriodEdit({ period }: { period: PeriodDefaults }) {
    return (
        <AppLayout title="Edit Periode PKL">
            <PeriodForm
                action={update.url(period.id)}
                method="put"
                period={period}
                submitLabel="Perbarui periode"
            />
        </AppLayout>
    );
}
