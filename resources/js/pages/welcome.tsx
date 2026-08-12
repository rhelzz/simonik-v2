import { Head } from '@inertiajs/react';
import { Cta } from '@/components/welcome/cta';
import { Faq } from '@/components/welcome/faq';
import { Features } from '@/components/welcome/features';
import { Hero } from '@/components/welcome/hero';
import { HowItWorks } from '@/components/welcome/how-it-works';
import { Navbar } from '@/components/welcome/navbar';
import { Roles } from '@/components/welcome/roles';
import { SiteFooter } from '@/components/welcome/site-footer';
import { Stats } from '@/components/welcome/stats';

type WelcomeProps = {
    whatsappCtaUrl: string | null;
};

export default function Welcome({ whatsappCtaUrl }: WelcomeProps) {
    return (
        <>
            <Head title="SIMONIK — Sistem Monitoring PKL" />

            <div className="welcome-theme min-h-screen bg-canvas text-ink">
                <Navbar />
                <main className="mx-auto max-w-6xl px-6">
                    <Hero />
                    <Stats />
                    <Features />
                    <Roles />
                    <HowItWorks />
                    <Faq />
                    <Cta whatsappCtaUrl={whatsappCtaUrl} />
                </main>
                <SiteFooter />
            </div>
        </>
    );
}
