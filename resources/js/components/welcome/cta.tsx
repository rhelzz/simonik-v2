import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { create as login } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';

export function Cta() {
    return (
        <section className="py-8 lg:py-10">
            <div className="reveal relative overflow-hidden rounded-4xl bg-linear-to-br from-primary via-primary to-accent px-6 py-12 text-center text-white sm:px-12">
                <div
                    aria-hidden
                    className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl"
                />
                <div
                    aria-hidden
                    className="absolute -bottom-20 -left-10 size-56 rounded-full bg-accent/20 blur-2xl"
                />
                <div className="relative">
                    <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                        Siap memantau PKL lebih rapi?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-base text-white/85">
                        Masuk dengan akun yang diberikan sekolah untuk mulai
                        mengelola dan memantau kegiatan PKL.
                    </p>
                    <Link
                        href={login.url()}
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg shadow-black/10 transition-all hover:bg-primary-soft active:translate-y-px"
                    >
                        Masuk sekarang
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
