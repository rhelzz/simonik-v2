import { update } from '@/actions/App/Http/Controllers/ParentController';
import { ParentForm } from '@/components/parents/parent-form';
import type { ParentDefaults } from '@/components/parents/parent-form';
import { AppLayout } from '@/layouts/app-layout';

export default function ParentEdit({
    parent,
}: {
    parent: ParentDefaults & { id: number };
}) {
    return (
        <AppLayout title="Edit Orang Tua">
            <ParentForm
                action={update.url(parent.id)}
                method="put"
                parent={parent}
                submitLabel="Perbarui orang tua"
            />
        </AppLayout>
    );
}
