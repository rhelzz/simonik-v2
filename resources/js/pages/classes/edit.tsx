import { update } from '@/actions/App/Http/Controllers/ClassController';
import { ClassForm } from '@/components/classes/class-form';
import type {
    ClassDefaults,
    DepartemenOption,
} from '@/components/classes/class-form';
import { AppLayout } from '@/layouts/app-layout';

export default function ClassEdit({
    class: classItem,
    departemens,
}: {
    class: ClassDefaults;
    departemens: DepartemenOption[];
}) {
    return (
        <AppLayout title="Edit Kelas">
            <ClassForm
                action={update.url(classItem.id)}
                method="put"
                departemens={departemens}
                classItem={classItem}
                submitLabel="Perbarui kelas"
            />
        </AppLayout>
    );
}
