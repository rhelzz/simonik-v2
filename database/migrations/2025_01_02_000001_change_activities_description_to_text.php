<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Jurnal kegiatan kini memakai editor rich-text (HTML), jadi `description`
     * dinaikkan dari VARCHAR(255) ke TEXT agar muat konten berformat.
     */
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->text('description')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('description')->change();
        });
    }
};
