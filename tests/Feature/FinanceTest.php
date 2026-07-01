<?php

namespace Tests\Feature;

use App\Models\BudgetReceipt;
use App\Models\Expense;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/keuangan')->assertRedirect('/login');
    }

    public function test_non_wakasek_is_forbidden(): void
    {
        $this->actingAs($this->user('admin'))
            ->get('/keuangan')
            ->assertForbidden();
    }

    public function test_wakasek_sees_summary_with_balance(): void
    {
        BudgetReceipt::factory()->create(['amount' => 1_000_000]);
        Expense::factory()->create(['amount' => 300_000]);

        $this->actingAs($this->user('wakasek'))
            ->get('/keuangan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('finance/index')
                // Whole-number floats round-trip through JSON as ints.
                ->where('summary.totalReceipts', 1_000_000)
                ->where('summary.totalExpenses', 300_000)
                ->where('summary.balance', 700_000)
                ->has('receipts', 1)
                ->has('expenses', 1)
            );
    }

    public function test_wakasek_can_record_receipt(): void
    {
        $this->actingAs($this->user('wakasek'))
            ->post('/keuangan/penerimaan', [
                'source' => 'Anggaran Komite',
                'amount' => 2_500_000,
                'received_on' => '2026-07-01',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('budget_receipts', [
            'source' => 'Anggaran Komite',
            'amount' => '2500000.00',
        ]);
    }

    public function test_wakasek_can_record_expense(): void
    {
        $this->actingAs($this->user('wakasek'))
            ->post('/keuangan/pengeluaran', [
                'category' => 'Transport Monitoring',
                'amount' => 150_000,
                'spent_on' => '2026-07-01',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('expenses', [
            'category' => 'Transport Monitoring',
            'amount' => '150000.00',
        ]);
    }

    public function test_receipt_requires_source_and_amount(): void
    {
        $this->actingAs($this->user('wakasek'))
            ->post('/keuangan/penerimaan', ['source' => '', 'amount' => ''])
            ->assertSessionHasErrors(['source', 'amount', 'received_on']);
    }

    public function test_wakasek_can_delete_receipt(): void
    {
        $receipt = BudgetReceipt::factory()->create();

        $this->actingAs($this->user('wakasek'))
            ->delete("/keuangan/penerimaan/{$receipt->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('budget_receipts', ['id' => $receipt->id]);
    }
}
