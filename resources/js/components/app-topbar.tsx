import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { index as approvalsIndex } from '@/actions/App/Http/Controllers/ApprovalController';
import { index as studentsIndex } from '@/actions/App/Http/Controllers/StudentController';
import type { SharedData } from '@/types';

export function AppTopbar({
    title,
    onOpenSidebar,
}: {
    title: string;
    onOpenSidebar: () => void;
}) {
    const { auth } = usePage<SharedData>().props;
    const [search, setSearch] = useState('');

    // Kotak cari mengarah ke Data Siswa — satu-satunya daftar induk yang
    // dapat ditelusuri lintas halaman, dan hanya dimiliki admin/kaprog.
    const canSearch = auth.roles.some((role) =>
        ['admin', 'kaprog'].includes(role),
    );

    // Lonceng adalah pintasan ke Inbox Persetujuan; hanya role penyetuju
    // yang punya antrian.
    const canApprove = auth.roles.some((role) =>
        ['pembimbing', 'guru', 'kaprog', 'orangtua'].includes(role),
    );
    const pendingCount = auth.pendingApprovalsCount ?? 0;

    return (
        <header className="flex items-center gap-3 px-1 py-1">
            <button
                type="button"
                onClick={onOpenSidebar}
                className="grid size-10 place-items-center rounded-xl bg-surface text-ink lg:hidden"
                aria-label="Buka menu"
            >
                <Menu className="size-5" />
            </button>

            <h1 className="text-lg font-bold text-ink sm:text-xl">{title}</h1>

            <div className="ml-auto flex items-center gap-2">
                {canSearch && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (search.trim() !== '') {
                                router.get(studentsIndex.url(), {
                                    search: search.trim(),
                                });
                            }
                        }}
                        className="hidden items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm text-muted md:flex"
                    >
                        <button
                            type="submit"
                            aria-label="Cari siswa"
                            className="grid place-items-center text-muted transition-colors hover:text-ink"
                        >
                            <Search className="size-4" />
                        </button>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari siswa (nama / NIS)…"
                            className="w-40 bg-transparent text-ink placeholder:text-muted focus:outline-none lg:w-56"
                        />
                    </form>
                )}

                {canApprove && (
                    <Link
                        href={approvalsIndex.url()}
                        aria-label={
                            pendingCount > 0
                                ? `${pendingCount} pengajuan menunggu persetujuan`
                                : 'Tidak ada pengajuan menunggu'
                        }
                        title="Inbox Persetujuan"
                        className="relative grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-canvas"
                    >
                        <Bell className="size-5" />
                        {pendingCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[0.65rem] leading-none font-bold text-white ring-2 ring-surface">
                                {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                        )}
                    </Link>
                )}
            </div>
        </header>
    );
}
