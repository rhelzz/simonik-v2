import { store } from '@/actions/App/Http/Controllers/CertificateTemplateController';
import { CertificateTemplateForm } from '@/components/certificates/certificate-template-form';
import { AppLayout } from '@/layouts/app-layout';

export default function CertificateTemplateCreate({
    fields,
    fonts,
}: {
    fields: string[];
    fonts: string[];
}) {
    return (
        <AppLayout title="Template Sertifikat">
            <CertificateTemplateForm
                action={store.url()}
                method="post"
                fields={fields}
                fonts={fonts}
                submitLabel="Simpan template"
            />
        </AppLayout>
    );
}
