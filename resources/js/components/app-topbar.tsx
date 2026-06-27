import { Bell, Menu, Search } from 'lucide-react';

export function AppTopbar({
    title,
    onOpenSidebar,
}: {
    title: string;
    onOpenSidebar: () => void;
}) {
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
                <label className="hidden items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm text-muted md:flex">
                    <Search className="size-4" />
                    <input
                        type="search"
                        placeholder="Cari siswa, industri…"
                        className="w-40 bg-transparent text-ink placeholder:text-muted focus:outline-none lg:w-56"
                    />
                </label>

                <button
                    type="button"
                    className="relative grid size-10 place-items-center rounded-full bg-surface text-ink"
                    aria-label="Notifikasi"
                >
                    <Bell className="size-5" />
                    <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-accent ring-2 ring-surface" />
                </button>
            </div>
        </header>
    );
}
