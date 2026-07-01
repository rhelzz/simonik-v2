<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penerimaan dana (mis. anggaran komite) yang dicatat Wakasek.
     */
    public function up(): void
    {
        Schema::create('budget_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('source');
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->date('received_on');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_receipts');
    }
};
