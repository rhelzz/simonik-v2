<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->boolean('popup_active')->default(false);
            $table->string('popup_icon')->default('smartphone');
            $table->string('popup_title')->nullable()->default('Informasi Penting!');
            $table->text('popup_description')->nullable();
            $table->boolean('popup_has_button')->default(true);
            $table->string('popup_button_text')->nullable()->default('Unduh Sekarang');
            $table->string('popup_button_url')->nullable();
            $table->integer('popup_interval_minutes')->default(5);
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'popup_active',
                'popup_icon',
                'popup_title',
                'popup_description',
                'popup_has_button',
                'popup_button_text',
                'popup_button_url',
                'popup_interval_minutes',
            ]);
        });
    }
};
