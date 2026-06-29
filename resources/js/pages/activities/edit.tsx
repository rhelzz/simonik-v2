import { update } from '@/actions/App/Http/Controllers/ActivityController';
import { ActivityForm } from '@/components/activities/activity-form';
import type { ActivityDefaults } from '@/components/activities/activity-form';
import { AppLayout } from '@/layouts/app-layout';

export default function ActivityEdit({
    activity,
}: {
    activity: ActivityDefaults & { id: number };
}) {
    return (
        <AppLayout title="Edit Jurnal">
            <ActivityForm
                action={update.url(activity.id)}
                method="put"
                activity={activity}
                submitLabel="Perbarui jurnal"
            />
        </AppLayout>
    );
}
