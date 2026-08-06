import { store } from '@/actions/App/Http/Controllers/TeacherController';
import type { AccountCandidate } from '@/components/account-picker';
import { TeacherForm } from '@/components/teachers/teacher-form';
import type { DepartemenOption } from '@/components/teachers/teacher-form';
import { AppLayout } from '@/layouts/app-layout';

export default function TeacherCreate({
    departemens,
    candidates,
}: {
    departemens: DepartemenOption[];
    candidates: AccountCandidate[];
}) {
    return (
        <AppLayout title="Tambah Guru">
            <TeacherForm
                action={store.url()}
                method="post"
                candidates={candidates}
                departemens={departemens}
                submitLabel="Simpan guru"
            />
        </AppLayout>
    );
}
