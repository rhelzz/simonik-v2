<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WhatsappCtaSettingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/pengaturan-cta-whatsapp')->assertRedirect('/login');
    }

    public function test_non_admins_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/pengaturan-cta-whatsapp')->assertForbidden();
    }

    public function test_admin_can_view_whatsapp_cta_settings(): void
    {
        $this->actingAs($this->admin())
            ->get('/pengaturan-cta-whatsapp')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('whatsapp-cta/edit')
                ->has('whatsapp.message')
            );
    }

    public function test_admin_can_update_whatsapp_cta_settings(): void
    {
        $this->actingAs($this->admin())
            ->put('/pengaturan-cta-whatsapp', [
                'whatsapp_number' => '081234567890',
                'whatsapp_message' => 'Halo, saya ingin diskusi mengenai PKL.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('settings', [
            'whatsapp_number' => '081234567890',
            'whatsapp_message' => 'Halo, saya ingin diskusi mengenai PKL.',
        ]);
    }

    public function test_whatsapp_number_and_message_are_required(): void
    {
        $this->actingAs($this->admin())
            ->put('/pengaturan-cta-whatsapp', [
                'whatsapp_number' => '',
                'whatsapp_message' => '',
            ])
            ->assertSessionHasErrors(['whatsapp_number', 'whatsapp_message']);
    }

    public function test_home_page_exposes_whatsapp_cta_url_when_configured(): void
    {
        Setting::factory()->create([
            'whatsapp_number' => '081234567890',
            'whatsapp_message' => 'Halo, ingin diskusi mengenai PKL.',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where(
                    'whatsappCtaUrl',
                    'https://wa.me/6281234567890?text='.urlencode('Halo, ingin diskusi mengenai PKL.'),
                )
            );
    }

    public function test_home_page_whatsapp_cta_url_is_null_when_not_configured(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('whatsappCtaUrl', null));
    }

    public function test_whatsapp_cta_url_normalizes_leading_zero_to_country_code(): void
    {
        $setting = Setting::factory()->create([
            'whatsapp_number' => '0812-3456-7890',
            'whatsapp_message' => 'Halo',
        ]);

        $this->assertSame(
            'https://wa.me/6281234567890?text=Halo',
            $setting->whatsappCtaUrl(),
        );
    }
}
