import { router, usePage } from '@inertiajs/react';
import {
    KeyRound,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    bulkDestroy,
    bulkResetPassword,
    destroy,
    index,
    resetPassword,
} from '@/actions/App/Http/Controllers/UserController';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated, SharedData } from '@/types';

type UserItem = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    password_masked: string;
    no_hp: string;
    keterangan: string;
    created_at: string | null;
};

type UsersIndexProps = {
    users: Paginated<UserItem>;
    filters: {
        search: string;
        role: string;
    };
    availableRoles: string[];
};

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    wakasek: 'Wakasek',
    kaprog: 'Kaprog',
    guru: 'Guru',
    pembimbing: 'Pembimbing',
    siswa: 'Siswa',
    orangtua: 'Orang Tua',
};

const ROLE_BADGE_COLORS: Record<string, string> = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    wakasek: 'bg-blue-50 text-blue-700 border-blue-200',
    kaprog: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    guru: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pembimbing: 'bg-amber-50 text-amber-700 border-amber-200',
    siswa: 'bg-sky-50 text-sky-700 border-sky-200',
    orangtua: 'bg-rose-50 text-rose-700 border-rose-200',
};

const ROLE_DOT_COLORS: Record<string, string> = {
    admin: 'bg-purple-600',
    wakasek: 'bg-blue-600',
    kaprog: 'bg-indigo-600',
    guru: 'bg-emerald-600',
    pembimbing: 'bg-amber-500',
    siswa: 'bg-sky-500',
    orangtua: 'bg-rose-500',
};

function RoleDot({ role }: { role: string }) {
    const color = ROLE_DOT_COLORS[role] ?? 'bg-slate-400';

    return <span className={`inline-block size-2 rounded-full ${color}`} />;
}

export default function UsersIndex({
    users,
    filters,
    availableRoles,
}: UsersIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user?.id;

    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? '');
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkResetOpen, setBulkResetOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [singleResetTarget, setSingleResetTarget] = useState<UserItem | null>(
        null,
    );
    const [singleDeleteTarget, setSingleDeleteTarget] =
        useState<UserItem | null>(null);

    const selectableUsers = users.data.filter((u) => u.id !== currentUserId);
    const pageIds = selectableUsers.map((u) => u.id);
    const onPage = selected.filter((id) => pageIds.includes(id));
    const allChecked = pageIds.length > 0 && onPage.length === pageIds.length;
    const someChecked = onPage.length > 0 && !allChecked;

    function toggle(id: number) {
        setSelected((current) =>
            current.includes(id)
                ? current.filter((val) => val !== id)
                : [...current, id],
        );
    }

    function toggleAll() {
        setSelected(allChecked ? [] : pageIds);
    }

    function handleBulkResetPassword() {
        router.post(
            bulkResetPassword.url(),
            { ids: onPage },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelected([]);
                    setBulkResetOpen(false);
                },
            },
        );
    }

    function handleBulkDelete() {
        router.delete(bulkDestroy.url(), {
            data: { ids: onPage },
            preserveScroll: true,
            onSuccess: () => {
                setSelected([]);
                setBulkDeleteOpen(false);
            },
        });
    }

    function handleSingleResetPassword() {
        if (!singleResetTarget) {
            return;
        }

        router.post(
            resetPassword.url(singleResetTarget.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSingleResetTarget(null),
            },
        );
    }

    function handleSingleDelete() {
        if (!singleDeleteTarget) {
            return;
        }

        router.delete(destroy.url(singleDeleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => setSingleDeleteTarget(null),
        });
    }

    const roleOptions: SelectOption[] = useMemo(
        () => [
            { value: '', label: 'Semua role' },
            ...availableRoles.map((r) => ({
                value: r,
                label: ROLE_LABELS[r] ?? r,
                hint: <RoleDot role={r} />,
            })),
        ],
        [availableRoles],
    );

    function applyFilters(nextSearch: string, nextRole: string) {
        router.get(
            index.url(),
            {
                search: nextSearch || undefined,
                role: nextRole || undefined,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        applyFilters(search, role);
    }

    function handleRoleChange(nextRole: string) {
        setRole(nextRole);
        applyFilters(search, nextRole);
    }

    function resetFilters() {
        setSearch('');
        setRole('');
        applyFilters('', '');
    }

    const hasActiveFilters = Boolean(filters.search || filters.role);

    return (
        <AppLayout title="User Management">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Users className="size-5 text-primary" />
                            <h2 className="text-base font-bold text-ink">
                                User Management
                            </h2>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                            {users.total} user terdaftar di sistem dari berbagai
                            peran
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-5 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
                        >
                            <Search className="size-4 shrink-0" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau email user…"
                                className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                            />
                        </form>

                        <div className="w-full sm:w-56">
                            <Select
                                ariaLabel="Filter role"
                                value={role}
                                options={roleOptions}
                                onChange={handleRoleChange}
                                icon={<Shield className="size-4" />}
                                placeholder="Semua role"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>{users.total} hasil ditemukan</span>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-primary-soft hover:text-primary"
                            >
                                <X className="size-3" />
                                Reset filter
                            </button>
                        </div>
                    )}
                </div>

                {/* Bulk Action Bar */}
                {onPage.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-canvas p-3 sm:px-4">
                        <span className="text-xs font-medium text-ink">
                            <strong className="font-bold text-primary">
                                {onPage.length}
                            </strong>{' '}
                            user dipilih di halaman ini
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelected([])}
                                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => setBulkResetOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                            >
                                <KeyRound className="size-3.5" />
                                Reset password ({onPage.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setBulkDeleteOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600"
                            >
                                <Trash2 className="size-3.5" />
                                Hapus ({onPage.length})
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {users.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <UserCheck className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada user ditemukan
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan kata kunci pencarian atau ubah filter
                            role.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-4xl border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="w-10 px-3 pb-3">
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={(node) => {
                                                if (node) {
                                                    node.indeterminate =
                                                        someChecked;
                                                }
                                            }}
                                            onChange={toggleAll}
                                            aria-label="Pilih semua user di halaman ini"
                                            className="size-4 cursor-pointer accent-primary"
                                        />
                                    </th>
                                    <th className="w-12 px-3 pb-3 text-center font-semibold">
                                        No
                                    </th>
                                    <th className="px-3 pb-3 font-semibold">
                                        Role
                                    </th>
                                    <th className="px-3 pb-3 font-semibold">
                                        Nama Lengkap / Email
                                    </th>
                                    <th className="px-3 pb-3 font-semibold">
                                        Password
                                    </th>
                                    <th className="px-3 pb-3 font-semibold">
                                        No. HP
                                    </th>
                                    <th className="px-3 pb-3 font-semibold">
                                        Keterangan
                                    </th>
                                    <th className="px-3 pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {users.data.map((user, idx) => {
                                    const rowNumber = (users.from ?? 1) + idx;
                                    const isSelf = user.id === currentUserId;

                                    return (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-canvas/50"
                                        >
                                            <td className="px-3 py-3.5">
                                                {!isSelf && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.includes(
                                                            user.id,
                                                        )}
                                                        onChange={() =>
                                                            toggle(user.id)
                                                        }
                                                        aria-label={`Pilih ${user.name}`}
                                                        className="size-4 cursor-pointer accent-primary"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-3.5 text-center text-xs font-medium text-muted">
                                                {rowNumber}
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.length === 0 ? (
                                                        <span className="text-xs text-muted">
                                                            -
                                                        </span>
                                                    ) : (
                                                        user.roles.map((r) => (
                                                            <span
                                                                key={r}
                                                                className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${
                                                                    ROLE_BADGE_COLORS[
                                                                        r
                                                                    ] ??
                                                                    'border-slate-200 bg-slate-50 text-slate-700'
                                                                }`}
                                                            >
                                                                {ROLE_LABELS[
                                                                    r
                                                                ] ?? r}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <p className="font-semibold text-ink">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {user.email}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3.5 font-mono text-xs tracking-widest text-muted">
                                                {user.password_masked}
                                            </td>
                                            <td className="px-3 py-3.5 text-ink/80">
                                                {user.no_hp}
                                            </td>
                                            <td className="px-3 py-3.5 text-xs text-muted">
                                                {user.keterangan}
                                            </td>
                                            <td className="px-3 py-3.5 text-right">
                                                {isSelf ? (
                                                    <span className="text-xs font-medium text-muted italic">
                                                        Akun Anda
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSingleResetTarget(
                                                                    user,
                                                                )
                                                            }
                                                            title="Reset password ke default (password)"
                                                            aria-label={`Reset password ${user.name}`}
                                                            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-amber-50 hover:text-amber-600"
                                                        >
                                                            <KeyRound className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSingleDeleteTarget(
                                                                    user,
                                                                )
                                                            }
                                                            title="Hapus akun"
                                                            aria-label={`Hapus ${user.name}`}
                                                            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="mt-5 border-t border-line pt-4">
                        <Pagination meta={users} />
                    </div>
                )}
            </section>

            {/* Single Reset Password Modal */}
            <Modal
                open={Boolean(singleResetTarget)}
                onClose={() => setSingleResetTarget(null)}
                title="Reset Password Akun"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">
                        Password untuk akun{' '}
                        <span className="font-semibold text-ink">
                            {singleResetTarget?.name}
                        </span>{' '}
                        ({singleResetTarget?.email}) akan direset ke default:{' '}
                        <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs font-semibold text-ink">
                            password
                        </code>
                        .
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setSingleResetTarget(null)}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSingleResetPassword}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                        >
                            <KeyRound className="size-4" />
                            Reset password
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Single Delete Modal */}
            <Modal
                open={Boolean(singleDeleteTarget)}
                onClose={() => setSingleDeleteTarget(null)}
                title="Hapus Akun User"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">
                        Akun{' '}
                        <span className="font-semibold text-ink">
                            {singleDeleteTarget?.name}
                        </span>{' '}
                        ({singleDeleteTarget?.email}) akan dihapus permanen
                        beserta data terkait. Tindakan ini tidak dapat
                        dibatalkan.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setSingleDeleteTarget(null)}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSingleDelete}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                        >
                            <Trash2 className="size-4" />
                            Hapus akun
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Reset Password Modal */}
            <Modal
                open={bulkResetOpen}
                onClose={() => setBulkResetOpen(false)}
                title="Reset Password Massal"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">
                        Password untuk{' '}
                        <span className="font-semibold text-ink">
                            {onPage.length} akun terpilih
                        </span>{' '}
                        akan direset menjadi default:{' '}
                        <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs font-semibold text-ink">
                            password
                        </code>
                        .
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setBulkResetOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkResetPassword}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                        >
                            <KeyRound className="size-4" />
                            Reset {onPage.length} password
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Delete Modal */}
            <Modal
                open={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Hapus Akun Terpilih"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">
                        <span className="font-semibold text-ink">
                            {onPage.length} akun terpilih
                        </span>{' '}
                        akan dihapus permanen. Tindakan ini tidak dapat
                        dibatalkan.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setBulkDeleteOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                        >
                            <Trash2 className="size-4" />
                            Hapus {onPage.length} akun
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
