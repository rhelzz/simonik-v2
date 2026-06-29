import { store } from '@/actions/App/Http/Controllers/TeacherController';
import { TeacherForm } from '@/components/teachers/teacher-form';
import type { DepartemenOption } from '@/components/teachers/teacher-form';
import { AppLayout } from '@/layouts/app-layout';

export default function TeacherCreate({
    departemens,
}: {
    departemens: DepartemenOption[];
}) {
    return (
        <AppLayout title="Tambah Guru">
            <TeacherForm
                action={store.url()}
                method="post"
                departemens={departemens}
                submitLabel="Simpan guru"
            />
        </AppLayout>
    );
}
