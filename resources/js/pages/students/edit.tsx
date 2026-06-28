import { update } from '@/actions/App/Http/Controllers/StudentController';
import { StudentForm } from '@/components/students/student-form';
import type {
    StudentDefaults,
    StudentOptions,
} from '@/components/students/student-form';
import { AppLayout } from '@/layouts/app-layout';

export default function StudentEdit({
    student,
    options,
}: {
    student: StudentDefaults & { id: number };
    options: StudentOptions;
}) {
    return (
        <AppLayout title="Edit Siswa">
            <StudentForm
                action={update.url(student.id)}
                method="put"
                options={options}
                student={student}
                submitLabel="Perbarui siswa"
            />
        </AppLayout>
    );
}
