import { router, useForm } from '@inertiajs/react';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    LoaderCircle,
    Trash2,
    Wallet,
} from 'lucide-react';
import type { FormEvent } from 'react';
import {
    destroyExpense,
    destroyReceipt,
    storeExpense,
    storeReceipt,
} from '@/actions/App/Http/Controllers/FinanceController';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Receipt = {
    id: number;
    source: string;
    description: string | null;
    amount: number;
    date: string;
    dateLabel: string;
};

type Expense = {
    id: number;
    category: string;
    description: string | null;
    amount: number;
    date: string;
    dateLabel: string;
};

type Props = {
    receipts: Receipt[];
    expenses: Expense[];
    summary: {
        totalReceipts: number;
        totalExpenses: number;
        balance: number;
    };
};

const rupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

const today = (): string => new Date().toISOString().slice(0, 10);

export default function FinanceIndex({ receipts, expenses, summary }: Props) {
    const receiptForm = useForm({
        source: '',
        description: '',
        amount: '',
        received_on: today(),
    });

    const expenseForm = useForm({
        category: '',
        description: '',
        amount: '',
        spent_on: today(),
    });

    function submitReceipt(event: FormEvent) {
        event.preventDefault();
        receiptForm.post(storeReceipt.url(), {
            preserveScroll: true,
            onSuccess: () =>
                receiptForm.reset('source', 'description', 'amount'),
        });
    }

    function submitExpense(event: FormEvent) {
        event.preventDefault();
        expenseForm.post(storeExpense.url(), {
            preserveScroll: true,
            onSuccess: () =>
                expenseForm.reset('category', 'description', 'amount'),
        });
    }

    function removeReceipt(id: number) {
        if (confirm('Hapus catatan penerimaan ini?')) {
            router.delete(destroyReceipt.url(id), { preserveScroll: true });
        }
    }

    function removeExpense(id: number) {
        if (confirm('Hapus catatan pengeluaran ini?')) {
            router.delete(destroyExpense.url(id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Akuntabilitas Dana">
            {/* Ringkasan saldo */}
            <section className="grid gap-4 sm:grid-cols-3">
                <SummaryCard
                    icon={ArrowDownCircle}
                    label="Total penerimaan"
                    value={rupiah(summary.totalReceipts)}
                    tint="bg-positive/15 text-positive"
                />
                <SummaryCard
                    icon={ArrowUpCircle}
                    label="Total pengeluaran"
                    value={rupiah(summary.totalExpenses)}
                    tint="bg-red-500/10 text-red-600"
                />
                <SummaryCard
                    icon={Wallet}
                    label="Saldo"
                    value={rupiah(summary.balance)}
                    tint={cn(
                        summary.balance < 0
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-primary-soft text-primary',
                    )}
                    emphasize
                />
            </section>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
                {/* Penerimaan */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                        <ArrowDownCircle className="size-5 text-positive" />
                        Penerimaan Dana
                    </h2>

                    <form onSubmit={submitReceipt} className="mt-4 space-y-3">
                        <div>
                            <input
                                type="text"
                                placeholder="Sumber (mis. Anggaran Komite)"
                                value={receiptForm.data.source}
                                onChange={(e) =>
                                    receiptForm.setData(
                                        'source',
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            {receiptForm.errors.source && (
                                <p className="mt-1 text-xs font-medium text-red-500">
                                    {receiptForm.errors.source}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Jumlah (Rp)"
                                    value={receiptForm.data.amount}
                                    onChange={(e) =>
                                        receiptForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                {receiptForm.errors.amount && (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        {receiptForm.errors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    value={receiptForm.data.received_on}
                                    onChange={(e) =>
                                        receiptForm.setData(
                                            'received_on',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                {receiptForm.errors.received_on && (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        {receiptForm.errors.received_on}
                                    </p>
                                )}
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Keterangan (opsional)"
                            value={receiptForm.data.description}
                            onChange={(e) =>
                                receiptForm.setData(
                                    'description',
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        />
                        <button
                            type="submit"
                            disabled={receiptForm.processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-positive px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                            {receiptForm.processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Catat Penerimaan
                        </button>
                    </form>

                    <ul className="mt-5 divide-y divide-line">
                        {receipts.length === 0 ? (
                            <li className="py-8 text-center text-sm text-muted">
                                Belum ada penerimaan tercatat.
                            </li>
                        ) : (
                            receipts.map((r) => (
                                <li
                                    key={r.id}
                                    className="flex items-start justify-between gap-3 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">
                                            {r.source}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {r.dateLabel}
                                            {r.description
                                                ? ` · ${r.description}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="font-bold text-positive">
                                            {rupiah(r.amount)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeReceipt(r.id)}
                                            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                                            aria-label="Hapus"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </section>

                {/* Pengeluaran */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                        <ArrowUpCircle className="size-5 text-red-600" />
                        Pengeluaran
                    </h2>

                    <form onSubmit={submitExpense} className="mt-4 space-y-3">
                        <div>
                            <input
                                type="text"
                                placeholder="Kategori (mis. Transport Monitoring)"
                                value={expenseForm.data.category}
                                onChange={(e) =>
                                    expenseForm.setData(
                                        'category',
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            {expenseForm.errors.category && (
                                <p className="mt-1 text-xs font-medium text-red-500">
                                    {expenseForm.errors.category}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Jumlah (Rp)"
                                    value={expenseForm.data.amount}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                {expenseForm.errors.amount && (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        {expenseForm.errors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    value={expenseForm.data.spent_on}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            'spent_on',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                {expenseForm.errors.spent_on && (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        {expenseForm.errors.spent_on}
                                    </p>
                                )}
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Keterangan (opsional)"
                            value={expenseForm.data.description}
                            onChange={(e) =>
                                expenseForm.setData(
                                    'description',
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        />
                        <button
                            type="submit"
                            disabled={expenseForm.processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                            {expenseForm.processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Catat Pengeluaran
                        </button>
                    </form>

                    <ul className="mt-5 divide-y divide-line">
                        {expenses.length === 0 ? (
                            <li className="py-8 text-center text-sm text-muted">
                                Belum ada pengeluaran tercatat.
                            </li>
                        ) : (
                            expenses.map((e) => (
                                <li
                                    key={e.id}
                                    className="flex items-start justify-between gap-3 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">
                                            {e.category}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {e.dateLabel}
                                            {e.description
                                                ? ` · ${e.description}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="font-bold text-red-600">
                                            {rupiah(e.amount)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeExpense(e.id)}
                                            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                                            aria-label="Hapus"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </section>
            </div>
        </AppLayout>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    tint,
    emphasize,
}: {
    icon: typeof Wallet;
    label: string;
    value: string;
    tint: string;
    emphasize?: boolean;
}) {
    return (
        <div className="rounded-2xl bg-surface p-5">
            <span
                className={cn(
                    'grid size-11 place-items-center rounded-xl',
                    tint,
                )}
            >
                <Icon className="size-5" />
            </span>
            <p
                className={cn(
                    'mt-4 font-extrabold tracking-tight text-ink',
                    emphasize ? 'text-2xl' : 'text-xl',
                )}
            >
                {value}
            </p>
            <p className="text-sm font-medium text-muted">{label}</p>
        </div>
    );
}
