import { store } from '@/actions/App/Http/Controllers/StudentController';
import { StudentForm } from '@/components/students/student-form';
import type { StudentOptions } from '@/components/students/student-form';
import { AppLayout } from '@/layouts/app-layout';

export default function StudentCreate({
    options,
}: {
    options: StudentOptions;
}) {
    return (
        <AppLayout title="Tambah Siswa">
            <StudentForm
                action={store.url()}
                method="post"
                options={options}
                submitLabel="Simpan siswa"
            />
        </AppLayout>
    );
}
