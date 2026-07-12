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

export default function Welcome() {
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
                    <Cta />
                </main>
                <SiteFooter />
            </div>
        </>
    );
}
