import { update } from '@/actions/App/Http/Controllers/IndustryController';
import { IndustryForm } from '@/components/industries/industry-form';
import type {
    IndustryDefaults,
    IndustryOptions,
} from '@/components/industries/industry-form';
import { AppLayout } from '@/layouts/app-layout';

export default function IndustryEdit({
    industry,
    options,
}: {
    industry: IndustryDefaults & { id: number };
    options: IndustryOptions;
}) {
    return (
        <AppLayout title="Edit Industri">
            <IndustryForm
                action={update.url(industry.id)}
                method="put"
                options={options}
                industry={industry}
                submitLabel="Perbarui industri"
            />
        </AppLayout>
    );
}
