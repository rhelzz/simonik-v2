import { update } from '@/actions/App/Http/Controllers/CertificateTemplateController';
import { CertificateTemplateForm } from '@/components/certificates/certificate-template-form';
import type { TemplateDefaults } from '@/components/certificates/certificate-template-form';
import { AppLayout } from '@/layouts/app-layout';

export default function CertificateTemplateEdit({
    template,
    fields,
    fonts,
}: {
    template: TemplateDefaults;
    fields: string[];
    fonts: string[];
}) {
    return (
        <AppLayout title="Template Sertifikat">
            <CertificateTemplateForm
                action={update.url(template.id)}
                method="put"
                fields={fields}
                fonts={fonts}
                template={template}
                submitLabel="Perbarui template"
            />
        </AppLayout>
    );
}
