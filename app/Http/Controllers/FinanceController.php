<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetReceiptRequest;
use App\Http\Requests\StoreExpenseRequest;
use App\Models\BudgetReceipt;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Akuntabilitas Dana PKL (M5.1). Wakasek mencatat penerimaan (mis. anggaran
 * komite) & realisasi pengeluaran; halaman menampilkan rekap + saldo berjalan.
 */
class FinanceController extends Controller
{
    public function index(): Response
    {
        $receipts = BudgetReceipt::query()
            ->orderByDesc('received_on')
            ->orderByDesc('id')
            ->get()
            ->map(fn (BudgetReceipt $r): array => [
                'id' => $r->id,
                'source' => $r->source,
                'description' => $r->description,
                'amount' => (float) $r->amount,
                'date' => $r->received_on->format('Y-m-d'),
                'dateLabel' => $r->received_on->translatedFormat('d M Y'),
            ]);

        $expenses = Expense::query()
            ->orderByDesc('spent_on')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Expense $e): array => [
                'id' => $e->id,
                'category' => $e->category,
                'description' => $e->description,
                'amount' => (float) $e->amount,
                'date' => $e->spent_on->format('Y-m-d'),
                'dateLabel' => $e->spent_on->translatedFormat('d M Y'),
            ]);

        $totalReceipts = (float) BudgetReceipt::query()->sum('amount');
        $totalExpenses = (float) Expense::query()->sum('amount');

        return Inertia::render('finance/index', [
            'receipts' => $receipts->values()->all(),
            'expenses' => $expenses->values()->all(),
            'summary' => [
                'totalReceipts' => $totalReceipts,
                'totalExpenses' => $totalExpenses,
                'balance' => $totalReceipts - $totalExpenses,
            ],
        ]);
    }

    public function storeReceipt(StoreBudgetReceiptRequest $request): RedirectResponse
    {
        BudgetReceipt::create($request->validated());

        return back()->with('success', 'Penerimaan dana berhasil dicatat.');
    }

    public function destroyReceipt(BudgetReceipt $budgetReceipt): RedirectResponse
    {
        $budgetReceipt->delete();

        return back()->with('success', 'Penerimaan dana berhasil dihapus.');
    }

    public function storeExpense(StoreExpenseRequest $request): RedirectResponse
    {
        Expense::create($request->validated());

        return back()->with('success', 'Pengeluaran berhasil dicatat.');
    }

    public function destroyExpense(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return back()->with('success', 'Pengeluaran berhasil dihapus.');
    }
}
