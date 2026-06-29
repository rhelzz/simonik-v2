import { update } from '@/actions/App/Http/Controllers/TeacherController';
import { TeacherForm } from '@/components/teachers/teacher-form';
import type {
    DepartemenOption,
    TeacherDefaults,
} from '@/components/teachers/teacher-form';
import { AppLayout } from '@/layouts/app-layout';

export default function TeacherEdit({
    teacher,
    departemens,
}: {
    teacher: TeacherDefaults & { id: number };
    departemens: DepartemenOption[];
}) {
    return (
        <AppLayout title="Edit Guru">
            <TeacherForm
                action={update.url(teacher.id)}
                method="put"
                departemens={departemens}
                teacher={teacher}
                submitLabel="Perbarui guru"
            />
        </AppLayout>
    );
}
